'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice, formatDate } from '@/lib/utils';

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, isVisible] as const;
}

function AnimatedBlock({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [ref, isVisible] = useScrollReveal(0.1);
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [meRes, ordersRes, walletRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/orders?limit=5'),
        fetch('/api/wallet'),
      ]);
      if (!meRes.ok) { router.push('/login?redirect=/dashboard'); return; }
      const meData = await meRes.json();
      setUser(meData.user);
      if (ordersRes.ok) { const ordersData = await ordersRes.json(); setOrders(ordersData.orders || []); }
      if (walletRes.ok) { const walletData = await walletRes.json(); setWallet(walletData.wallet); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 animate-pulse">Memuat dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-8 lg:py-10 overflow-hidden">
      {/* Welcome Hero */}
      <AnimatedBlock>
        <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-purple-800 rounded-3xl p-8 lg:p-10 mb-8 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl" />
          <div className="relative">
            <h1 className="text-3xl lg:text-4xl font-extrabold mb-2">Halo, {user?.name}! 👋</h1>
            <p className="text-primary-100/80 text-lg">Selamat datang di dashboard NiagaKlik</p>
          </div>
        </div>
      </AnimatedBlock>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <AnimatedBlock delay={0}>
          <div className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-primary-100 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-500">Saldo Wallet</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">{formatPrice(wallet?.balance || 0)}</p>
            <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse-soft" />
            </div>
          </div>
        </AnimatedBlock>

        <AnimatedBlock delay={100}>
          <Link href="/dashboard/orders" className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-blue-100 hover:-translate-y-1 transition-all duration-300 block">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-500">Total Pesanan</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">{orders.length}</p>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              Lihat detail
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </p>
          </Link>
        </AnimatedBlock>

        <AnimatedBlock delay={200}>
          <Link href="/dashboard/wallet" className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-purple-100 hover:-translate-y-1 transition-all duration-300 block">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-500">Transaksi</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">{wallet?.transactions?.length || 0}</p>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              Riwayat transaksi
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </p>
          </Link>
        </AnimatedBlock>
      </div>

      {/* Quick Links */}
      <AnimatedBlock delay={150}>
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary-500 rounded-full" />
            Menu Cepat
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { href: '/dashboard/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Pesanan Saya', color: 'blue' },
              { href: '/dashboard/wallet', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', label: 'Dompet Saya', color: 'green' },
              { href: '/dashboard/address', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', label: 'Alamat', color: 'purple' },
              { href: '/dashboard/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Notifikasi', color: 'orange' },
              { href: '/dashboard/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', label: 'Pengaturan', color: 'gray' },
            ].map((item, i) => (
              <Link key={i} href={item.href} className="group bg-white border border-gray-100 rounded-xl p-4 hover:shadow-lg hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3">
                <svg className="w-5 h-5 text-primary-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="font-medium text-sm text-gray-700 group-hover:text-primary-600 transition-colors">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </AnimatedBlock>

      {/* Recent Orders */}
      <AnimatedBlock delay={250}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-1 h-5 bg-primary-500 rounded-full" />
              Pesanan Terbaru
            </h2>
            <Link href="/dashboard/orders" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 group">
              Lihat Semua
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {orders.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-3">Belum ada pesanan</p>
                <Link href="/products" className="btn-primary text-sm inline-flex items-center gap-2">
                  Mulai Belanja
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            ) : (
              orders.map((order: any, i: number) => (
                <Link key={order._id} href={`/dashboard/orders/${order._id}`} 
                  className="block px-6 py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-primary-50/30 transition-all duration-200"
                  style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center text-primary-600 font-bold text-sm">
                        #{String(i + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">{order.items?.length} produk - {formatPrice(order.grandTotal)}</p>
                        <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                      order.orderStatus === 'selesai' ? 'bg-green-100 text-green-700' :
                      order.orderStatus === 'dibatalkan' ? 'bg-red-100 text-red-700' :
                      order.orderStatus === 'dikirim' ? 'bg-purple-100 text-purple-700' :
                      order.orderStatus === 'diproses' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </AnimatedBlock>
    </div>
  );
}
