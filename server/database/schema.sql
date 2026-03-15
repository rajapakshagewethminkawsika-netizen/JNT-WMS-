-- JNT Suppliers WMS - Database Schema
-- SQLite compatible

-- Users & Auth
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'warehouse_manager', 'storekeeper')),
  full_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products (~75 BOPP film types)
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_code TEXT UNIQUE NOT NULL,
  film_type TEXT NOT NULL,
  thickness REAL NOT NULL,
  width INTEGER NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_code TEXT UNIQUE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customers (~20k)
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_code TEXT UNIQUE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Warehouse locations: Zone / Rack / Level
CREATE TABLE IF NOT EXISTS warehouse_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone TEXT NOT NULL,
  rack TEXT NOT NULL,
  level TEXT NOT NULL,
  UNIQUE(zone, rack, level)
);

-- Stock (per product, per location) - Rolls + KG
CREATE TABLE IF NOT EXISTS stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  location_id INTEGER NOT NULL REFERENCES warehouse_locations(id),
  rolls INTEGER NOT NULL DEFAULT 0,
  kg REAL NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, location_id)
);

-- Individual roll tracking (for barcode/QR)
CREATE TABLE IF NOT EXISTS rolls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roll_barcode TEXT UNIQUE NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id),
  location_id INTEGER REFERENCES warehouse_locations(id),
  kg REAL NOT NULL,
  status TEXT DEFAULT 'in_stock' CHECK(status IN ('in_stock', 'dispatched', 'reserved')),
  grn_id INTEGER,
  gdn_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- GRN (Goods Received Note) - Inbound
CREATE TABLE IF NOT EXISTS grn (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grn_number TEXT UNIQUE NOT NULL,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  notes TEXT
);

-- GRN line items
CREATE TABLE IF NOT EXISTS grn_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grn_id INTEGER NOT NULL REFERENCES grn(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  location_id INTEGER NOT NULL REFERENCES warehouse_locations(id),
  rolls INTEGER NOT NULL,
  kg REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- GDN (Goods Dispatch Note) - Outbound
CREATE TABLE IF NOT EXISTS gdn (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gdn_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  dispatched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  notes TEXT
);

-- GDN line items
CREATE TABLE IF NOT EXISTS gdn_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gdn_id INTEGER NOT NULL REFERENCES gdn(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  rolls INTEGER NOT NULL,
  kg REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit / Movement log
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  user_id INTEGER REFERENCES users(id),
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance (20k customers, many transactions)
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_grn_supplier ON grn(supplier_id);
CREATE INDEX IF NOT EXISTS idx_grn_received ON grn(received_at);
CREATE INDEX IF NOT EXISTS idx_gdn_customer ON gdn(customer_id);
CREATE INDEX IF NOT EXISTS idx_gdn_dispatched ON gdn(dispatched_at);
CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock(location_id);
CREATE INDEX IF NOT EXISTS idx_rolls_barcode ON rolls(roll_barcode);
CREATE INDEX IF NOT EXISTS idx_rolls_product ON rolls(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
