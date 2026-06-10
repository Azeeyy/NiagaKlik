import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'operator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const now = new Date();

    // ─── Users ───
    const allUsers = await User.find({}).select('name email role createdAt').lean() as any[];
    const totalUsers = allUsers.length;
    const totalBuyers = allUsers.filter(u => u.role === 'pembeli').length;
    const totalSellers = allUsers.filter(u => u.role === 'penjual').length;
    const newUsersThisMonth = allUsers.filter(u => {
      const d = new Date(u.createdAt);
      return d >= new Date(now.getFullYear(), now.getMonth(), 1);
    }).length;

    // ─── Orders ───
    const allOrders = await Order.find({}).sort({ createdAt: -1 }).lean() as any[];
    const totalOrders = allOrders.length;

    // By status
    const pendingOrders = allOrders.filter(o => o.orderStatus === 'pending').length;
    const processingOrders = allOrders.filter(o => o.orderStatus === 'diproses').length;
    const shippedOrders = allOrders.filter(o => o.orderStatus === 'dikirim').length;
    const completedOrders = allOrders.filter(o => o.orderStatus === 'selesai').length;
    const cancelledOrders = allOrders.filter(o => o.orderStatus === 'dibatalkan').length;

    // By payment status
    const paidOrders = allOrders.filter(o => o.paymentStatus === 'paid').length;
    const unpaidOrders = allOrders.filter(o => o.paymentStatus === 'pending').length;
    const refundedOrders = allOrders.filter(o => o.paymentStatus === 'refunded').length;

    // ─── Revenue ───
    const paidOrdersList = allOrders.filter(o => o.paymentStatus === 'paid');
    const completedOrdersList = allOrders.filter(o => o.orderStatus === 'selesai');

    const totalRevenue = paidOrdersList.reduce((sum, o: any) => sum + (o.totalAmount || 0), 0);
    const totalGrandRevenue = paidOrdersList.reduce((sum, o: any) => sum + (o.grandTotal || 0), 0);
    const totalPlatformFee = paidOrdersList.reduce((sum, o: any) => sum + (o.platformFee || 0), 0);
    const totalShippingCost = paidOrdersList.reduce((sum, o: any) => sum + (o.shippingCost || 0), 0);

    // Average order value (based on completed orders only)
    const completedRevenue = completedOrdersList.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
    const avgOrderValue = completedOrders > 0
      ? Math.round(completedRevenue / completedOrders)
      : 0;

    // ─── Revenue by Day (last 30 days) ───
    const revenueByDay: { date: string; revenue: number; fee: number; orders: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);

      const dayOrders = paidOrdersList.filter((o: any) => {
        const d = new Date(o.paidAt || o.createdAt);
        return d >= dayStart && d < dayEnd;
      });

      revenueByDay.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayOrders.reduce((sum, o: any) => sum + (o.totalAmount || 0), 0),
        fee: dayOrders.reduce((sum, o: any) => sum + (o.platformFee || 0), 0),
        orders: dayOrders.length,
      });
    }

    // ─── Revenue by Month (last 12 months) ───
    const revenueByMonth: { month: string; revenue: number; fee: number; orders: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1);
      const monthName = month.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      const monthOrders = paidOrdersList.filter((o: any) => {
        const d = new Date(o.paidAt || o.createdAt);
        return d >= month && d < monthEnd;
      });

      revenueByMonth.push({
        month: monthName,
        revenue: monthOrders.reduce((sum, o: any) => sum + (o.totalAmount || 0), 0),
        fee: monthOrders.reduce((sum, o: any) => sum + (o.platformFee || 0), 0),
        orders: monthOrders.length,
      });
    }

    // ─── Top Sellers ───
    const sellerPerformance: Record<string, { name: string; orderCount: number; revenue: number; fees: number }> = {};
    for (const order of paidOrdersList) {
      const sid = (order as any).sellerId?.toString();
      if (!sid) continue;
      if (!sellerPerformance[sid]) {
        sellerPerformance[sid] = {
          name: (order as any).sellerName || 'Unknown',
          orderCount: 0,
          revenue: 0,
          fees: 0,
        };
      }
      sellerPerformance[sid].orderCount++;
      sellerPerformance[sid].revenue += (order as any).totalAmount || 0;
      sellerPerformance[sid].fees += (order as any).platformFee || 0;
    }

    const topSellers = Object.entries(sellerPerformance)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // ─── Top Products (across all sellers) ───
    const productSales: Record<string, { name: string; totalQty: number; totalRevenue: number; sellerName: string }> = {};
    for (const order of allOrders) {
      if ((order as any).orderStatus === 'dibatalkan') continue;
      for (const item of (order as any).items || []) {
        const key = item.productId?.toString() || item.productName;
        if (!productSales[key]) {
          productSales[key] = {
            name: item.productName,
            totalQty: 0,
            totalRevenue: 0,
            sellerName: (order as any).sellerName || '',
          };
        }
        productSales[key].totalQty += item.quantity || 0;
        productSales[key].totalRevenue += item.subtotal || 0;
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 10);

    // ─── Payment Method Breakdown ───
    const paymentBreakdown: Record<string, { count: number; total: number }> = {};
    for (const order of allOrders) {
      const method = (order as any).paymentMethod || 'unknown';
      if (!paymentBreakdown[method]) {
        paymentBreakdown[method] = { count: 0, total: 0 };
      }
      paymentBreakdown[method].count++;
      paymentBreakdown[method].total += (order as any).totalAmount || 0;
    }

    // ─── Monthly Comparison ───
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthFee = paidOrdersList
      .filter((o: any) => new Date(o.paidAt || o.createdAt) >= thisMonthStart)
      .reduce((sum, o: any) => sum + (o.platformFee || 0), 0);
    const lastMonthFee = paidOrdersList
      .filter((o: any) => {
        const d = new Date(o.paidAt || o.createdAt);
        return d >= lastMonthStart && d < thisMonthStart;
      })
      .reduce((sum, o: any) => sum + (o.platformFee || 0), 0);

    const thisMonthTotal = paidOrdersList
      .filter((o: any) => new Date(o.paidAt || o.createdAt) >= thisMonthStart)
      .reduce((sum, o: any) => sum + (o.totalAmount || 0), 0);
    const lastMonthTotal = paidOrdersList
      .filter((o: any) => {
        const d = new Date(o.paidAt || o.createdAt);
        return d >= lastMonthStart && d < thisMonthStart;
      })
      .reduce((sum, o: any) => sum + (o.totalAmount || 0), 0);

    const revenueGrowth = lastMonthTotal > 0
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : thisMonthTotal > 0 ? 100 : 0;

    const feeGrowth = lastMonthFee > 0
      ? Math.round(((thisMonthFee - lastMonthFee) / lastMonthFee) * 100)
      : thisMonthFee > 0 ? 100 : 0;

    // ─── Products count ───
    const totalProducts = await Product.countDocuments({});

    // ─── Recent fee history ───
    const recentFees = paidOrdersList
      .filter((o: any) => (o.platformFee || 0) > 0)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      .map((o: any) => ({
        orderNumber: o.orderNumber,
        totalAmount: o.totalAmount,
        platformFee: o.platformFee,
        paymentMethod: o.paymentMethod,
        sellerName: o.sellerName || '',
        createdAt: o.createdAt,
      }));

    return NextResponse.json({
      marketplace: {
        totalUsers,
        totalBuyers,
        totalSellers,
        newUsersThisMonth,
        totalProducts,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
        paid: paidOrders,
        unpaid: unpaidOrders,
        refunded: refundedOrders,
        avgOrderValue,
      },
      revenue: {
        totalRevenue,
        totalGrandRevenue,
        totalPlatformFee,
        totalShippingCost,
        thisMonth: thisMonthTotal,
        thisMonthFee,
        lastMonth: lastMonthTotal,
        lastMonthFee,
        revenueGrowth,
        feeGrowth,
      },
      charts: {
        revenueByDay,
        revenueByMonth,
      },
      topSellers,
      topProducts,
      paymentBreakdown,
      recentFees,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
