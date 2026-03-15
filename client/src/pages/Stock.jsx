import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { stock as stockApi } from '../api';

export default function Stock() {
  const [searchParams] = useSearchParams();
  const showLow = searchParams.get('low') === '1';
  const [view, setView] = useState(showLow ? 'low' : 'product');
  const [productList, setProductList] = useState([]);
  const [locationList, setLocationList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [zone, setZone] = useState('');
  const [rack, setRack] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stockApi.summary().then(setSummary);
  }, []);

  useEffect(() => {
    setLoading(true);
    if (view === 'product') {
      stockApi.byProduct().then(setProductList).finally(() => setLoading(false));
    } else if (view === 'location') {
      stockApi.byLocation({ zone: zone || undefined, rack: rack || undefined }).then(setLocationList).finally(() => setLoading(false));
    } else {
      stockApi.lowStock(10).then(setProductList).finally(() => setLoading(false));
    }
  }, [view, zone, rack]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Stock</h1>
      <p className="text-slate-600 text-sm">Track stock by product or by warehouse location (Zone/Rack/Level).</p>

      {summary && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <p className="text-sm text-slate-500">Total Rolls</p>
            <p className="text-xl font-bold text-slate-900">{Number(summary.total_rolls || 0).toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-500">Total KG</p>
            <p className="text-xl font-bold text-slate-900">{Number(summary.total_kg || 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={view === 'product' ? 'btn-primary' : 'btn-secondary'} onClick={() => setView('product')}>By Product</button>
        <button type="button" className={view === 'location' ? 'btn-primary' : 'btn-secondary'} onClick={() => setView('location')}>By Location</button>
        <button type="button" className={view === 'low' ? 'btn-primary' : 'btn-secondary'} onClick={() => setView('low')}>Low Stock (&lt;10 rolls)</button>
      </div>

      {view === 'location' && (
        <div className="flex gap-2 flex-wrap">
          <input className="input w-24" placeholder="Zone" value={zone} onChange={(e) => setZone(e.target.value)} />
          <input className="input w-24" placeholder="Rack" value={rack} onChange={(e) => setRack(e.target.value)} />
        </div>
      )}

      <div className="card overflow-x-auto">
        {loading ? <p className="p-6 text-slate-500">Loading…</p> : view === 'product' || view === 'low' ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-medium text-slate-700">Product Code</th>
                <th className="text-left p-3 font-medium text-slate-700">Film Type</th>
                <th className="text-left p-3 font-medium text-slate-700">Thickness</th>
                <th className="text-left p-3 font-medium text-slate-700">Width</th>
                <th className="text-right p-3 font-medium text-slate-700">Rolls</th>
                <th className="text-right p-3 font-medium text-slate-700">KG</th>
              </tr>
            </thead>
            <tbody>
              {productList.map((row) => (
                <tr key={row.product_id} className="border-b border-slate-100">
                  <td className="p-3 font-medium">{row.product_code}</td>
                  <td className="p-3">{row.film_type}</td>
                  <td className="p-3">{row.thickness}</td>
                  <td className="p-3">{row.width}</td>
                  <td className="p-3 text-right">{Number(row.rolls || 0).toLocaleString()}</td>
                  <td className="p-3 text-right">{Number(row.kg || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-medium text-slate-700">Zone</th>
                <th className="text-left p-3 font-medium text-slate-700">Rack</th>
                <th className="text-left p-3 font-medium text-slate-700">Level</th>
                <th className="text-left p-3 font-medium text-slate-700">Product</th>
                <th className="text-left p-3 font-medium text-slate-700">Film Type</th>
                <th className="text-right p-3 font-medium text-slate-700">Rolls</th>
                <th className="text-right p-3 font-medium text-slate-700">KG</th>
              </tr>
            </thead>
            <tbody>
              {locationList.map((row) => (
                <tr key={`${row.location_id}-${row.product_id}`} className="border-b border-slate-100">
                  <td className="p-3 font-medium">{row.zone}</td>
                  <td className="p-3">{row.rack}</td>
                  <td className="p-3">{row.level}</td>
                  <td className="p-3">{row.product_code}</td>
                  <td className="p-3">{row.film_type}</td>
                  <td className="p-3 text-right">{Number(row.rolls || 0).toLocaleString()}</td>
                  <td className="p-3 text-right">{Number(row.kg || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && ((view !== 'location' && productList.length === 0) || (view === 'location' && locationList.length === 0)) && (
          <p className="p-6 text-slate-500">No stock data.</p>
        )}
      </div>
    </div>
  );
}
