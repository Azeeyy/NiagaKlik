'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, Legend,
} from 'recharts';

// ─── Colors ───
const COLORS_PIE = ['#8b5cf6', '#3b82f6', '#22c55e', '#f97316', '#ef4444', '#eab308'];
const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308',
  diproses: '#3b82f6',
  dikirim: '#8b5cf6',
  selesai: '#22c55e',
  dibatalkan: '#ef4444',
};
const TOP_SELLER_COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#f97316', '#ec4899', '#14b8a6', '#eab308', '#ef4444', '#06b6d4', '#84cc16'];

function ChartTooltip({ active, payload, label, format = 'currency' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
          {entry.name}: {format === 'currency' ? formatPrice(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div className={`animate-fade-in-up ${className}`} style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <span className="w-1 h-5 bg-purple-500 rounded-full" />
        {title}
      </h2>
      {action}
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="p-12 text-center">
      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">{icon}</div>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

export default function OperatorDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('30d');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [meRes, reportRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/operator/reports'),
      ]);

      if (!meRes.ok) { router.push('/login?redirect=/operator'); return; }
      const meData = await meRes.json();
      if (meData.user?.role !== 'operator') { router.push('/'); return; }
      setUser(meData.user);

      if (reportRes.ok) {
        setData(await reportRes.json());
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 animate-pulse">Memuat laporan marketplace...</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { marketplace, orders, revenue, charts, topSellers, topProducts, paymentBreakdown, recentFees } = data;
  const chartData = timeRange === '7d' ? charts.revenueByDay?.slice(-7) : charts.revenueByDay;

  // Order status for donut
  const orderStatusData = [
    { name: 'Menunggu', value: orders.pending, color: STATUS_COLORS.pending },
    { name: 'Diproses', value: orders.processing, color: STATUS_COLORS.diproses },
    { name: 'Dikirim', value: orders.shipped, color: STATUS_COLORS.dikirim },
    { name: 'Selesai', value: orders.completed, color: STATUS_COLORS.selesai },
    { name: 'Dibatalkan', value: orders.cancelled, color: STATUS_COLORS.dibatalkan },
  ].filter(d => d.value > 0);

  // Payment breakdown
  const paymentData = Object.entries(paymentBreakdown || {}).map(([key, val]: any) => ({
    name: key === 'cn_wallet' ? 'CN Wallet' : key === 'qris' ? 'QRIS' : key === 'cod' ? 'COD' : key,
    value: val.count,
    total: val.total,
  }));

  return (
    <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-8 lg:py-10 overflow-hidden">
      {/* ─── Hero ─── */}
      <AnimatedSection>
        <div className="relative bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-900 rounded-3xl p-8 lg:p-10 mb-8 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-400/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '30px 30px' }} />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white/80 text-xs rounded-full border border-white/10">🔒 Panel Operator</span>
                {revenue.revenueGrowth !== 0 && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${revenue.revenueGrowth >= 0 ? 'bg-green-400/20 text-green-200' : 'bg-red-400/20 text-red-200'}`}>
                    <svg className={`w-3 h-3 ${revenue.revenueGrowth >= 0 ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    {revenue.revenueGrowth}% dari bulan lalu
                  </span>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold mb-2">Marketplace Overview 📊</h1>
              <p className="text-purple-100/80 text-lg">Pantau seluruh aktivitas jual-beli di NiagaKlik</p>
            </div>
            <div className="flex gap-3">
              <Link href="/operator/users" className="bg-white text-purple-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-xl flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
                Kelola Users
              </Link>
              <Link href="/operator/orders" className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-all flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Pesanan
              </Link>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ─── Marketplace Stats ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Total User', value: marketplace.totalUsers, sub: `${marketplace.newUsersThisMonth} baru bulan ini`, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', color: '#8b5cf6' },
          { label: 'Pembeli', value: marketplace.totalBuyers, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: '#3b82f6' },
          { label: 'Penjual', value: marketplace.totalSellers, icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: '#22c55e' },
          { label: 'Total Produk', value: marketplace.totalProducts, icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: '#f97316' },
          { label: 'Total Pesanan', value: orders.total, sub: `${orders.completed} selesai`, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: '#ec4899' },
          { label: 'Rata-rata Pesanan', value: formatPrice(orders.avgOrderValue), icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', color: '#14b8a6' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${item.color}15` }}>
                <svg className="w-5 h-5" fill="none" stroke={item.color} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{item.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
            {item.sub && <p className="text-[10px] text-gray-400 mt-0.5">{item.sub}</p>}
          </div>
        ))}
      </div>

      {/* ─── Revenue Section ─── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <AnimatedSection delay={100}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 mb-1">Total Pendapatan Marketplace</p>
            <p className="text-3xl font-extrabold text-purple-600">{formatPrice(revenue.totalRevenue)}</p>
          </div>
        </AnimatedSection>
        <AnimatedSection delay={150}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 mb-1">Fee Platform Terkumpul</p>
            <p className="text-3xl font-extrabold text-orange-600">{formatPrice(revenue.totalPlatformFee)}</p>
          </div>
        </AnimatedSection>
        <AnimatedSection delay={200}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 mb-1">Bulan Ini</p>
            <p className="text-2xl font-extrabold text-green-600">{formatPrice(revenue.thisMonth)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Fee: {formatPrice(revenue.thisMonthFee)}</p>
          </div>
        </AnimatedSection>
        <AnimatedSection delay={250}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 mb-1">Total Biaya Kirim</p>
            <p className="text-3xl font-extrabold text-blue-600">{formatPrice(revenue.totalShippingCost)}</p>
          </div>
        </AnimatedSection>
      </div>

      {/* ─── Charts Row ─── */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Line Chart */}
        <AnimatedSection className="lg:col-span-2" delay={200}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <SectionHeader title="Tren Pendapatan Marketplace" />
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button onClick={() => setTimeRange('7d')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${timeRange === '7d' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>7 Hari</button>
                <button onClick={() => setTimeRange('30d')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${timeRange === '30d' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>30 Hari</button>
              </div>
            </div>
            <div className="h-[300px]">
              {chartData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(val) => { const d = new Date(val); return `${d.getDate()}/${d.getMonth() + 1}`; }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="revenue" name="Pendapatan" stroke="#8b5cf6" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#8b5cf6' }} />
                    <Line type="monotone" dataKey="fee" name="Fee Platform" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#f97316' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} message="Belum ada data penjualan" />
              )}
            </div>
          </div>
        </AnimatedSection>

        {/* Order Status Donut */}
        <AnimatedSection delay={300}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-full">
            <SectionHeader title="Status Pesanan" />
            <div className="h-[220px]">
              {orderStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {orderStatusData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} message="Belum ada pesanan" />
              )}
            </div>
            {orderStatusData.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 mt-3">
                {orderStatusData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-600">{item.name}: <strong>{item.value}</strong></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AnimatedSection>
      </div>

      {/* ─── Monthly Revenue + Payment Methods ─── */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly Revenue Bar */}
        <AnimatedSection className="lg:col-span-2" delay={400}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <SectionHeader title="Pendapatan & Fee Bulanan" />
            <div className="h-[280px]">
              {charts.revenueByMonth?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.revenueByMonth} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => val.split(' ')[0].substring(0, 3)} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: '8px' }} />
                    <Bar dataKey="revenue" name="Pendapatan" radius={[6, 6, 0, 0]} fill="#8b5cf6" />
                    <Bar dataKey="fee" name="Fee Platform" radius={[6, 6, 0, 0]} fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} message="Belum ada data bulanan" />
              )}
            </div>
          </div>
        </AnimatedSection>

        {/* Payment Methods + Revenue Breakdown */}
        <AnimatedSection delay={500}>
          <div className="space-y-6">
            {/* Payment Methods */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <SectionHeader title="Metode Pembayaran" />
              <div className="space-y-3">
                {paymentData.length > 0 ? paymentData.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS_PIE[i % COLORS_PIE.length] }} />
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{item.value}×</p>
                      <p className="text-xs text-gray-400">{formatPrice(item.total)}</p>
                    </div>
                  </div>
                )) : <p className="text-sm text-gray-500 text-center py-4">Belum ada data pembayaran</p>}
              </div>
            </div>

            {/* Quick Summary */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
              <p className="text-sm font-medium text-purple-100 mb-1">Ringkasan Marketplace</p>
              <div className="space-y-2 mt-3">
                <div className="flex justify-between text-sm"><span>Fee terkumpul</span><span className="font-bold">{formatPrice(revenue.totalPlatformFee)}</span></div>
                <div className="flex justify-between text-sm"><span>Fee bulan ini</span><span className="font-bold">{formatPrice(revenue.thisMonthFee)}</span></div>
                <div className="flex justify-between text-sm border-t border-white/20 pt-2 mt-2">
                  <span>Growth fee</span>
                  <span className={`font-bold ${revenue.feeGrowth >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {revenue.feeGrowth >= 0 ? '+' : ''}{revenue.feeGrowth}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>

      {/* ─── Top Sellers + Top Products ─── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <AnimatedSection delay={600}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-6 py-5 border-b border-gray-100">
              <SectionHeader title="Top Penjual" />
            </div>
            {topSellers?.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {topSellers.map((seller: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: TOP_SELLER_COLORS[i % TOP_SELLER_COLORS.length] }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{seller.name}</p>
                      <p className="text-xs text-gray-400">{seller.orderCount} pesanan</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-purple-600">{formatPrice(seller.revenue)}</p>
                      <p className="text-xs text-orange-500">Fee: {formatPrice(seller.fees)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} message="Belum ada penjual aktif" />
            )}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={700}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-6 py-5 border-b border-gray-100">
              <SectionHeader title="Produk Terlaris" />
            </div>
            {topProducts?.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {topProducts.slice(0, 8).map((product: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
                    <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-xs font-bold text-purple-700 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.totalQty} terjual • {product.sellerName}</p>
                    </div>
                    <p className="text-sm font-bold text-purple-600">{formatPrice(product.totalRevenue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} message="Belum ada produk terjual" />
            )}
          </div>
        </AnimatedSection>
      </div>

      {/* ─── Recent Fees ─── */}
      <AnimatedSection delay={800}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-100">
            <SectionHeader title="Riwayat Fee Terbaru" />
          </div>
          {recentFees?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Penjual</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee (5%)</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pembayaran</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentFees.map((fee: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{fee.orderNumber}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-600">{fee.sellerName}</td>
                      <td className="px-6 py-3.5 text-sm font-bold text-gray-900">{formatPrice(fee.totalAmount)}</td>
                      <td className="px-6 py-3.5 text-sm font-bold text-orange-600">{formatPrice(fee.platformFee)}</td>
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700">
                          {fee.paymentMethod === 'cn_wallet' ? 'CN Wallet' : fee.paymentMethod === 'qris' ? 'QRIS' : fee.paymentMethod === 'cod' ? 'COD' : fee.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">{formatDate(fee.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} message="Belum ada fee yang tercatat" />
          )}
        </div>
      </AnimatedSection>
    </div>
  );
}
