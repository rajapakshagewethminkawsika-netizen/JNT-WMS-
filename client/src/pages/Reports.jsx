import React, { useState, useEffect } from 'react';
import { reports as reportsApi } from '../api';

const tabs = [
  { id: 'stock', label: 'Stock Report', byLocation: false },
  { id: 'stock-loc', label: 'Stock by Location', byLocation: true },
  { id: 'supplier', label: 'Supplier (GRN) Report' },
  { id: 'customer', label: 'Customer (GDN) Report' },
  { id: 'movement', label: 'Movement / Audit Report' },
  { id: 'fast', label: 'Fast Moving' },
];

export default function Reports() {
  const [active, setActive] = useState('stock');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    setLoading(true);
    if (active === 'stock') {
      reportsApi.stock().then(setData).finally(() => setLoading(false));
    } else if (active === 'stock-loc') {
      reportsApi.stock({ by_location: 'true' }).then(setData).finally(() => setLoading(false));
    } else if (active === 'supplier') {
      reportsApi.supplier().then(setData).finally(() => setLoading(false));
    } else if (active === 'customer') {
      reportsApi.customer().then(setData).finally(() => setLoading(false));
    } else if (active === 'movement') {
      reportsApi.movement({ from, to }).then(setData).finally(() => setLoading(false));
    } else {
      reportsApi.fastMoving(30).then(setData).finally(() => setLoading(false));
    }
  }, [active, from, to]);

  const exportExcel = () => {
    if (active === 'stock' || active === 'stock-loc') reportsApi.exportStockExcel();
    else if (active === 'supplier') reportsApi.exportSupplierExcel();
    else if (active === 'customer') reportsApi.exportCustomerExcel();
    else if (active === 'movement') reportsApi.exportMovementExcel();
  };
  const exportPdf = () => {
    if (active === 'stock') reportsApi.exportStockPdf();
  };

  const rows = Array.isArray(data) ? data : [];
  const first = rows[0];
  const keys = first ? Object.keys(first) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
      <p className="text-slate-600 text-sm">Stock, Supplier, Customer, Movement reports. Export to Excel or PDF.</p>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={active === t.id ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === 'movement' && (
        <div className="flex gap-2 flex-wrap items-center">
          <input type="date" className="input w-40" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" />
          <input type="date" className="input w-40" value={to} onChange={(e) => setTo(e.target.value)} placeholder="To" />
        </div>
      )}

      <div className="flex gap-2">
        {(active === 'stock' || active === 'stock-loc' || active === 'supplier' || active === 'customer' || active === 'movement') && (
          <button type="button" className="btn-primary" onClick={exportExcel}>Export Excel</button>
        )}
        {active === 'stock' && (
          <button type="button" className="btn-secondary" onClick={exportPdf}>Export PDF</button>
        )}
      </div>

      <div className="card overflow-x-auto">
        {loading ? <p className="p-6 text-slate-500">Loading…</p> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {keys.map((k) => (
                  <th key={k} className="text-left p-3 font-medium text-slate-700 capitalize">{k.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-100">
                  {keys.map((k) => (
                    <td key={k} className="p-3">{String(row[k] ?? '—')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && rows.length === 0 && <p className="p-6 text-slate-500">No data.</p>}
      </div>
    </div>
  );
}
