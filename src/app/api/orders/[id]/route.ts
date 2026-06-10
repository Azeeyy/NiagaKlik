import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Wallet from '@/lib/models/Wallet';
import Notification from '@/lib/models/Notification';
import User from '@/lib/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const order = await Order.findById(params.id)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .lean() as any;

    if (!order) return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });

    // Verify user has access (buyer, seller, or operator)
    const userIdStr = user._id.toString();
    const isBuyer = order.buyerId?._id?.toString() === userIdStr || order.buyerId?.toString() === userIdStr;
    const isSeller = order.sellerId?._id?.toString() === userIdStr || order.sellerId?.toString() === userIdStr;
    
    if (!isBuyer && !isSeller && user.role !== 'operator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const data = await req.json();
    const order = await Order.findById(params.id);

    if (!order) return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });

    const { action } = data;

    switch (action) {
      case 'process': {
        if (user.role !== 'penjual' || order.sellerId.toString() !== user._id.toString()) {
          return NextResponse.json({ error: 'Hanya penjual yang bisa memproses' }, { status: 403 });
        }
        if (order.orderStatus !== 'pending') {
          return NextResponse.json({ error: 'Status pesanan tidak valid' }, { status: 400 });
        }
        order.orderStatus = 'diproses';
        order.processedAt = new Date();
        
        await Notification.create({
          userId: order.buyerId,
          type: 'order',
          title: 'Pesanan Diproses',
          message: `Pesanan #${order.orderNumber} sedang diproses penjual.`,
          link: '/dashboard/orders',
        });
        break;
      }
      case 'ship': {
        if (user.role !== 'penjual' || order.sellerId.toString() !== user._id.toString()) {
          return NextResponse.json({ error: 'Hanya penjual yang bisa mengirim' }, { status: 403 });
        }
        if (order.orderStatus !== 'diproses') {
          return NextResponse.json({ error: 'Pesanan harus diproses dulu' }, { status: 400 });
        }
        order.orderStatus = 'dikirim';
        order.shippedAt = new Date();
        order.trackingNumber = data.trackingNumber || `NK-${Date.now().toString(36).toUpperCase()}`;

        await Notification.create({
          userId: order.buyerId,
          type: 'order',
          title: 'Pesanan Dikirim',
          message: `Pesanan #${order.orderNumber} telah dikirim.`,
          link: '/dashboard/orders',
        });
        break;
      }
      case 'complete': {
        if (user.role !== 'pembeli' || order.buyerId.toString() !== user._id.toString()) {
          return NextResponse.json({ error: 'Hanya pembeli yang bisa konfirmasi' }, { status: 403 });
        }
        if (order.orderStatus !== 'dikirim') {
          return NextResponse.json({ error: 'Pesanan belum dikirim' }, { status: 400 });
        }
        order.orderStatus = 'selesai';
        order.completedAt = new Date();

        // Transfer money to seller (only for non-COD)
        if (order.paymentMethod !== 'cod') {
          const sellerWallet = await Wallet.findOne({ userId: order.sellerId });
          if (sellerWallet) {
            const sellerAmount = order.totalAmount - order.platformFee;
            sellerWallet.balance += sellerAmount;
            sellerWallet.transactions.push({
              type: 'transfer',
              amount: sellerAmount,
              description: `Pendapatan dari pesanan #${order.orderNumber}`,
              reference: order.orderNumber,
              status: 'success',
              createdAt: new Date(),
            });
            await sellerWallet.save();
          }
        }

        await Notification.create({
          userId: order.sellerId,
          type: 'order',
          title: 'Pesanan Selesai',
          message: `Pesanan #${order.orderNumber} telah dikonfirmasi selesai oleh pembeli.`,
          link: '/seller/orders',
        });
        break;
      }
      case 'cancel': {
        const isBuyer = order.buyerId.toString() === user._id.toString();
        const isSeller = order.sellerId.toString() === user._id.toString();
        
        if (!isBuyer && !isSeller) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (isBuyer && order.orderStatus !== 'pending') {
          return NextResponse.json({ error: 'Pembeli hanya bisa membatalkan pesanan pending' }, { status: 400 });
        }
        if (isSeller && order.orderStatus !== 'pending' && order.orderStatus !== 'diproses') {
          return NextResponse.json({ error: 'Penjual hanya bisa membatalkan pesanan pending/diproses' }, { status: 400 });
        }

        order.orderStatus = 'dibatalkan';
        order.cancelledAt = new Date();
        order.cancelledBy = isBuyer ? 'buyer' : 'seller';
        order.cancelReason = data.reason || '';

        // Restore stock
        for (const item of order.items) {
          const Product = (await import('@/lib/models/Product')).default;
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.quantity, soldCount: -item.quantity }
          });
        }

        // Refund if paid
        if (order.paymentStatus === 'paid' && order.paymentMethod === 'cn_wallet') {
          const buyerWallet = await Wallet.findOne({ userId: order.buyerId });
          if (buyerWallet) {
            buyerWallet.balance += order.grandTotal;
            buyerWallet.transactions.push({
              type: 'refund',
              amount: order.grandTotal,
              description: `Refund pesanan #${order.orderNumber}`,
              reference: order.orderNumber,
              status: 'success',
              createdAt: new Date(),
            });
            await buyerWallet.save();
          }
          order.paymentStatus = 'refunded';
        }

        await Notification.create({
          userId: isBuyer ? order.sellerId : order.buyerId,
          type: 'order',
          title: 'Pesanan Dibatalkan',
          message: `Pesanan #${order.orderNumber} dibatalkan oleh ${isBuyer ? 'pembeli' : 'penjual'}.`,
          link: '/dashboard/orders',
        });
        break;
      }
      default:
        return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 });
    }

    await order.save();
    return NextResponse.json({ order, message: 'Status pesanan diperbarui' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memperbarui pesanan' }, { status: 500 });
  }
}
