# JNT Suppliers WMS

Warehouse Management System for **JNT Suppliers**: BOPP film inventory, GRN (inbound), GDN (outbound), warehouse locations (Zone/Rack/Level), and reports.

## Features

- **Login & user management** – Roles: Admin, Warehouse Manager, Storekeeper. Secure JWT auth. Admin can create users.
- **Dashboard** – Total inventory (Rolls + KG), today’s GRN/GDN, low stock alerts, fast moving products chart, recent transactions.
- **Products** – ~75 BOPP film types: Product Code, Film Type, Thickness, Width, Description. Add/Edit/Delete.
- **Suppliers** – Supplier ID, Name, Contact Person, Phone, Address. Ready for multiple suppliers.
- **Customers** – ~20k scale: paginated list with search. Same fields as suppliers.
- **GRN (Inbound)** – Create GRN per supplier; assign rolls to warehouse location (Zone/Rack/Level); stock auto-updates (Roll + KG).
- **GDN (Outbound)** – Create GDN per customer; select product & quantity; stock auto-reduces.
- **Warehouse locations** – Track stock per Zone/Rack/Level; search stock by location.
- **Barcode / QR** – Generate QR for rolls; scan API for receiving/dispatch (see API docs).
- **Reports** – Stock (by film type & location), Supplier (GRN history), Customer (GDN history), Movement/Audit, Fast moving. Export to Excel and PDF.
- **Mobile-friendly** – Responsive UI (Tailwind); works on phones and tablets.

## Quick Start

### Prerequisites

- Node.js 18+

### Install and run

```bash
# Install root + client dependencies
npm run install:all

# Initialize database (creates SQLite DB + seed data)
npm run db:init

# Start API server and frontend dev server
npm run dev
```

- **API:** http://localhost:3001  
- **Client:** http://localhost:5173  

**Default login:** `admin` / `admin123`

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run backend + frontend (concurrently) |
| `npm run server` | Run API only (port 3001) |
| `npm run client` | Run Vite dev server only (port 5173) |
| `npm run db:init` | Create and seed database |
| `npm run build` | Build client for production |

## Project Structure

```
├── client/                 # React (Vite + Tailwind)
│   ├── src/
│   │   ├── components/     # Layout, shared UI
│   │   ├── context/        # Auth
│   │   ├── pages/          # Login, Dashboard, Products, ...
│   │   ├── api.js          # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/
│   ├── database/
│   │   ├── schema.sql      # Full schema
│   │   └── wms.db          # Created by db:init
│   ├── middleware/         # Auth, roles
│   ├── routes/             # auth, dashboard, products, suppliers, ...
│   ├── scripts/
│   │   └── initDb.js       # Seed DB
│   ├── db.js
│   └── index.js
├── docs/
│   ├── WORKFLOW-DIAGRAMS.md  # Mermaid workflows (GRN, GDN, etc.)
│   └── TECHNICAL-SPECIFICATIONS.md  # API, DB, deployment
└── README.md
```

## Docs for Developers

- **Workflow diagrams:** [docs/WORKFLOW-DIAGRAMS.md](docs/WORKFLOW-DIAGRAMS.md) – GRN, GDN, locations, barcode, reports.
- **Technical spec:** [docs/TECHNICAL-SPECIFICATIONS.md](docs/TECHNICAL-SPECIFICATIONS.md) – Database schema, API list, security, deployment, optional mobile.

## License

Private / internal use – JNT Suppliers.
