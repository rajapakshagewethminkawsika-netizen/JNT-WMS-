const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'database', 'wms.db');
const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

const db = new Database(dbPath);
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

// Seed admin user (password: admin123)
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('admin123', 10);
db.prepare(`
  INSERT OR IGNORE INTO users (username, password_hash, role, full_name)
  VALUES (?, ?, 'admin', 'System Admin')
`).run('admin', hash);

// Seed sample warehouse locations
const locations = [
  ['A', '1', '1'], ['A', '1', '2'], ['A', '2', '1'], ['A', '2', '2'],
  ['B', '1', '1'], ['B', '1', '2'], ['B', '2', '1'], ['B', '2', '2'],
];
const insertLoc = db.prepare('INSERT OR IGNORE INTO warehouse_locations (zone, rack, level) VALUES (?, ?, ?)');
locations.forEach(([z, r, l]) => insertLoc.run(z, r, l));

// Seed one supplier
db.prepare(`
  INSERT OR IGNORE INTO suppliers (supplier_code, name, contact_person, phone, address)
  VALUES ('SUP-001', 'ABC Films', 'Nimal', '0771234567', 'Colombo')
`).run();

// Seed a few products (BOPP samples)
const products = [
  ['BOPP-001', 'Transparent', 20, 1000, 'Transparent BOPP 20 micron'],
  ['BOPP-002', 'Matte', 18, 900, 'Matte BOPP 18 micron'],
  ['BOPP-003', 'White', 25, 1000, 'White BOPP 25 micron'],
];
const insertProd = db.prepare(`
  INSERT OR IGNORE INTO products (product_code, film_type, thickness, width, description)
  VALUES (?, ?, ?, ?, ?)
`);
products.forEach(p => insertProd.run(...p));

// Seed a couple of customers
db.prepare(`
  INSERT OR IGNORE INTO customers (customer_code, name, contact_person, phone, address)
  VALUES ('CUST-001', 'Lanka Foods', 'Sunil', '0711234567', 'Kandy'),
         ('CUST-002', 'Ceylon Packaging', 'Kamal', '0729876543', 'Galle')
`).run();

db.close();
console.log('Database initialized at', dbPath);
