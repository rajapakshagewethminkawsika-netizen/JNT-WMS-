import React, { useState, useEffect } from 'react';
import { grn as grnApi, suppliers, products, locations } from '../api';

export default function GRN() {
  const [supplierList, setSupplierList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [locationList, setLocationList] = useState([]);
  const [list, setList] = useState({ data: [], total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ supplier_id: '', items: [{ product_id: '', location_id: '', rolls: '', kg: '' }], notes: '' });

  useEffect(() => {
    Promise.all([suppliers.list(), products.list(), locations.list()]).then(([s, p, l]) => {
      setSupplierList(s);
      setProductList(p);
      setLocationList(l);
    });
  }, []);

  const loadList = (page = 1) => {
    setLoading(true);
    grnApi.list({ page, limit: 20 }).then(setList).finally(() => setLoading(false));
  };
  useEffect(() => loadList(list.page), [list.page]);

  const addLine = () => setForm((f) => ({ ...f, items: [...f.items, { product_id: '', location_id: '', rolls: '', kg: '' }] }));
  const removeLine = (i) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateLine = (i, field, value) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)),
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const items = form.items
      .map((it) => ({ product_id: parseInt(it.product_id, 10), location_id: parseInt(it.location_id, 10), rolls: Number(it.rolls) || 0, kg: Number(it.kg) || 0 }))
      .filter((it) => it.product_id && it.location_id && (it.rolls > 0 || it.kg > 0));
    if (!form.supplier_id || items.length === 0) {
      alert('Select supplier and add at least one line with product, location, rolls/kg.');
      return;
    }
    try {
      await grnApi.create({ supplier_id: parseInt(form.supplier_id, 10), items, notes: form.notes || null });
      setFormOpen(false);
      setForm({ supplier_id: '', items: [{ product_id: '', location_id: '', rolls: '', kg: '' }], notes: '' });
      loadList(1);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">GRN (Goods Received Note)</h1>
        <button type="button" className="btn-primary" onClick={() => setFormOpen(true)}>Create GRN</button>
      </div>
      <p className="text-slate-600 text-sm">Inbound: select supplier, assign rolls to warehouse location (Zone/Rack/Level). Stock updates automatically.</p>

      {formOpen && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">New GRN</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Supplier *</label>
              <select className="input" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} required>
                <option value="">Select supplier</option>
                {supplierList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="label mb-0">Items (Product + Location + Rolls + KG)</label>
                <button type="button" className="btn-secondary text-sm" onClick={addLine}>+ Add line</button>
              </div>
              <div className="space-y-2">
                {form.items.map((it, i) => (
                  <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                    <select className="input" value={it.product_id} onChange={(e) => updateLine(i, 'product_id', e.target.value)}>
                      <option value="">Product</option>
                      {productList.map((p) => (
                        <option key={p.id} value={p.id}>{p.product_code} – {p.film_type}</option>
                      ))}
                    </select>
                    <select className="input" value={it.location_id} onChange={(e) => updateLine(i, 'location_id', e.target.value)}>
                      <option value="">Location</option>
                      {locationList.map((l) => (
                        <option key={l.id} value={l.id}>{l.zone}/{l.rack}/{l.level}</option>
                      ))}
                    </select>
                    <input type="number" min="0" className="input" placeholder="Rolls" value={it.rolls} onChange={(e) => updateLine(i, 'rolls', e.target.value)} />
                    <input type="number" min="0" step="0.01" className="input" placeholder="KG" value={it.kg} onChange={(e) => updateLine(i, 'kg', e.target.value)} />
                    <button type="button" className="btn-secondary text-sm text-red-600" onClick={() => removeLine(i)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Save GRN</button>
              <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-x-auto">
        {loading ? <p className="p-6 text-slate-500">Loading…</p> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-medium text-slate-700">GRN Number</th>
                <th className="text-left p-3 font-medium text-slate-700">Supplier</th>
                <th className="text-left p-3 font-medium text-slate-700">Received At</th>
                <th className="text-right p-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(list.data || []).map((g) => (
                <tr key={g.id} className="border-b border-slate-100">
                  <td className="p-3 font-medium">{g.grn_number}</td>
                  <td className="p-3">{g.supplier_name}</td>
                  <td className="p-3 text-slate-600">{g.received_at ? new Date(g.received_at).toLocaleString() : '—'}</td>
                  <td className="p-3 text-right">
                    <button type="button" className="text-primary-600 hover:underline" onClick={() => grnApi.get(g.id).then((d) => alert(JSON.stringify(d.items || d, null, 2)))}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && (!list.data || list.data.length === 0) && <p className="p-6 text-slate-500">No GRNs yet. Create one above.</p>}
      </div>
    </div>
  );
}
