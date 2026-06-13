'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
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

  const sellerCount = useMemo(() => {
    const uniqueSellers = new Set(checkoutItems.map(i => i.sellerId));
    return uniqueSellers.size;
  }, [checkoutItems]);

  // Group items by seller
  const sellerGroups = useMemo(() => {
    const groups: Record<string, { sellerName: string; items: typeof checkoutItems; subtotal: number }> = {};
    for (const item of checkoutItems) {
      if (!groups[item.sellerId]) {
        groups[item.sellerId] = { sellerName: item.sellerName, items: [], subtotal: 0 };
      }
      groups[item.sellerId].items.push(item);
      groups[item.sellerId].subtotal += item.price * item.quantity;
    }
    return Object.values(groups);
  }, [checkoutItems]);

  // Per-seller shipping: distribute evenly to match the API
  const shippingCost = 15000; // Fixed shipping for demo
  const shippingPerSeller = Math.round(shippingCost / sellerCount);
  const shippingFirstSeller = shippingCost - shippingPerSeller * (sellerCount - 1);

  // Calculate per-seller totals
  const sellerTotals = useMemo(() => {
    return sellerGroups.map((group, i) => {
      const groupShipping = i === 0 ? shippingFirstSeller : shippingPerSeller;
      const groupFee = paymentMethod !== 'cod' ? calculatePlatformFee(group.subtotal) : 0;
      const groupCod = paymentMethod === 'cod' && i === 0 ? 5000 : 0;
      return {
        ...group,
        shipping: groupShipping,
        platformFee: groupFee,
        codFee: groupCod,
        grandTotal: group.subtotal + groupFee + groupShipping + groupCod,
      };
    });
  }, [sellerGroups, paymentMethod, shippingPerSeller, shippingFirstSeller]);

  const subtotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const platformFee = paymentMethod !== 'cod' ? calculatePlatformFee(subtotal) : 0;
  const codFee = paymentMethod === 'cod' ? 5000 : 0;
  const grandTotal = subtotal + platformFee + shippingCost + codFee;
  const isMultiSeller = sellerCount > 1;

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

      const orderCount = data.orders?.length || 1;
      toast.success(orderCount > 1 ? `${orderCount} pesanan berhasil dibuat!` : 'Pesanan berhasil dibuat!');
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

          {/* Seller Groups - show items grouped by seller */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Pesanan dari Penjual
              {isMultiSeller && (
                <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                  {sellerCount} penjual
                </span>
              )}
            </h2>

            {isMultiSeller && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-5 flex items-start gap-2">
                <svg className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-orange-800">
                  Pesanan dari beberapa penjual akan dikirim secara terpisah. Setiap pesanan dikenakan biaya kirim sendiri.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {sellerTotals.map((group, idx) => (
                <div
                  key={group.sellerName + idx}
                  className={`rounded-xl border-2 overflow-hidden transition-all ${
                    isMultiSeller ? 'border-primary-100' : 'border-transparent'
                  }`}
                >
                  {/* Seller Header */}
                  <div className={`flex items-center justify-between px-4 py-3 ${
                    isMultiSeller
                      ? 'bg-gradient-to-r from-primary-50 to-blue-50 border-b border-primary-100'
                      : 'bg-gray-50 border-b border-gray-100'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        isMultiSeller
                          ? 'bg-gradient-to-br from-primary-500 to-purple-600'
                          : 'bg-gray-400'
                      }`}>
                        {group.sellerName?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{group.sellerName}</p>
                        {isMultiSeller && (
                          <p className="text-xs text-gray-500">Pesanan #{idx + 1}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Subtotal</p>
                      <p className="font-bold text-primary-600 text-sm">{formatPrice(group.subtotal)}</p>
                    </div>
                  </div>

                  {/* Items in this group */}
                  <div className="divide-y divide-gray-50 px-4">
                    {group.items.map((item) => (
                      <div key={item.productId} className="flex items-center gap-3 py-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 shrink-0 font-medium">
                          {item.quantity}x
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">{formatPrice(item.price)}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Seller-level totals */}
                  {isMultiSeller && (
                    <div className="bg-gray-50/80 px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-gray-500">
                        <span>Ongkir: <strong className="text-gray-700">{formatPrice(group.shipping)}</strong></span>
                        {group.platformFee > 0 && (
                          <span>Fee: <strong className="text-gray-700">{formatPrice(group.platformFee)}</strong></span>
                        )}
                      </div>
                      <span className="font-bold text-primary-600 text-sm">
                        {formatPrice(group.grandTotal)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Ringkasan Belanja
              {isMultiSeller && (
                <span className="ml-auto text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                  {sellerCount} pesanan
                </span>
              )}
            </h2>
            
            <div className="space-y-4 mb-6">
              {sellerTotals.map((group, idx) => (
                <div key={group.sellerName + idx}>
                  {/* Seller header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                      isMultiSeller ? 'bg-primary-500' : 'bg-gray-400'
                    }`}>
                      {group.sellerName?.charAt(0) || 'T'}
                    </div>
                    <p className="text-xs font-semibold text-gray-700 truncate">{group.sellerName}</p>
                    {isMultiSeller && (
                      <span className="text-[10px] text-gray-400 ml-auto">Ongkir {formatPrice(group.shipping)}</span>
                    )}
                  </div>

                  {/* Items */}
                  <div className="space-y-2 ml-8">
                    {group.items.map((item) => (
                      <div key={item.productId} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-[10px] text-gray-500 shrink-0 font-medium">
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

                  {/* Seller subtotal */}
                  {isMultiSeller && (
                    <div className="flex justify-between text-xs text-gray-500 mt-1 ml-8 pb-2 border-b border-gray-50">
                      <span>Subtotal {group.sellerName}</span>
                      <span className="font-medium text-gray-700">{formatPrice(group.subtotal)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              {isMultiSeller ? (
                <>
                  {/* Per-seller shipping breakdown */}
                  {sellerTotals.map((group, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-gray-500">
                      <span className="truncate">Ongkir {group.sellerName}</span>
                      <span className="font-medium text-gray-700">{formatPrice(group.shipping)}</span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ongkos Kirim</span>
                  <span className="font-medium">{formatPrice(shippingCost)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
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
