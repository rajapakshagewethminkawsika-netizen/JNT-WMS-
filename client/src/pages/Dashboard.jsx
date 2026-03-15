import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboard as dashboardApi } from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Loading dashboard…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!data) return null;

  const { totalInventory, todayReceived, todayDispatched, lowStockCount, fastMoving, recentGrn, recentGdn } = data;
  const chartData = (fastMoving || []).slice(0, 8).map((p) => ({ name: p.film_type || p.product_code, rolls: p.rolls || 0 }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Total Inventory</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {Number(totalInventory?.rolls ?? 0).toLocaleString()} Rolls
          </p>
          <p className="text-slate-600">{Number(totalInventory?.kg ?? 0).toLocaleString()} KG</p>
        </div>
        <div className="card p-5 border-l-4 border-green-500">
          <p className="text-sm text-slate-500">Today Received (GRN)</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {Number(todayReceived?.rolls ?? 0).toLocaleString()} Rolls
          </p>
          <p className="text-slate-600">{Number(todayReceived?.kg ?? 0).toLocaleString()} KG</p>
        </div>
        <div className="card p-5 border-l-4 border-blue-500">
          <p className="text-sm text-slate-500">Today Dispatched (GDN)</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {Number(todayDispatched?.rolls ?? 0).toLocaleString()} Rolls
          </p>
          <p className="text-slate-600">{Number(todayDispatched?.kg ?? 0).toLocaleString()} KG</p>
        </div>
        <div className="card p-5 border-l-4 border-amber-500">
          <p className="text-sm text-slate-500">Low Stock Alerts</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{lowStockCount ?? 0} Items</p>
          <Link to="/stock?low=1" className="text-sm text-primary-600 hover:underline mt-1 inline-block">
            View stock →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Fast Moving Products</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="rolls" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm">No dispatch data in last 30 days</p>
          )}
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Recent Transactions</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {(recentGrn || []).map((g) => (
              <div key={`grn-${g.id}`} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <span className="font-medium text-slate-800">{g.grn_number}</span>
                  <span className="text-slate-500 text-sm ml-2">{g.supplier_name}</span>
                </div>
                <span className="text-green-600 font-medium">+{g.rolls ?? 0} Rolls</span>
              </div>
            ))}
            {(recentGdn || []).map((g) => (
              <div key={`gdn-${g.id}`} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <span className="font-medium text-slate-800">{g.gdn_number}</span>
                  <span className="text-slate-500 text-sm ml-2">{g.customer_name}</span>
                </div>
                <span className="text-blue-600 font-medium">-{g.rolls ?? 0} Rolls</span>
              </div>
            ))}
            {(!recentGrn?.length && !recentGdn?.length) && (
              <p className="text-slate-500 text-sm">No recent transactions</p>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Link to="/grn" className="btn-primary text-sm">New GRN</Link>
            <Link to="/gdn" className="btn-secondary text-sm">New GDN</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
