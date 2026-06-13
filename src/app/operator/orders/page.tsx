'use client';

import { useState, useEffect } from 'react';
import { formatPrice, formatDate, getStatusLabel } from '@/lib/utils';

export default function OperatorOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch('/api/operator/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const filteredOrders = filter ? orders.filter(o => o.orderStatus === filter) : orders;

  if (loading) return <div className="p-8"><div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Semua Pesanan</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['', 'pending', 'diproses', 'dikirim', 'selesai', 'dibatalkan'].map((status) => (
          <button key={status} onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === status ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {status || 'Semua'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Pesanan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Pembeli</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Penjual</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Fee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Tidak ada pesanan</td></tr>
              ) : filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-mono text-sm font-medium">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{order.items?.length} produk</p>
                  </td>
                  <td className="px-6 py-4 text-sm">{order.buyerId?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm">{order.sellerId?.name || 'N/A'}</td>
                  <td className="px-6 py-4 font-semibold">{formatPrice(order.grandTotal || order.totalAmount)}</td>
                  <td className="px-6 py-4 text-sm">{order.platformFee ? formatPrice(order.platformFee) : '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      order.orderStatus === 'selesai' ? 'bg-green-100 text-green-700' :
                      order.orderStatus === 'dibatalkan' ? 'bg-red-100 text-red-700' :
                      order.orderStatus === 'dikirim' ? 'bg-purple-100 text-purple-700' :
                      order.orderStatus === 'diproses' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{getStatusLabel(order.orderStatus)}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
