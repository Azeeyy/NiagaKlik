'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice, getInitials } from '@/lib/utils';

interface ProfileQuickViewProps {
  user: any;
  onClose: () => void;
}

export default function ProfileQuickView({ user, onClose }: ProfileQuickViewProps) {
  const [wallet, setWallet] = useState<any>(null);
  const [ordersCount, setOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  async function fetchStats() {
    try {
      const [walletRes, ordersRes] = await Promise.all([
        fetch('/api/wallet'),
        fetch(user?.role === 'penjual' ? '/api/orders?seller=true&limit=1' : '/api/orders?limit=1'),
      ]);
      if (walletRes.ok) {
        const data = await walletRes.json();
        setWallet(data.wallet);
      }
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrdersCount(data.total || data.orders?.length || 0);
      }
    } catch {}
    finally { setLoading(false); }
  }

  const isSeller = user?.role === 'penjual';
  const dashboardUrl = isSeller ? '/seller' : '/dashboard';
  const settingsUrl = isSeller ? '/seller/settings' : '/dashboard/settings';
  const ordersUrl = isSeller ? '/seller/orders' : '/dashboard/orders';
  const walletUrl = isSeller ? '/seller/wallet' : '/dashboard/wallet';

  const initials = user?.name ? getInitials(user.name) : 'U';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-purple-700 px-6 py-8 text-white text-center relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-600">{initials}</span>
              </div>
            </div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-primary-100 text-sm mt-0.5">{user?.email}</p>
            {user?.phone && <p className="text-primary-200 text-xs mt-1">{user?.phone}</p>}
            <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-medium capitalize">
              {user?.role === 'penjual' ? 'Penjual' : user?.role === 'operator' ? 'Operator' : 'Pembeli'}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
            <div className="py-4 text-center">
              <p className="text-lg font-bold text-gray-900">
                {loading ? (
                  <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse" />
                ) : (
                  formatPrice(wallet?.balance || 0)
                )}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Saldo</p>
            </div>
            <div className="py-4 text-center">
              <p className="text-lg font-bold text-gray-900">
                {loading ? (
                  <span className="inline-block w-6 h-5 bg-gray-200 rounded animate-pulse" />
                ) : (
                  ordersCount
                )}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Pesanan</p>
            </div>
            <div className="py-4 text-center">
              <p className="text-lg font-bold text-gray-900 capitalize">
                {user?.role === 'penjual' ? 'Toko' : user?.role === 'operator' ? 'Admin' : 'User'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Tipe Akun</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-4 space-y-1">
            <Link
              href={dashboardUrl}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            <Link
              href={ordersUrl}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Pesanan Saya
            </Link>
            <Link
              href={walletUrl}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Dompet
            </Link>
            <Link
              href={settingsUrl}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Pengaturan
            </Link>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <Link
              href={settingsUrl}
              onClick={onClose}
              className="text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors"
            >
              Edit Profil Lengkap →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
