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

// ─── Color palette ───
const COLORS = {
  primary: '#3b82f6',
  secondary: '#22c55e',
  accent: '#f97316',
  purple: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
  red: '#ef4444',
  yellow: '#eab308',
  blue: '#3b82f6',
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308',
  diproses: '#3b82f6',
  dikirim: '#8b5cf6',
  selesai: '#22c55e',
  dibatalkan: '#ef4444',
};


// ─── Helper Components ───
function StatCard({ icon, label, value, sub, trend, color, delay = 0 }: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
  trend?: { value: number; positive: boolean }; color: string; delay?: number;
}) {
  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300"
          style={{ background: `linear-gradient(135deg, ${color}15, ${color}25)` }}
        >
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
            trend.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            <svg className={`w-3.5 h-3.5 ${trend.positive ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {trend.value}%
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div
      className={`animate-fade-in-up ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <span className="w-1 h-5 bg-secondary-500 rounded-full" />
        {title}
      </h2>
      {action}
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="p-12 text-center">
      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

// ─── Custom Tooltips ───
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
          {entry.name}: {entry.name === 'Pendapatan' || entry.name === 'Fee' ? formatPrice(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3">
      <p className="text-sm font-bold" style={{ color: data.color }}>{data.name}</p>
      <p className="text-xs text-gray-500">{data.value} pesanan</p>
    </div>
  );
}

// ─── Main Page ───
export default function SellerDashboardPage() {
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
        fetch('/api/seller/reports'),
      ]);

      if (!meRes.ok) { router.push('/login?redirect=/seller'); return; }
      const meData = await meRes.json();
      if (meData.user?.role !== 'penjual') { router.push('/'); return; }
      setUser(meData.user);

      if (reportRes.ok) {
        const reportData = await reportRes.json();
        setData(reportData);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-secondary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 animate-pulse">Memuat dashboard...</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { stats, revenueByDay, revenueByMonth, topProducts, recentOrders } = data;

  // Filter chart data by time range
  const chartData = timeRange === '7d' ? revenueByDay?.slice(-7) : revenueByDay;
  const totalRevenue = stats.totalRevenue || 0;
  const netRevenue = stats.netRevenue || 0;
  const totalFees = stats.totalPlatformFees || 0;

  // Order status for donut chart
  const orderStatusData = [
    { name: 'Menunggu', value: stats.pendingOrders || 0, color: STATUS_COLORS.pending },
    { name: 'Diproses', value: stats.processingOrders || 0, color: STATUS_COLORS.diproses },
    { name: 'Dikirim', value: stats.shippedOrders || 0, color: STATUS_COLORS.dikirim },
    { name: 'Selesai', value: stats.completedOrders || 0, color: STATUS_COLORS.selesai },
    { name: 'Dibatalkan', value: stats.cancelledOrders || 0, color: STATUS_COLORS.dibatalkan },
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-8 lg:py-10 overflow-hidden">
      {/* ─── Welcome Hero ─── */}
      <AnimatedSection>
        <div className="relative bg-gradient-to-br from-secondary-600 via-emerald-600 to-teal-800 rounded-3xl p-8 lg:p-10 mb-8 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-400/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '30px 30px' }} />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white/80 text-xs rounded-full border border-white/10">
                  🏪 Dashboard Penjual
                </span>
                {stats.revenueGrowth !== 0 && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    stats.revenueGrowth >= 0 ? 'bg-green-400/20 text-green-200' : 'bg-red-400/20 text-red-200'
                  }`}>
                    <svg className={`w-3 h-3 ${stats.revenueGrowth >= 0 ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    {stats.revenueGrowth}% dari bulan lalu
                  </span>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold mb-2">
                Halo, {user?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-secondary-100/80 text-lg">Kelola toko Anda & pantau performa penjualan</p>
            </div>
            <div className="flex gap-3">
              <Link href="/seller/products/add" className="bg-white text-secondary-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-xl flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Produk
              </Link>
              <Link href="/seller/orders" className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-all flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Pesanan
              </Link>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ─── Stats Cards ─── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Total Pendapatan"
          value={formatPrice(totalRevenue)}
          sub={`Bersih: ${formatPrice(netRevenue)} • Fee: ${formatPrice(totalFees)}`}
          color="green"
          delay={0}
        />
        <StatCard
          icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
          label="Total Produk"
          value={stats.totalProducts?.toString() || '0'}
          sub="Produk terdaftar"
          color="blue"
          delay={100}
        />
        <StatCard
          icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          label="Total Pesanan"
          value={stats.totalOrders?.toString() || '0'}
          sub={`${stats.completedOrders || 0} selesai • ${stats.pendingOrders || 0} menunggu`}
          color="purple"
          delay={200}
        />
        <StatCard
          icon={<svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
          label="Rata-rata Pesanan"
          value={formatPrice(stats.avgOrderValue || 0)}
          sub={`Bulan ini: ${formatPrice(stats.thisMonthRevenue || 0)}`}
          color="orange"
          trend={{ value: stats.revenueGrowth || 0, positive: (stats.revenueGrowth || 0) >= 0 }}
          delay={300}
        />
      </div>

      {/* ─── Main Grid: Revenue Chart + Order Status ─── */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <AnimatedSection className="lg:col-span-2" delay={100}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <SectionHeader title="Tren Pendapatan" />
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setTimeRange('7d')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    timeRange === '7d' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  onClick={() => setTimeRange('30d')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    timeRange === '30d' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  30 Hari
                </button>
              </div>
            </div>
            <div className="h-[300px]">
              {chartData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Pendapatan"
                      stroke={COLORS.secondary}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: COLORS.secondary }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  icon={<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                  message="Belum ada data penjualan untuk ditampilkan"
                />
              )}
            </div>
          </div>
        </AnimatedSection>

        {/* Order Status Donut */}
        <AnimatedSection delay={200}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-full">
            <SectionHeader title="Status Pesanan" />
            <div className="h-[250px]">
              {orderStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  icon={<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                  message="Belum ada pesanan"
                />
              )}
            </div>
            {/* Legend */}
            {orderStatusData.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
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

      {/* ─── Second Row: Monthly Revenue + Top Products ─── */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly Revenue Bar Chart */}
        <AnimatedSection className="lg:col-span-2" delay={300}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <SectionHeader title="Pendapatan Bulanan" />
            <div className="h-[280px]">
              {revenueByMonth?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByMonth} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      tickFormatter={(val) => val.split(' ')[0].substring(0, 3)}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: '8px' }}
                    />
                    <Bar dataKey="revenue" name="Pendapatan" radius={[6, 6, 0, 0]} fill={COLORS.secondary} />
                    <Bar dataKey="fees" name="Fee Platform" radius={[6, 6, 0, 0]} fill={COLORS.accent} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  icon={<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                  message="Belum ada data bulanan"
                />
              )}
            </div>
          </div>
        </AnimatedSection>

        {/* Top Products */}
        <AnimatedSection delay={400}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full">
            <div className="px-6 py-5 border-b border-gray-100">
              <SectionHeader title="Produk Terlaris" />
            </div>
            {topProducts?.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {topProducts.slice(0, 6).map((product: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
                    <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-secondary-100 to-secondary-200 flex items-center justify-center text-xs font-bold text-secondary-700 shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.totalQty} terjual</p>
                    </div>
                    <p className="text-sm font-bold text-green-600">{formatPrice(product.totalRevenue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-gray-500">Belum ada produk terjual</p>
              </div>
            )}
          </div>
        </AnimatedSection>
      </div>

      {/* ─── Third Row: Revenue Breakdown + Recent Orders ─── */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Breakdown */}
        <AnimatedSection delay={500}>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <SectionHeader title="Rincian Pendapatan" />
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pendapatan Kotor</p>
                    <p className="text-lg font-extrabold text-green-700">{formatPrice(totalRevenue)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fee Platform (5%)</p>
                    <p className="text-lg font-extrabold text-orange-700">{formatPrice(totalFees)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ongkos Kirim</p>
                    <p className="text-lg font-extrabold text-blue-700">{formatPrice(stats.totalShippingPaid || 0)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-2">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-secondary-500 to-emerald-600 rounded-xl text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">Pendapatan Bersih</p>
                      <p className="text-xl font-extrabold text-white">{formatPrice(netRevenue)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/60">Wallet</p>
                    <p className="text-sm font-bold text-white">{formatPrice(stats.walletBalance || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Recent Orders */}
        <AnimatedSection className="lg:col-span-2" delay={600}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <SectionHeader title="Pesanan Terbaru" />
              <Link href="/seller/orders" className="text-sm font-semibold text-secondary-600 hover:text-secondary-700 flex items-center gap-1 group">
                Lihat Semua
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentOrders?.length > 0 ? (
                recentOrders.slice(0, 6).map((order: any, i: number) => (
                  <Link key={order._id} href="/seller/orders"
                    className="block px-6 py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-secondary-50/30 transition-all duration-200"
                    style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl flex items-center justify-center text-secondary-600 font-bold text-sm">
                          #{String(i + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                          <p className="text-sm text-gray-500">{formatPrice(order.grandTotal || order.totalAmount)} • {order.itemCount} produk</p>
                          <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                        order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.orderStatus === 'diproses' ? 'bg-blue-100 text-blue-700' :
                        order.orderStatus === 'dikirim' ? 'bg-purple-100 text-purple-700' :
                        order.orderStatus === 'selesai' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {order.orderStatus === 'pending' ? 'Menunggu' :
                         order.orderStatus === 'diproses' ? 'Diproses' :
                         order.orderStatus === 'dikirim' ? 'Dikirim' :
                         order.orderStatus === 'selesai' ? 'Selesai' : 'Dibatalkan'}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Belum ada pesanan masuk</p>
                </div>
              )}
            </div>
          </div>
        </AnimatedSection>
      </div>

      {/* ─── Quick Links ─── */}
      <AnimatedSection delay={700}>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <SectionHeader title="Menu Cepat" />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { href: '/seller/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', label: 'Produk Saya', desc: 'Kelola produk' },
              { href: '/seller/products/add', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6', label: 'Tambah Produk', desc: 'Produk baru' },
              { href: '/seller/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Pesanan', desc: 'Lihat pesanan' },
              { href: '/seller/wallet', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', label: 'Dompet', desc: 'Cek saldo' },
              { href: '/seller/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Notifikasi', desc: 'Lihat notif' },
              { href: '/seller/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', label: 'Pengaturan', desc: 'Atur toko' },
            ].map((item, i) => (
              <Link key={i} href={item.href}
                className="group bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4 hover:shadow-lg hover:border-secondary-100 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                  <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <p className="font-semibold text-sm text-gray-900 group-hover:text-secondary-600 transition-colors">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
