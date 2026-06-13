'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AddressAutocomplete from '@/components/AddressAutocomplete';

export default function AddressPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    label: string; fullAddress: string; province: string; city: string;
    district: string; postalCode: string; recipientName: string;
    recipientPhone: string; isDefault: boolean;
    lat: number | undefined; lng: number | undefined;
  }>({
    label: '', fullAddress: '', province: '', city: '', district: '',
    postalCode: '', recipientName: '', recipientPhone: '', isDefault: false,
    lat: undefined, lng: undefined,
  });

  useEffect(() => { fetchAddresses(); }, []);

  async function fetchAddresses() {
    try {
      const res = await fetch('/api/users/address');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function resetForm() {
    setForm({ label: '', fullAddress: '', province: '', city: '', district: '', postalCode: '', recipientName: '', recipientPhone: '', isDefault: false, lat: undefined, lng: undefined });
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.recipientName || !form.recipientPhone || !form.fullAddress) {
      toast.error('Isi nama penerima, no. HP, dan alamat lengkap');
      return;
    }
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/users/address?id=${editingId}` : '/api/users/address';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Gagal menyimpan'); return; }
      toast.success(editingId ? 'Alamat diperbarui' : 'Alamat ditambahkan');
      resetForm();
      fetchAddresses();
    } catch { toast.error('Gagal menyimpan alamat'); }
  }

  function editAddress(addr: any) {
    setForm({
      label: addr.label, fullAddress: addr.fullAddress, province: addr.province,
      city: addr.city, district: addr.district, postalCode: addr.postalCode,
      recipientName: addr.recipientName, recipientPhone: addr.recipientPhone,
      isDefault: addr.isDefault, lat: addr.lat, lng: addr.lng,
    });
    setEditingId(addr._id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus alamat ini?')) return;
    try {
      const res = await fetch(`/api/users/address?id=${id}`, { method: 'DELETE' });
      if (!res.ok) { toast.error('Gagal menghapus'); return; }
      toast.success('Alamat dihapus');
      fetchAddresses();
    } catch { toast.error('Gagal menghapus'); }
  }

  async function handleSetDefault(id: string) {
    try {
      const res = await fetch(`/api/users/address`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setDefault: id }),
      });
      if (!res.ok) { toast.error('Gagal mengatur default'); return; }
      toast.success('Alamat utama diubah');
      fetchAddresses();
    } catch { toast.error('Gagal'); }
  }

  function handleAddressFromMaps(data: any) {
    setForm(prev => ({
      ...prev,
      fullAddress: data.fullAddress || prev.fullAddress,
      province: data.province || prev.province,
      city: data.city || prev.city,
      district: data.district || prev.district,
      postalCode: data.postalCode || prev.postalCode,
      lat: data.lat || prev.lat,
      lng: data.lng || prev.lng,
    }));
  }

  if (loading) return <div className="p-8"><div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alamat Saya</h1>
          <p className="text-gray-500 mt-1">{addresses.length} alamat tersimpan</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary text-sm">
          {showForm ? 'Batal' : '+ Alamat Baru'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 animate-slide-up">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {editingId ? 'Edit Alamat' : 'Tambah Alamat Baru'}
          </h2>

          {/* Google Maps Autocomplete */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Cari Alamat <span className="text-gray-400 font-normal">(gunakan Google Maps)</span>
            </label>
            <AddressAutocomplete
              onAddressChange={handleAddressFromMaps}
              initialValue={editingId ? form.fullAddress : ''}
              placeholder="Ketik alamat untuk mencari..."
              className="mb-2"
            />
            <p className="text-xs text-gray-400">
              Ketik alamat Anda, pilih dari hasil pencarian Google Maps. Koordinat akan otomatis tersimpan.
            </p>
          </div>

          {/* Coordinates display */}
          {(form.lat || form.lng) && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-green-700">
                  Koordinat: {form.lat?.toFixed(6)}, {form.lng?.toFixed(6)}
                </span>
              </div>
              <a
                href={`https://www.google.com/maps?q=${form.lat},${form.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Buka Maps
              </a>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Label</label>
              <select value={form.label} onChange={(e) => setForm({...form, label: e.target.value})} className="input-field" required>
                <option value="">Pilih label</option>
                <option value="Rumah">Rumah</option>
                <option value="Kantor">Kantor</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Penerima *</label>
              <input type="text" value={form.recipientName} onChange={(e) => setForm({...form, recipientName: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">No. HP Penerima *</label>
              <input type="tel" value={form.recipientPhone} onChange={(e) => setForm({...form, recipientPhone: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Provinsi</label>
              <input type="text" value={form.province} onChange={(e) => setForm({...form, province: e.target.value})} className="input-field bg-gray-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Kota</label>
              <input type="text" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} className="input-field bg-gray-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Kecamatan</label>
              <input type="text" value={form.district} onChange={(e) => setForm({...form, district: e.target.value})} className="input-field bg-gray-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Kode Pos</label>
              <input type="text" value={form.postalCode} onChange={(e) => setForm({...form, postalCode: e.target.value})} className="input-field bg-gray-50" readOnly />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Lengkap *</label>
              <textarea value={form.fullAddress} onChange={(e) => setForm({...form, fullAddress: e.target.value})} className="input-field" rows={2} required />
            </div>
          </div>

          <label className="flex items-center gap-2 mt-4 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({...form, isDefault: e.target.checked})} className="rounded" />
            <span className="text-sm text-gray-700">Jadikan alamat utama</span>
          </label>

          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary">Simpan</button>
            <button type="button" onClick={resetForm} className="btn-outline">Batal</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {addresses.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>Belum ada alamat tersimpan</p>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="text-primary-600 font-semibold text-sm mt-2 hover:text-primary-700">
              Tambah Alamat Sekarang
            </button>
          </div>
        ) : addresses.map((addr) => (
          <div key={addr._id} className="bg-white rounded-2xl border border-gray-100 p-6 card-hover">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{addr.label}</h3>
                  {addr.isDefault && <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded">Utama</span>}
                  {addr.lat && addr.lng && (
                    <a
                      href={`https://www.google.com/maps?q=${addr.lat},${addr.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded hover:bg-blue-100 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Lihat Maps
                    </a>
                  )}
                </div>
                <p className="text-gray-600 mt-1">{addr.fullAddress}</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-gray-500 text-sm">{addr.city}, {addr.province} {addr.postalCode}</p>
                  {addr.lat != null && addr.lng != null && (
                    <p className="text-gray-400 text-xs">
                      ({addr.lat?.toFixed(4)}, {addr.lng?.toFixed(4)})
                    </p>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-1">{addr.recipientName} - {addr.recipientPhone}</p>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                {!addr.isDefault && (
                  <button onClick={() => handleSetDefault(addr._id)} className="text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1 hover:bg-primary-50 rounded-lg transition-colors">
                    Jadikan Utama
                  </button>
                )}
                <button onClick={() => editAddress(addr)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-50 rounded-lg transition-colors">Edit</button>
                <button onClick={() => handleDelete(addr._id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded-lg transition-colors">Hapus</button>
              </div>
            </div>

            {/* Mini map link */}
            {addr.lat && addr.lng && (
              <div className="mt-3 pt-3 border-t border-gray-50">
                <a
                  href={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${addr.lat},${addr.lng}&center=${addr.lat},${addr.lng}&zoom=15`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Buka di Google Maps
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
