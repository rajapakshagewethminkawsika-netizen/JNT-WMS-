import React, { useState, useEffect } from 'react';
import { suppliers as suppliersApi } from '../api';

export default function Suppliers() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ supplier_code: '', name: '', contact_person: '', phone: '', address: '' });

  const load = () => {
    setLoading(true);
    suppliersApi.list().then(setList).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd = () => {
    setForm({ supplier_code: '', name: '', contact_person: '', phone: '', address: '' });
    setModal('add');
  };
  const openEdit = (s) => {
    setForm({
      id: s.id,
      supplier_code: s.supplier_code || '',
      name: s.name,
      contact_person: s.contact_person || '',
      phone: s.phone || '',
      address: s.address || '',
    });
    setModal('edit');
  };
  const closeModal = () => setModal(null);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') await suppliersApi.create(form);
      else await suppliersApi.update(form.id, form);
      closeModal();
      load();
    } catch (err) {
      alert(err.message);
    }
  };
  const remove = async (id) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      await suppliersApi.delete(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Suppliers</h1>
        <button type="button" className="btn-primary" onClick={openAdd}>Add New</button>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="p-6 text-slate-500">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-medium text-slate-700">ID / Code</th>
                <th className="text-left p-3 font-medium text-slate-700">Name</th>
                <th className="text-left p-3 font-medium text-slate-700">Contact</th>
                <th className="text-left p-3 font-medium text-slate-700">Phone</th>
                <th className="text-left p-3 font-medium text-slate-700">Address</th>
                <th className="text-right p-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-3">{s.supplier_code || s.id}</td>
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3">{s.contact_person || '—'}</td>
                  <td className="p-3">{s.phone || '—'}</td>
                  <td className="p-3 text-slate-600 max-w-xs truncate">{s.address || '—'}</td>
                  <td className="p-3 text-right">
                    <button type="button" className="text-primary-600 hover:underline mr-2" onClick={() => openEdit(s)}>Edit</button>
                    <button type="button" className="text-red-600 hover:underline" onClick={() => remove(s.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && list.length === 0 && <p className="p-6 text-slate-500">No suppliers yet.</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{modal === 'add' ? 'Add Supplier' : 'Edit Supplier'}</h2>
            <form onSubmit={save} className="space-y-3">
              <div><label className="label">Supplier Code</label><input className="input" value={form.supplier_code} onChange={(e) => setForm({ ...form, supplier_code: e.target.value })} /></div>
              <div><label className="label">Name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="label">Contact Person</label><input className="input" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="label">Address</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
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
