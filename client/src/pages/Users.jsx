import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { users as usersApi } from '../api';

const ROLES = ['admin', 'warehouse_manager', 'storekeeper'];

export default function Users() {
  const { user: currentUser } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'storekeeper', full_name: '' });

  const load = () => {
    setLoading(true);
    usersApi.list().then(setList).catch(() => setList([])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd = () => {
    setForm({ username: '', password: '', role: 'storekeeper', full_name: '' });
    setModal('add');
  };
  const openEdit = (u) => {
    setForm({ id: u.id, username: u.username, password: '', role: u.role, full_name: u.full_name || '' });
    setModal('edit');
  };
  const closeModal = () => setModal(null);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await usersApi.create({ username: form.username, password: form.password, role: form.role, full_name: form.full_name || null });
      } else {
        await usersApi.update(form.id, {
          ...(form.password ? { password: form.password } : {}),
          role: form.role,
          full_name: form.full_name || null,
        });
      }
      closeModal();
      load();
    } catch (err) {
      alert(err.message);
    }
  };
  const remove = async (id) => {
    if (id === currentUser?.id) {
      alert('You cannot delete yourself.');
      return;
    }
    if (!confirm('Delete this user?')) return;
    try {
      await usersApi.delete(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 text-slate-600">Access denied. Admin only.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <button type="button" className="btn-primary" onClick={openAdd}>Add User</button>
      </div>
      <p className="text-slate-600 text-sm">Admin can create users and control access (Admin, Warehouse Manager, Storekeeper).</p>

      <div className="card overflow-x-auto">
        {loading ? <p className="p-6 text-slate-500">Loading…</p> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-medium text-slate-700">Username</th>
                <th className="text-left p-3 font-medium text-slate-700">Full Name</th>
                <th className="text-left p-3 font-medium text-slate-700">Role</th>
                <th className="text-right p-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-b border-slate-100">
                  <td className="p-3 font-medium">{u.username}</td>
                  <td className="p-3">{u.full_name || '—'}</td>
                  <td className="p-3 capitalize">{u.role?.replace('_', ' ')}</td>
                  <td className="p-3 text-right">
                    <button type="button" className="text-primary-600 hover:underline mr-2" onClick={() => openEdit(u)}>Edit</button>
                    <button type="button" className="text-red-600 hover:underline" disabled={u.id === currentUser?.id} onClick={() => remove(u.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{modal === 'add' ? 'Add User' : 'Edit User'}</h2>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="label">Username</label>
                <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required disabled={modal === 'edit'} />
              </div>
              <div>
                <label className="label">{modal === 'add' ? 'Password' : 'New Password (leave blank to keep)'}</label>
                <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={modal === 'add'} />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary">Save</button>
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
