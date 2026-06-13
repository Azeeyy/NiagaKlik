import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Order, { generateOrderNumber } from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import Wallet from '@/lib/models/Wallet';
import Notification from '@/lib/models/Notification';
import User from '@/lib/models/User';
import { getAuthUser } from '@/lib/auth';
import { calculatePlatformFee } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 0;
    const seller = searchParams.get('seller');

    let query: any = {};
    if (seller) {
      query.sellerId = user._id;
    } else {
      query.buyerId = user._id;
    }

    let ordersQuery = Order.find(query)
      .sort({ createdAt: -1 });
    if (limit > 0) {
      ordersQuery = ordersQuery.limit(limit);
    }
    const orders = await ordersQuery
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .lean();

    return NextResponse.json({ orders, stats: { total: orders.length } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Silakan login terlebih dahulu' }, { status: 401 });
    if (user.role !== 'pembeli') return NextResponse.json({ error: 'Hanya pembeli yang bisa membuat pesanan' }, { status: 403 });

    await dbConnect();
    const data = await req.json();
    const { items, shippingAddress, paymentMethod, shippingCost } = data;

    if (!items || items.length === 0) return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 });
    if (!shippingAddress) return NextResponse.json({ error: 'Pilih alamat pengiriman' }, { status: 400 });

    const productIds = items.map((item: any) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== items.length) {
      return NextResponse.json({ error: 'Beberapa produk tidak ditemukan' }, { status: 400 });
    }

    // ─── Group items by sellerId ───
    // Attach product data to each item
    const itemsWithProducts = items.map((item: any) => {
      const product = products.find(
        (p: any) => p._id.toString() === item.productId
      );
      return { item, product };
    });

    // Group by seller
    const sellerGroups: Record<
      string,
      { sellerId: string; sellerName: string; items: any[]; totalAmount: number }
    > = {};

    for (const { item, product } of itemsWithProducts) {
      if (!product) continue;
      const sellerKey = product.sellerId.toString();

      if (!sellerGroups[sellerKey]) {
        sellerGroups[sellerKey] = {
          sellerId: sellerKey,
          sellerName: product.sellerName,
          items: [],
          totalAmount: 0,
        };
      }

      const subtotal = product.price * item.quantity;
      sellerGroups[sellerKey].items.push({
        productId: product._id,
        productName: product.name,
        productImage: (product.images && product.images[0]) || '',
        quantity: item.quantity,
        price: product.price,
        subtotal,
      });
      sellerGroups[sellerKey].totalAmount += subtotal;
    }

    const sellerKeys = Object.keys(sellerGroups);
    const sellerCount = sellerKeys.length;

    // Distribute shipping cost evenly across orders so the total matches checkout preview
    const shippingPerOrder = Math.round((shippingCost || 0) / sellerCount);
    // Remainder goes to the first order to avoid rounding gaps
    const shippingFirstOrder = (shippingCost || 0) - shippingPerOrder * (sellerCount - 1);

    // ─── First pass: compute totals for each seller (without DB writes) ───
    const orderComputations: {
      key: string;
      group: (typeof sellerGroups)[string];
      groupShipping: number;
      groupPlatformFee: number;
      groupCodFee: number;
      groupGrandTotal: number;
    }[] = [];

    let totalGrandForPayment = 0;

    for (let i = 0; i < sellerKeys.length; i++) {
      const key = sellerKeys[i];
      const group = sellerGroups[key];

      // First order gets any rounding remainder
      const groupShipping = i === 0 ? shippingFirstOrder : shippingPerOrder;
      const groupPlatformFee =
        paymentMethod !== 'cod' ? calculatePlatformFee(group.totalAmount) : 0;
      const groupCodFee = paymentMethod === 'cod' ? 5000 : 0;
      const groupGrandTotal =
        group.totalAmount + groupPlatformFee + groupShipping + groupCodFee;

      totalGrandForPayment += groupGrandTotal;

      orderComputations.push({
        key,
        group,
        groupShipping,
        groupPlatformFee,
        groupCodFee,
        groupGrandTotal,
      });
    }

    // Check CN Wallet balance against the actual total before making any DB changes
    if (paymentMethod === 'cn_wallet') {
      const wallet = await Wallet.findOne({ userId: user._id });
      if (!wallet || wallet.balance < totalGrandForPayment) {
        return NextResponse.json(
          { error: 'Saldo CN Wallet tidak mencukupi' },
          { status: 400 }
        );
      }
    }

    // ─── Second pass: create orders, update stock, send notifications ───
    const createdOrders = [];

    for (const comp of orderComputations) {
      const { group, groupShipping, groupPlatformFee, groupGrandTotal } = comp;

      const order = await Order.create({
        orderNumber: generateOrderNumber(),
        buyerId: user._id,
        sellerId: group.sellerId,
        items: group.items,
        totalAmount: group.totalAmount,
        platformFee: groupPlatformFee,
        grandTotal: groupGrandTotal,
        shippingCost: groupShipping,
        shippingAddress,
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        orderStatus: 'pending',
      });

      createdOrders.push(order);

      // Update product stock for items in this group
      for (const item of group.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity, soldCount: item.quantity },
        });
      }

      // Notification for this seller
      await Notification.create({
        userId: group.sellerId,
        type: 'order',
        title: 'Pesanan Baru!',
        message: `Pesanan #${order.orderNumber} dari ${user.name} sebesar ${groupGrandTotal.toLocaleString('id-ID')}`,
        link: '/seller/orders',
        metadata: {
          orderId: order._id.toString(),
          amount: groupGrandTotal,
          itemCount: group.items.length,
        },
      });
    }

    // ─── Process payment once for all orders ───
    if (paymentMethod === 'cn_wallet') {
      const buyerWallet = await Wallet.findOne({ userId: user._id });
      if (buyerWallet) {
        buyerWallet.balance -= totalGrandForPayment;

        // Add one transaction per order for clarity
        for (const order of createdOrders) {
          buyerWallet.transactions.push({
            type: 'payment',
            amount: order.grandTotal,
            description: `Pembayaran pesanan #${order.orderNumber}`,
            reference: order.orderNumber,
            status: 'success',
            createdAt: new Date(),
          });
        }

        await buyerWallet.save();
      }

      // Mark all orders as paid
      await Promise.all(
        createdOrders.map((order) =>
          Order.findByIdAndUpdate(order._id, {
            paymentStatus: 'paid',
            paidAt: new Date(),
          })
        )
      );
    }

    // ─── Notification for buyer ───
    const orderCount = createdOrders.length;
    const orderNumbers = createdOrders.map((o) => `#${o.orderNumber}`).join(', ');

    await Notification.create({
      userId: user._id,
      type: 'order',
      title:
        orderCount > 1
          ? `${orderCount} Pesanan Dibuat`
          : 'Pesanan Dibuat',
      message:
        orderCount > 1
          ? `${orderCount} pesanan berhasil dibuat (${orderNumbers}). Silakan tunggu diproses masing-masing penjual.`
          : `Pesanan ${orderNumbers} berhasil dibuat. Silakan tunggu diproses penjual.`,
      link: '/dashboard/orders',
      metadata: {
        orderId: createdOrders[0]._id.toString(),
        amount: totalGrandForPayment,
        itemCount: items.length,
      },
    });

    return NextResponse.json(
      {
        orders: createdOrders,
        message:
          orderCount > 1
            ? `${orderCount} pesanan berhasil dibuat`
            : 'Pesanan berhasil dibuat',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal membuat pesanan' },
      { status: 500 }
    );
  }
}
