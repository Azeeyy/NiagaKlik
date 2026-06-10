'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDateRelative, formatPrice } from '@/lib/utils';

export default function SellerNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState<any>(null);

  useEffect(() => { fetchNotifications(); }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function markAllRead() {
    try {
      await fetch('/api/notifications', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  }

  if (loading) return <div className="p-8"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notifikasi</h1>
        {notifications.some(n => !n.isRead) && (
          <button onClick={markAllRead} className="text-sm text-primary-600 font-semibold">Tandai Semua Dibaca</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 text-gray-500"><p>Tidak ada notifikasi</p></div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => setSelectedNotif(notif)}
              className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                notif.isRead ? 'border-gray-100' : 'border-primary-200 bg-primary-50/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{notif.title}</p>
                      <p className="text-sm text-gray-600">{notif.message}</p>
                    </div>
                    {!notif.isRead && <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 shrink-0"></div>}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{formatDateRelative(notif.createdAt)}</p>
                </div>
              </div>
              {notif.link && (
                <Link href={notif.link} className="text-sm text-primary-600 font-medium mt-2 inline-block">Lihat Detail →</Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Expanded Notification Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-primary-50 border-b border-gray-200 px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedNotif.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{formatDateRelative(selectedNotif.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
              {/* Message */}
              <div className="mb-8">
                <p className="text-gray-700 text-lg leading-relaxed">{selectedNotif.message}</p>
              </div>

              {/* Metadata - Price Details */}
              {selectedNotif.metadata && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-4">Detail Pesanan</h3>
                  <div className="space-y-3">
                    {selectedNotif.metadata.orderId && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">ID Pesanan:</span>
                        <span className="font-mono text-sm bg-white px-3 py-1 rounded-lg text-gray-900">
                          {selectedNotif.metadata.orderId.slice(-8).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {selectedNotif.metadata.itemCount && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Jumlah Item:</span>
                        <span className="font-semibold text-gray-900">{selectedNotif.metadata.itemCount} item</span>
                      </div>
                    )}
                    {selectedNotif.metadata.amount && (
                      <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                        <span className="text-gray-600 font-medium">Total Pesanan:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatPrice(selectedNotif.metadata.amount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              {selectedNotif.link && (
                <Link
                  href={selectedNotif.link}
                  className="w-full block text-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Lihat Pesanan Lengkap
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
