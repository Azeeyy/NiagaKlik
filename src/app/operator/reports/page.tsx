'use client';

import { useState, useEffect } from 'react';
import { formatPrice, formatDate } from '@/lib/utils';

export default function OperatorReportsPage() {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, []);

  async function fetchReports() {
    try {
      const res = await fetch('/api/operator/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="p-8"><div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Laporan Platform</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
          <p className="text-purple-200 text-sm mb-1">Total Fee Platform</p>
          <p className="text-3xl font-bold">{formatPrice(reports?.totalFee || 0)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 text-white">
          <p className="text-blue-200 text-sm mb-1">Total Pesanan</p>
          <p className="text-3xl font-bold">{reports?.totalOrders || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
          <p className="text-green-200 text-sm mb-1">Pesanan Selesai</p>
          <p className="text-3xl font-bold">{reports?.completedOrders || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-6 text-white">
          <p className="text-orange-200 text-sm mb-1">Pesanan Dibatalkan</p>
          <p className="text-3xl font-bold">{reports?.cancelledOrders || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Ringkasan Transaksi</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Volume Transaksi</p>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(reports?.totalRevenue || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Rata-rata Fee per Transaksi</p>
            <p className="text-2xl font-bold text-gray-900">
              {reports?.totalOrders ? formatPrice(Math.round((reports.totalFee || 0) / reports.totalOrders)) : formatPrice(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Riwayat Fee</h2>
        {!reports?.feeHistory || reports.feeHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Belum ada data fee</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Pesanan</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Fee (5%)</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.feeHistory.map((fee: any, i: number) => (
                  <tr key={i}>
                    <td className="px-6 py-4 font-mono text-sm">#{fee.orderNumber}</td>
                    <td className="px-6 py-4 font-semibold">{formatPrice(fee.totalAmount)}</td>
                    <td className="px-6 py-4 text-green-600 font-semibold">{formatPrice(fee.platformFee)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(fee.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
