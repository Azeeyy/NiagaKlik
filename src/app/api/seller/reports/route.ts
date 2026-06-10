import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import Wallet from '@/lib/models/Wallet';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'penjual') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbConnect();

    const now = new Date();

    // Get all seller orders
    const allOrders = await Order.find({ sellerId: user._id }).sort({ createdAt: -1 }).lean() as any[];

    // Get total products
    const totalProducts = await Product.countDocuments({ sellerId: user._id });

    // Get wallet
    const wallet = await Wallet.findOne({ userId: user._id }).lean() as any;

    // Calculate revenue stats
    const completedOrders = allOrders.filter(o => o.orderStatus === 'selesai');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalPlatformFees = completedOrders.reduce((sum, o) => sum + (o.platformFee || 0), 0);
    const netRevenue = totalRevenue - totalPlatformFees;
    const totalShippingPaid = completedOrders.reduce((sum, o) => sum + (o.shippingCost || 0), 0);

    // Order count by status
    const pendingOrders = allOrders.filter(o => o.orderStatus === 'pending').length;
    const processingOrders = allOrders.filter(o => o.orderStatus === 'diproses').length;
    const shippedOrders = allOrders.filter(o => o.orderStatus === 'dikirim').length;
    const completedOrdersCount = completedOrders.length;
    const cancelledOrdersCount = allOrders.filter(o => o.orderStatus === 'dibatalkan').length;

    // Revenue by day (last 30 days)
    const revenueByDay: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      
      const dayOrders = completedOrders.filter(o => {
        const d = new Date(o.completedAt || o.createdAt);
        return d >= dayStart && d < dayEnd;
      });
      
      revenueByDay.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        orders: dayOrders.length,
      });
    }

    // Revenue by month (last 6 months)
    const revenueByMonth: { month: string; revenue: number; orders: number; fees: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1);
      const monthName = month.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      
      const monthOrders = completedOrders.filter(o => {
        const d = new Date(o.completedAt || o.createdAt);
        return d >= month && d < monthEnd;
      });

      revenueByMonth.push({
        month: monthName,
        revenue: monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        orders: monthOrders.length,
        fees: monthOrders.reduce((sum, o) => sum + (o.platformFee || 0), 0),
      });
    }

    // Top selling products
    const productSales: Record<string, { name: string; totalQty: number; totalRevenue: number; image: string }> = {};
    for (const order of allOrders) {
      if (order.orderStatus === 'dibatalkan') continue;
      for (const item of order.items || []) {
        const pid = item.productId?.toString() || item.productName;
        if (!productSales[pid]) {
          productSales[pid] = {
            name: item.productName,
            totalQty: 0,
            totalRevenue: 0,
            image: item.productImage || '',
          };
        }
        productSales[pid].totalQty += item.quantity || 0;
        productSales[pid].totalRevenue += item.subtotal || 0;
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 10);

    // Recent orders (last 10)
    const recentOrders = allOrders.slice(0, 10).map(o => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      orderStatus: o.orderStatus,
      totalAmount: o.totalAmount,
      grandTotal: o.grandTotal,
      platformFee: o.platformFee,
      itemCount: o.items?.length || 0,
      createdAt: o.createdAt,
      paymentMethod: o.paymentMethod,
    }));

    // Monthly comparison (this month vs last month)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthRevenue = completedOrders
      .filter(o => new Date(o.completedAt || o.createdAt) >= thisMonthStart)
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const lastMonthRevenue = completedOrders
      .filter(o => {
        const d = new Date(o.completedAt || o.createdAt);
        return d >= lastMonthStart && d < thisMonthStart;
      })
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    const revenueGrowth = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : thisMonthRevenue > 0 ? 100 : 0;

    // Average order value
    const avgOrderValue = completedOrdersCount > 0
      ? Math.round(totalRevenue / completedOrdersCount)
      : 0;

    // Payment method breakdown
    const paymentBreakdown: Record<string, { count: number; total: number }> = {};
    for (const order of allOrders) {
      const method = order.paymentMethod || 'unknown';
      if (!paymentBreakdown[method]) {
        paymentBreakdown[method] = { count: 0, total: 0 };
      }
      paymentBreakdown[method].count++;
      paymentBreakdown[method].total += order.totalAmount || 0;
    }

    return NextResponse.json({
      stats: {
        totalRevenue,
        netRevenue,
        totalPlatformFees,
        totalShippingPaid,
        totalOrders: allOrders.length,
        pendingOrders,
        processingOrders,
        shippedOrders,
        completedOrders: completedOrdersCount,
        cancelledOrders: cancelledOrdersCount,
        totalProducts,
        avgOrderValue,
        revenueGrowth,
        thisMonthRevenue,
        lastMonthRevenue,
        walletBalance: wallet?.balance || 0,
        walletPending: wallet?.pendingBalance || 0,
      },
      revenueByDay,
      revenueByMonth,
      topProducts,
      recentOrders,
      paymentBreakdown,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
