'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDateRelative } from '@/lib/utils';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
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
          <button onClick={markAllRead} className="text-sm text-primary-600 font-semibold hover:text-primary-700">
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p>Tidak ada notifikasi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => !notif.isRead && markAsRead(notif._id)}
              className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all ${
                notif.isRead ? 'border-gray-100' : 'border-primary-200 bg-primary-50/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  notif.type === 'order' ? 'bg-blue-100' :
                  notif.type === 'payment' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <svg className={`w-5 h-5 ${
                    notif.type === 'order' ? 'text-blue-600' :
                    notif.type === 'payment' ? 'text-green-600' : 'text-gray-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{notif.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{notif.message}</p>
                    </div>
                    {!notif.isRead && <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 shrink-0"></div>}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{formatDateRelative(notif.createdAt)}</p>
                </div>
              </div>
              {notif.link && (
                <Link href={notif.link} className="text-sm text-primary-600 font-medium mt-2 inline-block hover:text-primary-700">
                  Lihat Detail →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
