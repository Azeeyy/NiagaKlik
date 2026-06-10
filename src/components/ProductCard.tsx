'use client';

import Link from 'next/link';
import { useCartStore, useAuthStore } from '@/lib/store';
import { formatPrice, truncateText } from '@/lib/utils';
import toast from 'react-hot-toast';
import ProductImage from './ProductImage';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    price: number;
    originalPrice?: number;
    images: string[];
    category: string;
    sellerName: string;
    sellerId: string;
    isPreOrder: boolean;
    preOrderDeadline?: string;
    condition: string;
    soldCount: number;
    rating: number;
    stock: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { isLoggedIn, openAuthModal, user } = useAuthStore();

  const userRole = user?.role;
  const canAddToCart = isLoggedIn && userRole === 'pembeli' && product.stock > 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLoggedIn) {
      openAuthModal(window.location.pathname);
      return;
    }

    if (product.stock === 0) {
      toast.error('Produk stok habis');
      return;
    }

    if (!canAddToCart) {
      toast.error('Hanya pembeli yang bisa membeli produk');
      return;
    }

    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0] || '',
      quantity: 1,
      stock: product.stock,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      category: product.category,
      isPreOrder: product.isPreOrder,
    });
    toast.success('Ditambahkan ke keranjang!');
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link href={`/products/${product._id}`} className="group">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 card-hover h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          <ProductImage
            name={product.name}
            category={product.category}
            image={product.images[0]}
            className="w-full h-full"
            isPreOrder={product.isPreOrder}
            condition={product.condition}
          />
          
          {/* Discount badge (only show on top of ProductImage since ProductImage handles other badges) */}
          {discount > 0 && (
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg">
                -{discount}%
              </span>
            </div>
          )}

          {/* Out of Stock Label */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
              <span className="px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded-lg">
                Stok Habis
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <p className="text-xs text-gray-500 mb-1">{product.category}</p>
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-2">
            {truncateText(product.name, 60)}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-200'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.soldCount} terjual)</span>
          </div>

          {/* Price */}
          <div className="mt-auto">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary-600">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>
            
            {product.isPreOrder && product.preOrderDeadline && (
              <p className="text-xs text-purple-600 mt-1">
                PO hingga {new Date(product.preOrderDeadline).toLocaleDateString('id-ID')}
              </p>
            )}
          </div>

           {/* Add to Cart */}
           <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || (!canAddToCart && isLoggedIn)}
            className="mt-3 w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl 
                     transition-all duration-200 flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-600"
           >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            {product.stock === 0 ? 'Stok Habis' : canAddToCart ? 'Keranjang' : 'Hanya Pembeli'}
           </button>
        </div>
      </div>
    </Link>
  );
}
