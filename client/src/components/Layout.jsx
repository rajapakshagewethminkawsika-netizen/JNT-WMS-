import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/suppliers', label: 'Suppliers', icon: '🏭' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/locations', label: 'Locations', icon: '📍' },
  { to: '/grn', label: 'GRN (Inbound)', icon: '📥' },
  { to: '/gdn', label: 'GDN (Outbound)', icon: '📤' },
  { to: '/stock', label: 'Stock', icon: '📋' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/users', label: 'Users', icon: '👤' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = user?.role === 'admin' ? nav : nav.filter((x) => x.to !== '/users');

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-slate-700">
          <span className="font-semibold text-lg">JNT Suppliers WMS</span>
          <button type="button" className="md:hidden p-2" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            ✕
          </button>
        </div>
        <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 gap-4">
          <button
            type="button"
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="hidden sm:inline">{user?.full_name || user?.username}</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">{user?.role?.replace('_', ' ')}</span>
            <button type="button" onClick={handleLogout} className="btn-secondary text-sm">
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}
    </div>
  );
}
