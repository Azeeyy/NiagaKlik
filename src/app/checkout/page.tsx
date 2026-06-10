'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore, useAuthStore } from '@/lib/store';
import { formatPrice, calculatePlatformFee } from '@/lib/utils';
import toast from 'react-hot-toast';
import QRISModal from '@/components/QRISModal';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, getTotal, clearCart } = useCartStore();
  const { isLoggedIn, openAuthModal, user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState<string>('cn_wallet');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [showQRIS, setShowQRIS] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingOrderNumber, setPendingOrderNumber] = useState('');

  // Filter items based on selected param from cart
  const checkoutItems = (() => {
    const selectedParam = searchParams.get('selected');
    if (!selectedParam) return items;
    const selectedIds = selectedParam.split(',');
    return items.filter(i => selectedIds.includes(i.productId));
  })();

  useEffect(() => {
    if (!isLoggedIn) {
      openAuthModal('/checkout');
      return;
    }
    
    // Redirect seller and operator
    if (user?.role !== 'pembeli') {
      router.push('/products');
      return;
    }

    fetchData();
    setLoading(false);
  }, [isLoggedIn, user?.role]);

  async function fetchData() {
    try {
      const [addrRes, walletRes] = await Promise.all([
        fetch('/api/users/address'),
        fetch('/api/wallet'),
      ]);
      if (addrRes.ok) {
        const addrData = await addrRes.json();
        setAddresses(addrData.addresses || []);
        const defaultAddr = addrData.addresses?.find((a: any) => a.isDefault);
        setSelectedAddress(defaultAddr || addrData.addresses?.[0] || null);
      }
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWallet(walletData.wallet);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }

  const subtotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const platformFee = paymentMethod !== 'cod' ? calculatePlatformFee(subtotal) : 0;
  const shippingCost = 15000; // Fixed shipping for demo
  const codFee = paymentMethod === 'cod' ? 5000 : 0;
  const grandTotal = subtotal + platformFee + shippingCost + codFee;

  async function handlePlaceOrder() {
    if (!selectedAddress) {
      toast.error('Silakan pilih alamat pengiriman');
      return;
    }

    if (paymentMethod === 'cn_wallet' && wallet && wallet.balance < grandTotal) {
      toast.error('Saldo CN Wallet tidak mencukupi. Silakan top-up atau pilih metode lain.');
      return;
    }

    // For QRIS, show the QR payment modal instead of creating order immediately
    if (paymentMethod === 'qris') {
      // Generate temporary order number for the QR display
      const tempOrderNum = 'NK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      setPendingOrderNumber(tempOrderNum);
      setShowQRIS(true);
      return;
    }

    await createOrder();
  }

  async function createOrder() {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: checkoutItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          shippingAddress: selectedAddress,
          paymentMethod,
          shippingCost,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal membuat pesanan');
        return;
      }

      toast.success('Pesanan berhasil dibuat!');
      clearCart();
      router.push('/dashboard/orders');
    } catch (err) {
      toast.error('Terjadi kesalahan, coba lagi');
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleQRISConfirm() {
    setConfirmLoading(true);
    // Simulate QRIS payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    await createOrder();
    setShowQRIS(false);
    setConfirmLoading(false);
  }

  function handleQRISCancel() {
    setShowQRIS(false);
    setPendingOrderNumber('');
  }

  if (loading || !isLoggedIn || user?.role !== 'pembeli') {
    return null;
  }

  if (checkoutItems.length === 0 && isLoggedIn) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Alamat Pengiriman</h2>
            {addresses.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">Belum ada alamat tersimpan</p>
                <a href="/dashboard/address" className="text-primary-600 font-semibold text-sm hover:text-primary-700">
                  Tambah Alamat
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr: any) => (
                  <label
                    key={addr._id}
                    className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedAddress?._id === addr._id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddress?._id === addr._id}
                      onChange={() => setSelectedAddress(addr)}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{addr.label} - {addr.recipientName}</p>
                        <p className="text-sm text-gray-500 mt-1">{addr.fullAddress}</p>
                        <p className="text-sm text-gray-500">{addr.city}, {addr.province} {addr.postalCode}</p>
                        <p className="text-sm text-gray-500">{addr.recipientPhone}</p>
                        {addr.lat && addr.lng && (
                          <a
                            href={`https://www.google.com/maps?q=${addr.lat},${addr.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Lihat di Maps
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {addr.isDefault && (
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-lg">
                            Utama
                          </span>
                        )}
                        {addr.lat && addr.lng && (
                          <span className="text-xs text-gray-400">
                            {addr.lat.toFixed(4)}, {addr.lng.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Metode Pembayaran</h2>
            <div className="space-y-3">
              {[
                { id: 'cn_wallet', label: 'CN Wallet', desc: 'Bayar menggunakan saldo CN Wallet', icon: '💳' },
                { id: 'qris', label: 'QRIS', desc: 'Scan QR code untuk pembayaran', icon: '📱' },
                { id: 'cod', label: 'COD (Bayar di Tempat)', desc: 'Bayar tunai saat barang diterima', icon: '💵' },
              ].map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === method.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-2xl">{method.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{method.label}</p>
                    <p className="text-sm text-gray-500">{method.desc}</p>
                  </div>
                  {paymentMethod === method.id && (
                    <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Ringkasan Belanja</h2>
            
            <div className="space-y-4 mb-6">
              {checkoutItems.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 shrink-0">
                    {item.quantity}x
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{formatPrice(item.price)}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ongkos Kirim</span>
                <span className="font-medium">{formatPrice(shippingCost)}</span>
              </div>
              {paymentMethod !== 'cod' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Biaya Platform (5%)</span>
                  <span className="font-medium">{formatPrice(platformFee)}</span>
                </div>
              )}
              {paymentMethod === 'cod' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Biaya COD</span>
                  <span className="font-medium">{formatPrice(codFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-3">
                <span>Total</span>
                <span className="text-primary-600">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {paymentMethod === 'cn_wallet' && wallet && (
              <div className={`mt-4 p-3 rounded-xl text-sm ${
                wallet.balance >= grandTotal ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                Saldo CN Wallet: {formatPrice(wallet.balance)}
                {wallet.balance < grandTotal && ' (Tidak mencukupi)'}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={checkoutLoading || !selectedAddress}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              {checkoutLoading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : paymentMethod === 'qris' ? 'Bayar dengan QRIS' : 'Buat Pesanan'}
            </button>
          </div>
        </div>
      </div>

      {/* QRIS Payment Modal */}
      {showQRIS && (
        <QRISModal
          amount={grandTotal}
          orderNumber={pendingOrderNumber}
          onConfirm={handleQRISConfirm}
          onCancel={handleQRISCancel}
          loading={confirmLoading}
        />
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
