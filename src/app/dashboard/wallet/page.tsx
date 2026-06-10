'use client';

import { useState, useEffect } from 'react';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);

  useEffect(() => { fetchWallet(); }, []);

  async function fetchWallet() {
    try {
      const res = await fetch('/api/wallet');
      if (res.ok) {
        const data = await res.json();
        setWallet(data.wallet);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTopup() {
    const amount = parseInt(topupAmount);
    if (!amount || amount < 10000) {
      toast.error('Minimal top-up Rp 10.000');
      return;
    }

    setTopupLoading(true);
    try {
      const res = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Top-up gagal'); return; }
      toast.success(`Top-up ${formatPrice(amount)} berhasil!`);
      setTopupAmount('');
      fetchWallet();
    } catch { toast.error('Top-up gagal'); }
    finally { setTopupLoading(false); }
  }

  const quickAmounts = [50000, 100000, 200000, 500000];

  if (loading) return <div className="p-8"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dompet Saya</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-primary-600 to-purple-700 rounded-2xl p-8 text-white mb-8">
        <p className="text-primary-100 mb-2">Saldo CN Wallet</p>
        <p className="text-4xl font-bold mb-1">{formatPrice(wallet?.balance || 0)}</p>
        {wallet?.pendingBalance > 0 && (
          <p className="text-sm text-primary-200">Saldo tertahan: {formatPrice(wallet.pendingBalance)}</p>
        )}
      </div>

      {/* Top-up */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Top-up Saldo</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => setTopupAmount(amount.toString())}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              {formatPrice(amount)}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input
            type="number"
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            placeholder="Jumlah top-up (min Rp 10.000)"
            className="input-field flex-1"
          />
          <button onClick={handleTopup} disabled={topupLoading} className="btn-primary">
            {topupLoading ? 'Memproses...' : 'Top-up'}
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Riwayat Transaksi</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {(!wallet?.transactions || wallet.transactions.length === 0) ? (
            <div className="p-6 text-center text-gray-500">
              <p>Belum ada transaksi</p>
            </div>
          ) : (
            [...wallet.transactions].reverse().map((tx: any, i: number) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.type === 'topup' ? 'bg-green-100' :
                    tx.type === 'payment' ? 'bg-red-100' :
                    tx.type === 'withdrawal' ? 'bg-orange-100' :
                    tx.type === 'transfer' ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      tx.type === 'topup' ? 'text-green-600' :
                      tx.type === 'payment' ? 'text-red-600' :
                      tx.type === 'withdrawal' ? 'text-orange-600' :
                      tx.type === 'transfer' ? 'text-blue-600' :
                      'text-gray-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{tx.type === 'topup' ? 'Top-up' : tx.type === 'payment' ? 'Pembayaran' : tx.type === 'withdrawal' ? 'Penarikan' : tx.type === 'transfer' ? 'Transfer' : tx.description}</p>
                    <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                  </div>
                </div>
                <p className={`font-semibold ${
                  tx.type === 'topup' || tx.type === 'refund' || tx.type === 'transfer'
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {tx.type === 'topup' || tx.type === 'refund' || tx.type === 'transfer' ? '+' : '-'}
                  {formatPrice(tx.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
