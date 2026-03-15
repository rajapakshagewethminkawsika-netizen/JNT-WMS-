# JNT Suppliers WMS – Technical Specifications

## 1. Stack Overview

| Layer   | Technology |
|--------|------------|
| Frontend | React 18, Vite, React Router, Tailwind CSS, Recharts |
| Backend  | Node.js, Express |
| Database | SQLite (better-sqlite3) – replaceable with PostgreSQL for production scale |
| Auth     | JWT (Bearer), bcrypt password hashing |
| Export   | Excel (xlsx), PDF (pdfkit) |
| Barcode/QR | qrcode (PNG), scan API for roll lookup |

## 2. Database Schema Summary

- **users** – username, password_hash, role (admin | warehouse_manager | storekeeper), full_name
- **products** – product_code, film_type, thickness, width, description (~75 BOPP types)
- **suppliers** – supplier_code, name, contact_person, phone, address
- **customers** – customer_code, name, contact_person, phone, address (~20k scale, paginated)
- **warehouse_locations** – zone, rack, level (unique)
- **stock** – product_id, location_id, rolls, kg (unique on product_id + location_id)
- **rolls** – roll_barcode, product_id, location_id, kg, status (in_stock | dispatched | reserved), grn_id, gdn_id
- **grn** – grn_number, supplier_id, received_at, created_by, notes
- **grn_items** – grn_id, product_id, location_id, rolls, kg
- **gdn** – gdn_number, customer_id, dispatched_at, created_by, notes
- **gdn_items** – gdn_id, product_id, rolls, kg
- **audit_log** – action, entity_type, entity_id, user_id, details, created_at

Indexes on: customers(name, customer_code), grn(supplier_id, received_at), gdn(customer_id, dispatched_at), stock(product_id, location_id), rolls(roll_barcode), audit_log(entity_type, entity_id, created_at).

## 3. API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST   | /api/auth/login | Login, returns JWT + user | No |
| GET    | /api/dashboard | Dashboard aggregates | Yes |
| CRUD   | /api/products | Products | Yes |
| CRUD   | /api/suppliers | Suppliers | Yes |
| CRUD   | /api/customers | Customers (paginated, search) | Yes |
| GET/POST/DELETE | /api/locations | Warehouse locations | Yes |
| GET/POST | /api/grn | List GRN, create GRN | Yes |
| GET    | /api/grn/today | Today’s GRN summary | Yes |
| GET    | /api/grn/:id | GRN detail with items | Yes |
| GET/POST | /api/gdn | List GDN, create GDN | Yes |
| GET    | /api/gdn/today | Today’s GDN summary | Yes |
| GET    | /api/gdn/:id | GDN detail with items | Yes |
| GET    | /api/stock/summary | Total rolls/kg | Yes |
| GET    | /api/stock/by-product | Stock grouped by product | Yes |
| GET    | /api/stock/by-location | Stock by zone/rack/level | Yes |
| GET    | /api/stock/low-stock | Products below threshold | Yes |
| GET    | /api/reports/stock, /supplier, /customer, /movement, /fast-moving | Report data | Yes |
| GET    | /api/reports/export/stock|supplier|customer|movement | Excel download | Yes |
| GET    | /api/reports/pdf/stock | PDF download | Yes |
| GET/POST/PATCH/DELETE | /api/users | User management | Admin only |
| GET    | /api/barcode/qr/:data | QR image | Yes |
| GET    | /api/barcode/label/:rollId | Roll label QR | Yes |
| POST   | /api/barcode/scan | Scan barcode, optional dispatch | Yes |

All authenticated requests use header: `Authorization: Bearer <token>`.

## 4. Frontend Routes

| Path | Component | Description |
|------|-----------|-------------|
| /login | Login | Username/password, JWT stored in localStorage |
| / | Dashboard | KPIs, today GRN/GDN, low stock, fast moving, recent transactions |
| /products | Products | List, Add, Edit, Delete (~75 BOPP types) |
| /suppliers | Suppliers | List, Add, Edit, Delete |
| /customers | Customers | List (paginated + search), Add, Edit, Delete |
| /locations | Locations | Zone/Rack/Level, Add, Delete (if no stock) |
| /grn | GRN | Create GRN (supplier + items with location), list GRN |
| /gdn | GDN | Create GDN (customer + items), list GDN |
| /stock | Stock | By product, by location, low stock |
| /reports | Reports | Stock, Stock by location, Supplier, Customer, Movement, Fast moving; Export Excel/PDF |
| /users | Users | Admin only: list, add, edit, delete users |

## 5. Security

- Passwords hashed with bcrypt (rounds 10)
- JWT expiry: 7 days; refresh not implemented (re-login)
- Admin-only: user CRUD
- Role checks on backend for /api/users (admin only)

## 6. Deployment Notes

- **Environment:** Set `NODE_ENV=production`, `PORT` for API. Optional `JWT_SECRET`.
- **Database:** Run `npm run db:init` once to create `server/database/wms.db` and seed admin (admin / admin123), sample locations, one supplier, a few products, two customers.
- **Client:** `cd client && npm run build`; serve `client/dist` or use Express static in production.
- **Scale:** For ~20k customers and high concurrency, replace SQLite with PostgreSQL and use connection pooling; schema can be adapted with minimal changes (serial types, ON CONFLICT same idea).

## 7. Optional Mobile Version

- Same API; build a separate React Native or PWA client that uses the same endpoints.
- Recommended: responsive web (current) + PWA for “Add to Home Screen” and offline cache for viewing recent data.
- Barcode/QR: use device camera + JS QR/barcode library (e.g. html5-qrcode or native module in React Native) and call `POST /api/barcode/scan`.

---

This document is the single reference for developers extending or deploying the JNT Suppliers WMS.
