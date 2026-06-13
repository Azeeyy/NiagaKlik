'use client';

import { useState, useEffect } from 'react';
import { formatPrice, formatDate, getStatusLabel } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SellerOrdersPage() {
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
      const res = await fetch('/api/orders?seller=true');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleAction(orderId: string, action: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Gagal'); return; }
      const messages: Record<string, string> = { process: 'Pesanan diproses', ship: 'Pesanan dikirim', cancel: 'Pesanan dibatalkan' };
      toast.success(messages[action] || 'Berhasil');
      fetchOrders();
    } catch { toast.error('Gagal'); }
  }

  const filteredOrders = filter ? orders.filter(o => o.orderStatus === filter) : orders;

  if (loading) return <div className="p-8"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Pesanan Masuk</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['', 'pending', 'diproses', 'dikirim', 'selesai', 'dibatalkan'].map((status) => (
          <button key={status} onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === status ? 'bg-secondary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {status ? getStatusLabel(status) : 'Semua'}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 text-gray-500"><p>Tidak ada pesanan</p></div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  <p className="font-bold text-gray-900 mt-1">{formatPrice(order.totalAmount)}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-xs font-semibold ${
                    order.orderStatus === 'selesai' ? 'bg-green-100 text-green-700' :
                    order.orderStatus === 'dibatalkan' ? 'bg-red-100 text-red-700' :
                    order.orderStatus === 'dikirim' ? 'bg-purple-100 text-purple-700' :
                    order.orderStatus === 'diproses' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{getStatusLabel(order.orderStatus)}</span>
                </div>
                <p className="text-xs text-gray-400 font-mono">#{order.orderNumber}</p>
              </div>

              <div className="space-y-2 mb-4">
                {order.items?.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 shrink-0">{item.quantity}x</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-gray-500">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                {order.orderStatus === 'pending' && (
                  <>
                    <button onClick={() => handleAction(order._id, 'process')} className="btn-primary text-sm px-4 py-2">Proses Pesanan</button>
                    <button onClick={() => handleAction(order._id, 'cancel')} className="btn-danger text-sm px-4 py-2">Batalkan</button>
                  </>
                )}
                {order.orderStatus === 'diproses' && (
                  <>
                    <button onClick={() => handleAction(order._id, 'ship')} className="btn-primary text-sm px-4 py-2">Kirim Pesanan</button>
                    <button onClick={() => handleAction(order._id, 'cancel')} className="btn-danger text-sm px-4 py-2">Batalkan</button>
                  </>
                )}
                {order.orderStatus === 'selesai' && (
                  <p className="text-sm text-green-600 font-medium">✓ Pesanan selesai</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
