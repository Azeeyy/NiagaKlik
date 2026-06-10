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

    // Calculate totals
    let totalAmount = 0;
    const orderItems = items.map((item: any) => {
      const product = products.find((p: any) => p._id.toString() === item.productId);
      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;
      return {
        productId: product._id,
        productName: product.name,
        productImage: (product.images && product.images[0]) || '',
        quantity: item.quantity,
        price: product.price,
        subtotal,
      };
    });

    const platformFee = paymentMethod !== 'cod' ? calculatePlatformFee(totalAmount) : 0;
    const codFee = paymentMethod === 'cod' ? 5000 : 0;
    const grandTotal = totalAmount + platformFee + (shippingCost || 0) + codFee;

    // Check CN Wallet balance
    if (paymentMethod === 'cn_wallet') {
      const wallet = await Wallet.findOne({ userId: user._id });
      if (!wallet || wallet.balance < grandTotal) {
        return NextResponse.json({ error: 'Saldo CN Wallet tidak mencukupi' }, { status: 400 });
      }
    }

    // Get seller ID from first product (simplified - assumes single seller per order)
    const sellerId = products[0].sellerId;

    // Create order
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      buyerId: user._id,
      sellerId,
      items: orderItems,
      totalAmount,
      platformFee,
      grandTotal,
      shippingCost: shippingCost || 0,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      orderStatus: 'pending',
    });

    // Process payment
    if (paymentMethod === 'cn_wallet') {
      const buyerWallet = await Wallet.findOne({ userId: user._id });
      if (buyerWallet) {
        buyerWallet.balance -= grandTotal;
        buyerWallet.transactions.push({
          type: 'payment',
          amount: grandTotal,
          description: `Pembayaran pesanan #${order.orderNumber}`,
          reference: order.orderNumber,
          status: 'success',
          createdAt: new Date(),
        });
        await buyerWallet.save();
      }
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
      await order.save();

      // Transfer platform fee to system (record in a system wallet or just log)
      // The seller gets paid when buyer confirms completion
    }

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity, soldCount: item.quantity }
      });
    }

    // Create notification for seller
    const seller = await User.findById(sellerId);
    await Notification.create({
      userId: sellerId,
      type: 'order',
      title: 'Pesanan Baru!',
      message: `Pesanan #${order.orderNumber} dari ${user.name} sebesar ${grandTotal.toLocaleString('id-ID')}`,
      link: '/seller/orders',
      metadata: {
        orderId: order._id.toString(),
        amount: grandTotal,
        itemCount: items.length,
      },
    });

    // Create notification for buyer
    await Notification.create({
      userId: user._id,
      type: 'order',
      title: 'Pesanan Dibuat',
      message: `Pesanan #${order.orderNumber} berhasil dibuat. Silakan tunggu diproses penjual.`,
      link: '/dashboard/orders',
      metadata: {
        orderId: order._id.toString(),
        amount: grandTotal,
        itemCount: items.length,
      },
    });

    return NextResponse.json({ order, message: 'Pesanan berhasil dibuat' }, { status: 201 });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat pesanan' }, { status: 500 });
  }
}
