'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PRODUCT_CATEGORIES } from '@/lib/utils';
import ImageUploader from '@/components/ImageUploader';

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '', description: '', price: '', originalPrice: '', category: '',
    stock: '1', condition: 'baru', weight: '250', isPreOrder: false,
    preOrderDeadline: '', preOrderEstimateDelivery: '', tags: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price || !form.description || !form.category) {
      toast.error('Isi field yang wajib');
      return;
    }
    if (images.length === 0) {
      toast.error('Wajib upload minimal 1 gambar produk');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          images,
          price: parseInt(form.price),
          originalPrice: form.originalPrice ? parseInt(form.originalPrice) : undefined,
          stock: parseInt(form.stock),
          weight: parseInt(form.weight),
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          preOrderDeadline: form.isPreOrder ? form.preOrderDeadline : undefined,
          preOrderEstimateDelivery: form.isPreOrder ? form.preOrderEstimateDelivery : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Gagal menambah produk'); return; }
      toast.success('Produk berhasil ditambahkan!');
      router.push('/seller/products');
    } catch { toast.error('Gagal menambah produk'); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Tambah Produk Baru</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Produk *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" placeholder="Nama produk" required />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi Produk *</label>
            <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="input-field" rows={4} placeholder="Deskripsi produk" />
          </div>

          {/* Image Upload */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Gambar Produk <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal"> (Upload gambar produk, maksimal 5)</span>
            </label>
            {images.length === 0 && <span className="text-xs text-red-500 ml-1">Wajib upload minimal 1 gambar</span>}
            <ImageUploader
              images={images}
              onImagesChange={setImages}
              maxImages={5}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori *</label>
            <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="input-field" required>
              <option value="">Pilih kategori</option>
              {PRODUCT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kondisi</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setForm({...form, condition: 'baru'})} className={`flex-1 p-3 rounded-xl border-2 text-center text-sm font-medium transition-all ${form.condition === 'baru' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}>Baru</button>
              <button type="button" onClick={() => setForm({...form, condition: 'bekas'})} className={`flex-1 p-3 rounded-xl border-2 text-center text-sm font-medium transition-all ${form.condition === 'bekas' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}>Bekas</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Harga *</label>
            <input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} className="input-field" placeholder="Rp" min={0} required />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Harga Asli (Sebelum Diskon)</label>
            <input type="number" value={form.originalPrice} onChange={(e) => setForm({...form, originalPrice: e.target.value})} className="input-field" placeholder="Rp" min={0} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stok *</label>
            <input type="number" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} className="input-field" min={0} required />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Berat (gram)</label>
            <input type="number" value={form.weight} onChange={(e) => setForm({...form, weight: e.target.value})} className="input-field" min={0} />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags (pisahkan dengan koma)</label>
            <input type="text" value={form.tags} onChange={(e) => setForm({...form, tags: e.target.value})} className="input-field" placeholder="elektronik, smartphone, murah" />
          </div>

          {/* Pre-Order */}
          <div className="sm:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-xl">
              <input type="checkbox" checked={form.isPreOrder} onChange={(e) => setForm({...form, isPreOrder: e.target.checked})} className="w-5 h-5 rounded" />
              <div>
                <span className="font-semibold text-gray-900">Produk Pre-Order</span>
                <p className="text-sm text-gray-500">Centang jika produk ini adalah pre-order</p>
              </div>
            </label>
          </div>

          {form.isPreOrder && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Batas Waktu PO</label>
                <input type="date" value={form.preOrderDeadline} onChange={(e) => setForm({...form, preOrderDeadline: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estimasi Pengiriman</label>
                <input type="text" value={form.preOrderEstimateDelivery} onChange={(e) => setForm({...form, preOrderEstimateDelivery: e.target.value})} className="input-field" placeholder="Contoh: 30-45 hari" />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? 'Menyimpan...' : 'Simpan Produk'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-outline">Batal</button>
        </div>
      </form>
    </div>
  );
}
