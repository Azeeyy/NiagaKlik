'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatPrice, formatDate, getStatusLabel } from '@/lib/utils';

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) fetchOrder();
  }, [params.id]);

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="p-8"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div></div>;
  if (!order) return <div className="text-center py-20"><p className="text-gray-500">Pesanan tidak ditemukan</p></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/dashboard/orders" className="text-sm text-gray-500 hover:text-primary-600 mb-4 inline-block">← Kembali</Link>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">#{order.orderNumber}</h1>
            <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
          </div>
          <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${
            order.orderStatus === 'selesai' ? 'bg-green-100 text-green-700' :
            order.orderStatus === 'dibatalkan' ? 'bg-red-100 text-red-700' :
            order.orderStatus === 'dikirim' ? 'bg-purple-100 text-purple-700' :
            order.orderStatus === 'diproses' ? 'bg-blue-100 text-blue-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>{getStatusLabel(order.orderStatus)}</span>
        </div>

        <div className="space-y-4 mb-6">
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 font-medium">{item.quantity}x</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{item.productName}</p>
                <p className="text-sm text-gray-500">{formatPrice(item.price)}</p>
              </div>
              <p className="font-bold">{formatPrice(item.subtotal)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatPrice(order.totalAmount)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Ongkos Kirim</span><span className="font-medium">{formatPrice(order.shippingCost || 0)}</span></div>
          {order.platformFee > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Biaya Platform</span><span className="font-medium">{formatPrice(order.platformFee)}</span></div>}
          <div className="flex justify-between text-lg font-bold border-t pt-3"><span>Total</span><span className="text-primary-600">{formatPrice(order.grandTotal)}</span></div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="font-semibold mb-2">Alamat Pengiriman</h3>
          <p className="text-sm text-gray-600">{order.shippingAddress?.fullAddress}</p>
          <p className="text-sm text-gray-600">{order.shippingAddress?.city}, {order.shippingAddress?.province}</p>
          <p className="text-sm text-gray-500">{order.shippingAddress?.recipientName} - {order.shippingAddress?.recipientPhone}</p>
        </div>
      </div>
    </div>
  );
}
