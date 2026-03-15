const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('wms_token');
}

export async function api(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('wms_token');
    localStorage.removeItem('wms_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  const data = res.ok ? await res.json().catch(() => null) : null;
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

export const auth = {
  login: (username, password) => api('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
};

export const dashboard = () => api('/dashboard');

export const products = {
  list: () => api('/products'),
  get: (id) => api(`/products/${id}`),
  create: (body) => api('/products', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => api(`/products/${id}`, { method: 'DELETE' }),
};

export const suppliers = {
  list: () => api('/suppliers'),
  get: (id) => api(`/suppliers/${id}`),
  create: (body) => api('/suppliers', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => api(`/suppliers/${id}`, { method: 'DELETE' }),
};

export const customers = {
  list: (params) => api('/customers?' + new URLSearchParams(params || {}).toString()),
  get: (id) => api(`/customers/${id}`),
  create: (body) => api('/customers', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => api(`/customers/${id}`, { method: 'DELETE' }),
};

export const locations = {
  list: () => api('/locations'),
  create: (body) => api('/locations', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id) => api(`/locations/${id}`, { method: 'DELETE' }),
};

export const grn = {
  list: (params) => api('/grn?' + new URLSearchParams(params || {}).toString()),
  today: () => api('/grn/today'),
  get: (id) => api(`/grn/${id}`),
  create: (body) => api('/grn', { method: 'POST', body: JSON.stringify(body) }),
};

export const gdn = {
  list: (params) => api('/gdn?' + new URLSearchParams(params || {}).toString()),
  today: () => api('/gdn/today'),
  get: (id) => api(`/gdn/${id}`),
  create: (body) => api('/gdn', { method: 'POST', body: JSON.stringify(body) }),
};

export const stock = {
  summary: () => api('/stock/summary'),
  byProduct: () => api('/stock/by-product'),
  byLocation: (params) => api('/stock/by-location?' + new URLSearchParams(params || {}).toString()),
  lowStock: (threshold) => api('/stock/low-stock?' + (threshold != null ? `threshold=${threshold}` : '')),
};

async function downloadExport(path, filename) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const reports = {
  stock: (params) => api('/reports/stock?' + new URLSearchParams(params || {}).toString()),
  supplier: (params) => api('/reports/supplier?' + new URLSearchParams(params || {}).toString()),
  customer: (params) => api('/reports/customer?' + new URLSearchParams(params || {}).toString()),
  movement: (params) => api('/reports/movement?' + new URLSearchParams(params || {}).toString()),
  fastMoving: (days) => api('/reports/fast-moving?' + (days ? `days=${days}` : '')),
  exportStockExcel: () => downloadExport('/reports/export/stock', 'stock-report.xlsx'),
  exportSupplierExcel: () => downloadExport('/reports/export/supplier', 'supplier-report.xlsx'),
  exportCustomerExcel: () => downloadExport('/reports/export/customer', 'customer-report.xlsx'),
  exportMovementExcel: () => downloadExport('/reports/export/movement', 'movement-report.xlsx'),
  exportStockPdf: () => downloadExport('/reports/pdf/stock', 'stock-report.pdf'),
};

export const users = {
  list: () => api('/users'),
  create: (body) => api('/users', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => api(`/users/${id}`, { method: 'DELETE' }),
};

export function exportUrl(path) {
  const token = getToken();
  return `${API_BASE}${path}${token ? '?token=' + token : ''}`;
}
