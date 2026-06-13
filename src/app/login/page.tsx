'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { setUser, closeAuthModal } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!form.email || !form.password) {
      toast.error('Silakan isi email dan password');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes('belum diverifikasi')) {
          toast('Akun belum diverifikasi. Mengarahkan ke verifikasi...', { icon: '📧' });
          router.push(`/verify-otp?email=${encodeURIComponent(form.email)}&redirect=${encodeURIComponent(redirect)}`);
          return;
        }
        toast.error(data.error || 'Login gagal');
        return;
      }

      toast.success('Login berhasil!');
      setUser(data.user);
      closeAuthModal();
      router.push(redirect);
      router.refresh();
    } catch (err) {
      toast.error('Terjadi kesalahan, coba lagi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-purple-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">NK</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Selamat Datang Kembali</h1>
            <p className="text-gray-500 mt-2">Masuk ke akun NiagaKlik Anda</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Masukkan email"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Masukkan password"
                  className="input-field pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <Link href="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Lupa Password?
                </Link>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : 'Masuk'}
            </button>
          </form>

          {/* Quick Login */}
          <div className="mt-8">
            <p className="text-center text-sm text-gray-500 mb-3">Akun Demo</p>
            <div className="space-y-2">
              {[
                { label: 'Pembeli', email: 'pembeli@niagaklik.com' },
                { label: 'Penjual', email: 'penjual@niagaklik.com' },
                { label: 'Operator', email: 'operator@niagaklik.com' },
              ].map((account) => (
                <button
                  key={account.email}
                  onClick={() => setForm({ email: account.email, password: 'password123' })}
                  className="w-full text-left px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm transition-colors flex items-center justify-between"
                >
                  <span className="font-medium text-gray-700">Login sebagai {account.label}</span>
                  <span className="text-gray-400 text-xs">{account.email}</span>
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">Semua akun demo menggunakan password: <strong>password123</strong></p>
          </div>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Belum punya akun?{' '}
            <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-primary-600 font-semibold hover:text-primary-700">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-purple-50">
        <div className="animate-spin h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
