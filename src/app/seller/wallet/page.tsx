'use client';

import { useState, useEffect } from 'react';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SellerWalletPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawTo, setWithdrawTo] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => { fetchWallet(); }, []);

  async function fetchWallet() {
    try {
      const res = await fetch('/api/wallet');
      if (res.ok) {
        const data = await res.json();
        setWallet(data.wallet);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleWithdraw() {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount < 50000) { toast.error('Minimal penarikan Rp 50.000'); return; }
    if (!withdrawTo) { toast.error('Pilih tujuan penarikan'); return; }

    setWithdrawLoading(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, destination: withdrawTo }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Penarikan gagal'); return; }
      toast.success('Permintaan penarikan diproses');
      setWithdrawAmount('');
      fetchWallet();
    } catch { toast.error('Penarikan gagal'); }
    finally { setWithdrawLoading(false); }
  }

  if (loading) return <div className="p-8"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dompet Penjual</h1>

      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-secondary-600 to-emerald-700 rounded-2xl p-8 text-white">
          <p className="text-secondary-100 mb-2">Saldo Tersedia</p>
          <p className="text-4xl font-bold">{formatPrice(wallet?.balance || 0)}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-8 text-white">
          <p className="text-yellow-100 mb-2">Saldo Tertahan</p>
          <p className="text-4xl font-bold">{formatPrice(wallet?.pendingBalance || 0)}</p>
        </div>
      </div>

      {/* Withdraw */}
      {wallet && wallet.balance > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tarik Saldo</h2>
          <div className="flex gap-3 mb-4">
            <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Jumlah penarikan" className="input-field flex-1" />
            <select value={withdrawTo} onChange={(e) => setWithdrawTo(e.target.value)} className="input-field max-w-[200px]">
              <option value="">Ke mana?</option>
              <option value="Bank BCA">Bank BCA</option>
              <option value="Bank Mandiri">Bank Mandiri</option>
              <option value="GoPay">GoPay</option>
              <option value="OVO">OVO</option>
              <option value="DANA">DANA</option>
            </select>
          </div>
          <button onClick={handleWithdraw} disabled={withdrawLoading} className="btn-primary">
            {withdrawLoading ? 'Memproses...' : 'Tarik Saldo'}
          </button>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100"><h2 className="text-lg font-bold">Riwayat Transaksi</h2></div>
        <div className="divide-y divide-gray-50">
          {(!wallet?.transactions || wallet.transactions.length === 0) ? (
            <div className="p-6 text-center text-gray-500"><p>Belum ada transaksi</p></div>
          ) : (
            [...wallet.transactions].reverse().map((tx: any, i: number) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 capitalize">{tx.type === 'transfer' ? 'Pendapatan Penjualan' : tx.type === 'withdrawal' ? 'Penarikan' : tx.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                </div>
                <p className={`font-semibold ${tx.type === 'transfer' || tx.type === 'topup' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'transfer' || tx.type === 'topup' ? '+' : '-'}{formatPrice(tx.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
