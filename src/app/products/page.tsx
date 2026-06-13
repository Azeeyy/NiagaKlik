'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { PRODUCT_CATEGORIES } from '@/lib/utils';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('terbaru');
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const limit = 12;

  const search = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';

  useEffect(() => {
    fetchProducts();
  }, [page, sort, search, categoryFilter]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      params.set('sort', sort);

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <span className="text-sm font-semibold text-primary-600 uppercase tracking-widest">Produk</span>
        <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mt-2">
          {categoryFilter ? (
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">{categoryFilter}</span>
          ) : 'Semua Produk'}
        </h1>
        <p className="text-gray-500 mt-3 text-lg">
          {search ? `Hasil pencarian "${search}"` : `${total} produk tersedia`}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4">Filter</h3>
            
            {/* Categories */}
            <div className="mb-6">
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 mb-3 group"
              >
                <span className="flex items-center gap-2">
                  Kategori
                  {!categoriesOpen && categoryFilter && (
                    <span className="text-xs font-normal text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                      {categoryFilter}
                    </span>
                  )}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${
                    categoriesOpen ? 'rotate-180' : ''
                  }`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                categoriesOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => router.push('/products')}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !categoryFilter ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Semua
                  </button>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => router.push(`/products?category=${encodeURIComponent(cat)}`)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        categoryFilter === cat ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Sort & Info */}
          <div className="flex items-center justify-between mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <p className="text-sm text-gray-500">
              Menampilkan {products.length} dari {total} produk
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200 cursor-pointer hover:border-gray-300"
            >
              <option value="terbaru">Terbaru</option>
              <option value="termurah">Termurah</option>
              <option value="termahal">Termahal</option>
              <option value="terlaris">Terlaris</option>
            </select>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="product-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                  <div className="aspect-square shimmer !rounded-none"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 shimmer rounded w-1/3"></div>
                    <div className="h-5 shimmer rounded w-2/3"></div>
                    <div className="h-4 shimmer rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="product-grid">
              {products.map((product: any) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 animate-fade-in">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg font-medium mb-2">Produk tidak ditemukan</p>
              <p className="text-gray-400 text-sm">Coba ubah kata kunci atau filter pencarian</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Sebelumnya
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                    page === i + 1
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
