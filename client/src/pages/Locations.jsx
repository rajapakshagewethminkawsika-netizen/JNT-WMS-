import React, { useState, useEffect } from 'react';
import { locations as locationsApi } from '../api';

export default function Locations() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ zone: '', rack: '', level: '' });

  const load = () => {
    setLoading(true);
    locationsApi.list().then(setList).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd = () => {
    setForm({ zone: '', rack: '', level: '' });
    setModal(true);
  };
  const closeModal = () => setModal(false);

  const save = async (e) => {
    e.preventDefault();
    try {
      await locationsApi.create(form);
      closeModal();
      load();
    } catch (err) {
      alert(err.message);
    }
  };
  const remove = async (id) => {
    if (!confirm('Delete this location? (Fails if it has stock)')) return;
    try {
      await locationsApi.delete(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Warehouse Locations</h1>
        <button type="button" className="btn-primary" onClick={openAdd}>Add Location</button>
      </div>
      <p className="text-slate-600 text-sm">Zone / Rack / Level — assign each roll to a specific location. Search stock by location in Stock page.</p>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="p-6 text-slate-500">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-medium text-slate-700">Zone</th>
                <th className="text-left p-3 font-medium text-slate-700">Rack</th>
                <th className="text-left p-3 font-medium text-slate-700">Level</th>
                <th className="text-right p-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((loc) => (
                <tr key={loc.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-3 font-medium">{loc.zone}</td>
                  <td className="p-3">{loc.rack}</td>
                  <td className="p-3">{loc.level}</td>
                  <td className="p-3 text-right">
                    <button type="button" className="text-red-600 hover:underline" onClick={() => remove(loc.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && list.length === 0 && <p className="p-6 text-slate-500">No locations. Add Zone/Rack/Level to assign GRN stock.</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <div className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Add Location</h2>
            <form onSubmit={save} className="space-y-3">
              <div><label className="label">Zone</label><input className="input" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} required /></div>
              <div><label className="label">Rack</label><input className="input" value={form.rack} onChange={(e) => setForm({ ...form, rack: e.target.value })} required /></div>
              <div><label className="label">Level</label><input className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} required /></div>
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
