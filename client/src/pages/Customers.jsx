import React, { useState, useEffect } from 'react';
import { customers as customersApi } from '../api';

export default function Customers() {
  const [data, setData] = useState({ data: [], total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ customer_code: '', name: '', contact_person: '', phone: '', address: '' });

  const load = (page = 1) => {
    setLoading(true);
    customersApi.list({ page, limit: data.limit, search }).then(setData).finally(() => setLoading(false));
  };
  useEffect(() => {
    load(data.page);
  }, [data.page, search]);

  const openAdd = () => {
    setForm({ customer_code: '', name: '', contact_person: '', phone: '', address: '' });
    setModal('add');
  };
  const openEdit = (c) => {
    setForm({
      id: c.id,
      customer_code: c.customer_code || '',
      name: c.name,
      contact_person: c.contact_person || '',
      phone: c.phone || '',
      address: c.address || '',
    });
    setModal('edit');
  };
  const closeModal = () => setModal(null);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') await customersApi.create(form);
      else await customersApi.update(form.id, form);
      closeModal();
      load(1);
    } catch (err) {
      alert(err.message);
    }
  };
  const remove = async (id) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await customersApi.delete(id);
      load(data.page);
    } catch (err) {
      alert(err.message);
    }
  };

  const list = data.data || [];
  const total = data.total || 0;
  const page = data.page || 1;
  const limit = data.limit || 20;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <div className="flex gap-2 flex-1 sm:flex-initial max-w-xs">
          <input
            type="search"
            className="input flex-1"
            placeholder="Search name, code, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="btn-primary" onClick={openAdd}>Add New</button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="p-6 text-slate-500">Loading…</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-medium text-slate-700">Code</th>
                  <th className="text-left p-3 font-medium text-slate-700">Name</th>
                  <th className="text-left p-3 font-medium text-slate-700">Contact</th>
                  <th className="text-left p-3 font-medium text-slate-700">Phone</th>
                  <th className="text-right p-3 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3">{c.customer_code || c.id}</td>
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3">{c.contact_person || '—'}</td>
                    <td className="p-3">{c.phone || '—'}</td>
                    <td className="p-3 text-right">
                      <button type="button" className="text-primary-600 hover:underline mr-2" onClick={() => openEdit(c)}>Edit</button>
                      <button type="button" className="text-red-600 hover:underline" onClick={() => remove(c.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total > 0 && (
              <div className="p-3 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
                <span>Total: {total.toLocaleString()}</span>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary text-sm" disabled={page <= 1} onClick={() => setData((d) => ({ ...d, page: d.page - 1 }))}>Previous</button>
                  <span>Page {page} of {totalPages}</span>
                  <button type="button" className="btn-secondary text-sm" disabled={page >= totalPages} onClick={() => setData((d) => ({ ...d, page: d.page + 1 }))}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
        {!loading && list.length === 0 && <p className="p-6 text-slate-500">No customers found.</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <div className="card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{modal === 'add' ? 'Add Customer' : 'Edit Customer'}</h2>
            <form onSubmit={save} className="space-y-3">
              <div><label className="label">Customer Code</label><input className="input" value={form.customer_code} onChange={(e) => setForm({ ...form, customer_code: e.target.value })} /></div>
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
