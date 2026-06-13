'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useCartStore, useAuthStore } from '@/lib/store';
import { formatPrice, formatDate } from '@/lib/utils';
import ProductImage from '@/components/ProductImage';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isLoggedIn, openAuthModal } = useAuthStore();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    if (params.id) fetchProduct();
  }, [params.id]);

  async function fetchProduct() {
    try {
      const res = await fetch(`/api/products/${params.id}`);
      if (!res.ok) throw new Error('Product not found');
      const data = await res.json();
      setProduct(data.product);
    } catch (err) {
      console.error('Failed to fetch product:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart() {
    if (!isLoggedIn) {
      openAuthModal(`/products/${params.id}`);
      return;
    }

    if (!product) return;

    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0] || '',
      quantity,
      stock: product.stock,
      sellerId: product.sellerId?._id || product.sellerId,
      sellerName: product.sellerName,
      category: product.category,
      isPreOrder: product.isPreOrder,
    });
    toast.success('Ditambahkan ke keranjang!');
  }

  function handleBuyNow() {
    if (!isLoggedIn) {
      openAuthModal(`/products/${params.id}`);
      return;
    }
    handleAddToCart();
    router.push('/cart');
  }

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {/* Breadcrumb shimmer */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in-up">
          <div className="h-4 shimmer rounded w-16"></div>
          <span className="text-gray-300">/</span>
          <div className="h-4 shimmer rounded w-20"></div>
          <span className="text-gray-300">/</span>
          <div className="h-4 shimmer rounded w-32"></div>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-square shimmer rounded-2xl"></div>
          <div className="space-y-6">
            <div className="flex gap-2">
              <div className="h-6 shimmer rounded-lg w-20"></div>
              <div className="h-6 shimmer rounded-lg w-14"></div>
            </div>
            <div className="h-10 shimmer rounded w-3/4"></div>
            <div className="h-5 shimmer rounded w-1/3"></div>
            <div className="h-12 shimmer rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 shimmer rounded w-full"></div>
              <div className="h-4 shimmer rounded w-full"></div>
              <div className="h-4 shimmer rounded w-2/3"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-14 shimmer rounded-xl flex-1"></div>
              <div className="h-14 shimmer rounded-xl flex-1"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Produk Tidak Ditemukan</h2>
        <Link href="/products" className="btn-primary inline-block">Kembali ke Produk</Link>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-8 animate-fade-in-up">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-4 group transition-colors"
      >
        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7-7l-7 7 7 7" />
        </svg>
        <span className="font-medium">Kembali</span>
      </Link>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/products" className="hover:text-primary-600 transition-colors">Semua Produk</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/products?category=${product.category}`} className="hover:text-primary-600 transition-colors">{product.category}</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Images */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden border border-gray-100 mb-4 shadow-lg">
            <ProductImage
              name={product.name}
              category={product.category}
              image={product.images?.[0]}
              className="w-full h-full"
              isPreOrder={product.isPreOrder}
              condition={product.condition}
            />
          </div>
        </div>

        {/* Product Info */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            {product.isPreOrder && (
              <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg">PRE-ORDER</span>
            )}
            {discount > 0 && (
              <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">-{discount}%</span>
            )}
            <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${product.condition === 'baru' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {product.condition === 'baru' ? 'Baru' : 'Bekas'}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

          {/* Seller */}
          <Link href="#" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 mb-4">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm">
              {product.sellerName?.charAt(0)}
            </div>
            {product.sellerName}
          </Link>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-primary-600">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>
          </div>

          {/* PO Info */}
          {product.isPreOrder && product.preOrderDeadline && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6">
              <p className="text-sm text-purple-800 font-medium">
                Pre-Order: Pesan sebelum {formatDate(product.preOrderDeadline)}
              </p>
              {product.preOrderEstimateDelivery && (
                <p className="text-xs text-purple-600 mt-1">
                  Estimasi pengiriman: {product.preOrderEstimateDelivery}
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Deskripsi Produk</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-4 mb-6 text-sm">
            <span className="text-gray-500">Stok: <strong className="text-gray-900">{product.stock}</strong></span>
            <span className="text-gray-500">Terjual: <strong className="text-gray-900">{product.soldCount}</strong></span>
            {product.weight && <span className="text-gray-500">Berat: <strong className="text-gray-900">{(product.weight / 1000).toFixed(1)} kg</strong></span>}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-8">
            <span className="text-sm font-semibold text-gray-700">Jumlah:</span>
            <div className="flex items-center border border-gray-200 rounded-xl">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-l-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="px-6 py-2 font-semibold min-w-[60px] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-r-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleBuyNow} className="btn-primary flex-1 text-center flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              Beli Sekarang
            </button>
            <button onClick={handleAddToCart} className="btn-secondary flex-1 text-center flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Keranjang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
