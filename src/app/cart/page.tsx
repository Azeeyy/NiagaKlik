'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore, useAuthStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import ProductImage from '@/components/ProductImage';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const { isLoggedIn, openAuthModal, user } = useAuthStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
    if (!isLoggedIn) {
      openAuthModal('/cart');
      return;
    }
    
    // Redirect seller and operator
    if (user?.role !== 'pembeli') {
      router.push('/products');
      return;
    }
  }, [isLoggedIn, user?.role]);

  if (loading || !isLoggedIn || user?.role !== 'pembeli') {
    return null;
  }

  const allSelected = items.length > 0 && selectedIds.length === items.length;

  function toggleSelect(productId: string) {
    setSelectedIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.productId));
    }
  }

  function handleCheckout() {
    const selectedItems = items.filter(i => selectedIds.includes(i.productId));
    if (selectedItems.length === 0) {
      toast.error('Pilih minimal 1 produk untuk checkout');
      return;
    }

    // Pass selected items via URL params
    const idsParam = selectedItems.map(i => i.productId).join(',');
    router.push(`/checkout?selected=${encodeURIComponent(idsParam)}`);
  }

  function handleClearCart() {
    setSelectedIds([]);
    clearCart();
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <svg className="w-24 h-24 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Keranjang Belanja Kosong</h2>
        <p className="text-gray-500 mb-8">Mulai belanja dan tambahkan produk ke keranjang</p>
        <Link href="/products" className="btn-primary inline-block">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  const selectedItems = items.filter(i => selectedIds.includes(i.productId));
  const total = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Keranjang Belanja</h1>
          <p className="text-gray-500 mt-1">{items.length} produk • {selectedIds.length} dipilih</p>
        </div>
        <button onClick={handleClearCart} className="text-sm text-red-600 hover:text-red-700 font-medium">
          Hapus Semua
        </button>
      </div>

      {/* Select All Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex items-center gap-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="font-semibold text-gray-700 text-sm">Pilih Semua</span>
        </label>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const isSelected = selectedIds.includes(item.productId);
          return (
            <div
              key={item.productId}
              className={`bg-white rounded-2xl border-2 p-4 flex items-center gap-4 transition-all ${
                isSelected ? 'border-primary-500 bg-primary-50/30' : 'border-gray-100'
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelect(item.productId)}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 shrink-0"
              />

              {/* Product Image */}
              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                <ProductImage
                  name={item.name}
                  category={item.category || ''}
                  image={item.image}
                  className="w-full h-full"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                    <p className="text-sm text-gray-500">Penjual: {item.sellerName}</p>
                    {item.isPreOrder && <span className="text-xs text-purple-600 font-medium">PRE-ORDER</span>}
                  </div>
                  <p className="font-bold text-primary-600">{formatPrice(item.price * item.quantity)}</p>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 rounded-l-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="px-4 py-1.5 font-medium text-sm min-w-[40px] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 rounded-r-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      removeItem(item.productId);
                      setSelectedIds(prev => prev.filter(id => id !== item.productId));
                      toast.success('Produk dihapus dari keranjang');
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600">Total Belanja ({selectedIds.length} produk)</span>
          <span className="text-2xl font-bold text-primary-600">{formatPrice(total)}</span>
        </div>
        <p className="text-xs text-gray-400 mb-6">*Biaya pengiriman akan dihitung saat checkout</p>
        <button onClick={handleCheckout} disabled={selectedIds.length === 0} className="btn-primary w-full text-center">
          Lanjut ke Checkout ({selectedIds.length})
        </button>
      </div>
    </div>
  );
}
