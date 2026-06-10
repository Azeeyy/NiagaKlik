'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import ProductImage from '@/components/ProductImage';

export default function SellerProductsPage() {  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products?seller=true');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) { toast.error('Gagal mengubah status'); return; }
      toast.success(isActive ? 'Produk dinonaktifkan' : 'Produk diaktifkan');
      fetchProducts();
    } catch { toast.error('Gagal'); }
  }

  async function deleteProduct(id: string) {
    if (!confirm('Hapus produk ini?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) { toast.error('Gagal menghapus'); return; }
      toast.success('Produk dihapus');
      fetchProducts();
    } catch { toast.error('Gagal'); }
  }

  if (loading) return <div className="p-8"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produk Saya</h1>
          <p className="text-gray-500 mt-1">{products.length} produk</p>
        </div>
        <Link href="/seller/products/add" className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah Produk
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">Belum ada produk</p>
          <Link href="/seller/products/add" className="btn-primary inline-block">Tambah Produk Pertama</Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Produk</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Harga</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Stok</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Terjual</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                          <ProductImage
                            name={product.name}
                            category={product.category}
                            image={product.images?.[0]}
                            className="w-full h-full"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category}</p>
                          {product.isPreOrder && <span className="text-xs text-purple-600 font-medium">PO</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold">{formatPrice(product.price)}</p>
                      {product.originalPrice && <p className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{product.stock}</td>
                    <td className="px-6 py-4 text-gray-900">{product.soldCount || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/seller/products/edit/${product._id}`} className="px-3 py-1.5 text-xs border border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50">
                          Edit
                        </Link>
                        <button onClick={() => toggleActive(product._id, product.isActive)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">
                          {product.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button onClick={() => deleteProduct(product._id)} className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
