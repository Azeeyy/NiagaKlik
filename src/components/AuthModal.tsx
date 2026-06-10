'use client';

import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AuthModal() {
  const { showAuthModal, closeAuthModal, returnUrl } = useAuthStore();
  const router = useRouter();

  if (!showAuthModal) return null;

  function handleGoToLogin() {
    closeAuthModal();
    router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
  }

  function handleGoToRegister() {
    closeAuthModal();
    router.push(`/register?redirect=${encodeURIComponent(returnUrl)}`);
  }

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Terbatas</h2>
          <p className="text-gray-600 mb-6">
            Silakan masuk atau daftar akun untuk mengakses halaman ini.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={handleGoToLogin} className="btn-primary text-center">
              Masuk
            </button>
            <button onClick={handleGoToRegister} className="btn-secondary text-center">
              Daftar Akun Baru
            </button>
            <button onClick={closeAuthModal} className="text-sm text-gray-500 hover:text-gray-700 mt-2">
              Kembali ke halaman utama
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
