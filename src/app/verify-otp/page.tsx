'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const redirect = searchParams.get('redirect') || '/';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  function handleChange(index: number, value: string) {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      toast.error('Masukkan kode OTP 6 digit');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Verifikasi gagal');
        return;
      }

      toast.success('Akun berhasil diverifikasi! Silakan login');
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
    } catch (err) {
      toast.error('Terjadi kesalahan, coba lagi');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOTP() {
    if (countdown > 0 || !email) return;

    setResending(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resendOtp: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal mengirim ulang OTP');
        return;
      }

      toast.success('Kode OTP baru telah dikirim');
      setCountdown(60);
    } catch (err) {
      toast.error('Terjadi kesalahan, coba lagi');
    } finally {
      setResending(false);
    }
  }

  async function handleChangeEmail() {
    if (!newEmail.trim() || !email) return;

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      toast.error('Format email tidak valid');
      return;
    }

    setChangingEmail(true);
    try {
      const res = await fetch('/api/auth/update-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentEmail: email, newEmail: newEmail.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal mengganti email');
        return;
      }

      toast.success('Email berhasil diganti! Kode OTP baru telah dikirim.');
      // Update URL with new email
      router.push(`/verify-otp?email=${encodeURIComponent(newEmail.trim())}&redirect=${encodeURIComponent(redirect)}`);
      setShowEmailChange(false);
      setNewEmail('');
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      toast.error('Terjadi kesalahan, coba lagi');
    } finally {
      setChangingEmail(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-purple-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-slide-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Verifikasi Email</h1>
            <p className="text-gray-500 mt-2">
              Kami telah mengirim kode OTP ke
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-primary-600 font-semibold">{email || 'email Anda'}</p>
              {email && (
                <button
                  onClick={() => setShowEmailChange(!showEmailChange)}
                  className="text-xs text-gray-400 hover:text-primary-600 underline transition-colors"
                >
                  {showEmailChange ? 'Batal' : 'Ganti Email'}
                </button>
              )}
            </div>
          </div>

          {/* Email Change Form */}
          {showEmailChange && email && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Masukkan Email Baru</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="emailbaru@contoh.com"
                  className="input-field flex-1"
                />
                <button
                  onClick={handleChangeEmail}
                  disabled={changingEmail || !newEmail.trim()}
                  className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-all whitespace-nowrap"
                >
                  {changingEmail ? '...' : 'Simpan'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Kode OTP baru akan dikirim ke email baru Anda</p>
            </div>
          )}

          {!email ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">Email tidak ditemukan. Silakan daftar ulang.</p>
              <Link href="/register" className="btn-primary inline-block">
                Kembali ke Daftar
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <div className="flex justify-center gap-3 mb-8">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl 
                               focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : 'Verifikasi'}
                </button>
              </form>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                  Tidak menerima kode?{' '}
                  <button
                    onClick={handleResendOTP}
                    disabled={resending || countdown > 0}
                    className="text-primary-600 font-semibold hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {resending ? 'Mengirim...' : countdown > 0 ? `Kirim Ulang (${countdown}s)` : 'Kirim Ulang'}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-purple-50">
        <div className="animate-spin h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}
