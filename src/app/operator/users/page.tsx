'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';


export default function OperatorUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [deletingUsers, setDeletingUsers] = useState(false);
  const [viewingUser, setViewingUser] = useState<any>(null);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/operator/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const filteredUsers = roleFilter ? users.filter(u => u.role === roleFilter) : users;
  const allSelected = filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length;

  function toggleSelectUser(userId: string) {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u._id));
    }
  }

  async function handleSendNotification() {
    if (selectedUserIds.length === 0) {
      toast.error('Pilih minimal 1 user');
      return;
    }
    if (!notifTitle.trim() || !notifMessage.trim()) {
      toast.error('Judul dan pesan tidak boleh kosong');
      return;
    }

    setSendingNotif(true);
    try {
      const res = await fetch('/api/operator/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-notification',
          userIds: selectedUserIds,
          title: notifTitle,
          message: notifMessage,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setShowNotificationModal(false);
        setNotifTitle('');
        setNotifMessage('');
        setSelectedUserIds([]);
      } else {
        toast.error(data.error || 'Gagal mengirim notifikasi');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan');
    } finally {
      setSendingNotif(false);
    }
  }

  async function handleDeleteUsers() {
    if (selectedUserIds.length === 0) {
      toast.error('Pilih minimal 1 user');
      return;
    }

    const confirmed = window.confirm(
      `Yakin ingin menghapus ${selectedUserIds.length} user? Tindakan ini tidak bisa dibatalkan.`
    );
    if (!confirmed) return;

    setDeletingUsers(true);
    try {
      const res = await fetch('/api/operator/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete-users',
          userIds: selectedUserIds,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setSelectedUserIds([]);
        await fetchUsers();
      } else {
        toast.error(data.error || 'Gagal menghapus user');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan');
    } finally {
      setDeletingUsers(false);
    }
  }

  if (loading) return <div className="p-8"><div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Kelola User</h1>

      <div className="flex gap-2 mb-6">
        {['', 'pembeli', 'penjual', 'operator'].map((role) => (
          <button key={role} onClick={() => setRoleFilter(role)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${roleFilter === role ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {role || 'Semua'}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      {selectedUserIds.length > 0 && (
        <div className="flex gap-3 mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <span className="text-sm font-semibold text-purple-900">{selectedUserIds.length} user dipilih</span>
          <button
            onClick={() => setShowNotificationModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Kirim Notifikasi
          </button>
          <button
            onClick={handleDeleteUsers}
            disabled={deletingUsers}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {deletingUsers ? 'Menghapus...' : 'Hapus User'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Bergabung</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((u) => (
                <tr key={u._id} className={`hover:bg-gray-50 ${selectedUserIds.includes(u._id) ? 'bg-purple-50' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(u._id)}
                      onChange={() => toggleSelectUser(u._id)}
                      className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{u.name}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${
                      u.role === 'penjual' ? 'bg-green-100 text-green-700' :
                      u.role === 'operator' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${u.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {u.isVerified ? 'Terverifikasi' : 'Belum Verifikasi'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setViewingUser(u)}
                      className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Lihat Data Akun
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Kirim Notifikasi Custom</h2>
            <p className="text-sm text-gray-500 mb-4">Ke {selectedUserIds.length} user</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Judul Notifikasi</label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="Contoh: Update Sistem"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pesan</label>
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Tulis pesan notifikasi di sini..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSendNotification}
                disabled={sendingNotif}
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sendingNotif ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Mengirim...
                  </>
                ) : 'Kirim Notifikasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {viewingUser.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{viewingUser.name}</h2>
                <p className="text-sm text-gray-500 capitalize">{viewingUser.role}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6 bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                <p className="text-sm text-gray-900 break-all">{viewingUser.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Password</p>
                <p className="text-sm text-gray-900 break-all">{viewingUser.password}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Terakhir Diubah</p>
                <p className="text-sm text-gray-900">{formatDate(viewingUser.updatedAt)}</p>
              </div>
            </div>

            <button
              onClick={() => setViewingUser(null)}
              className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
