'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Masukkan email Anda');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal');
        return;
      }

      setSent(true);
      toast.success('Kode OTP telah dikirim jika email terdaftar');
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-purple-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-slide-up">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">NK</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Lupa Password</h1>
            <p className="text-gray-500 mt-2">
              {sent
                ? 'Kode OTP telah dikirim jika email terdaftar'
                : 'Masukkan email untuk mereset password'}
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email terdaftar"
                  className="input-field"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : 'Kirim Kode OTP'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600">
                Jika email <strong>{email}</strong> terdaftar, kami telah mengirim kode OTP reset password.
              </p>
              <button
                onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
                className="btn-primary w-full"
              >
                Masukkan Kode OTP
              </button>
              <button
                onClick={() => setSent(false)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Kirim ulang ke email berbeda
              </button>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Ingat password?{' '}
            <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
