import React, { useState, useEffect } from 'react';
import { products as productsApi } from '../api';

export default function Products() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ product_code: '', film_type: '', thickness: '', width: '', description: '' });

  const load = () => {
    setLoading(true);
    productsApi.list().then(setList).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd = () => {
    setForm({ product_code: '', film_type: '', thickness: '', width: '', description: '' });
    setModal('add');
  };
  const openEdit = (p) => {
    setForm({
      id: p.id,
      product_code: p.product_code,
      film_type: p.film_type,
      thickness: p.thickness,
      width: p.width,
      description: p.description || '',
    });
    setModal('edit');
  };
  const closeModal = () => setModal(null);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await productsApi.create(form);
      } else {
        await productsApi.update(form.id, form);
      }
      closeModal();
      load();
    } catch (err) {
      alert(err.message);
    }
  };
  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productsApi.delete(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <button type="button" className="btn-primary" onClick={openAdd}>Add New</button>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="p-6 text-slate-500">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-medium text-slate-700">Code</th>
                <th className="text-left p-3 font-medium text-slate-700">Film Type</th>
                <th className="text-left p-3 font-medium text-slate-700">Thickness (μ)</th>
                <th className="text-left p-3 font-medium text-slate-700">Width</th>
                <th className="text-left p-3 font-medium text-slate-700">Description</th>
                <th className="text-right p-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-3 font-medium">{p.product_code}</td>
                  <td className="p-3">{p.film_type}</td>
                  <td className="p-3">{p.thickness}</td>
                  <td className="p-3">{p.width}</td>
                  <td className="p-3 text-slate-600 max-w-xs truncate">{p.description || '—'}</td>
                  <td className="p-3 text-right">
                    <button type="button" className="text-primary-600 hover:underline mr-2" onClick={() => openEdit(p)}>Edit</button>
                    <button type="button" className="text-red-600 hover:underline" onClick={() => remove(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && list.length === 0 && <p className="p-6 text-slate-500">No products. Add one to get started.</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{modal === 'add' ? 'Add Product' : 'Edit Product'}</h2>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="label">Product Code</label>
                <input className="input" value={form.product_code} onChange={(e) => setForm({ ...form, product_code: e.target.value })} required />
              </div>
              <div>
                <label className="label">Film Type</label>
                <input className="input" value={form.film_type} onChange={(e) => setForm({ ...form, film_type: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Thickness (μ)</label>
                  <input type="number" step="0.1" className="input" value={form.thickness} onChange={(e) => setForm({ ...form, thickness: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Width</label>
                  <input type="number" className="input" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
