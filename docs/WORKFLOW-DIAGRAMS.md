# JNT Suppliers WMS – Workflow Diagrams

## 1. Login & Authentication

```mermaid
flowchart LR
  A[User] --> B[Login Page]
  B --> C{Valid?}
  C -->|Yes| D[JWT Token]
  C -->|No| B
  D --> E[Dashboard]
  E --> F{Role}
  F -->|Admin| G[Full Access + Users]
  F -->|Warehouse Manager| H[GRN/GDN/Stock/Reports]
  F -->|Storekeeper| H
```

## 2. GRN (Inbound) Workflow

```mermaid
flowchart LR
  A[Select Supplier] --> B[GRN Form]
  B --> C[Add Items: Product + Location + Rolls + KG]
  C --> D[Assign Zone/Rack/Level]
  D --> E[Save GRN]
  E --> F[Update Stock Table]
  F --> G[Optional: Generate QR per Roll]
```

**Steps:**
1. Select supplier
2. Add line items: product, warehouse location (Zone/Rack/Level), rolls, kg
3. Save → backend creates GRN and upserts `stock` (product_id + location_id)
4. Optional: generate barcode/QR label per roll at GRN creation

## 3. GDN (Outbound) Workflow

```mermaid
flowchart LR
  A[Select Customer] --> B[GDN Form]
  B --> C[Add Items: Product + Rolls + KG]
  C --> D[Save GDN]
  D --> E[Reduce Stock by Product]
  E --> F[Deduct from Location Stock]
```

**Steps:**
1. Select customer
2. Add line items: product, rolls, kg
3. Save → backend creates GDN and deducts from `stock` (FIFO by location rows)

## 4. Warehouse Location System

```mermaid
flowchart LR
  A[GRN] --> B[Assign Zone/Rack/Level]
  B --> C[Store in Location]
  C --> D[Stock by Location]
  D --> E[Search / Scan by Location]
```

- Each GRN line stores product + location + rolls + kg
- Stock is queryable by product (summary) or by location (Zone/Rack/Level)
- Barcode/QR scan can resolve to roll → product + location

## 5. Barcode / QR Flow

```mermaid
flowchart LR
  A[GRN Create] --> B[Generate QR per Roll]
  B --> C[Label Roll]
  C --> D[Scan at Receiving]
  D --> E[Auto Update Stock]
  E --> F[Scan at Dispatch]
  F --> G[Mark Dispatched]
```

- **Generate:** `GET /api/barcode/label/:rollId` or `GET /api/barcode/qr/:data` for QR image
- **Scan:** `POST /api/barcode/scan` with `{ barcode, action? }` returns roll details; optional `action: 'dispatch'` marks roll dispatched

## 6. Reports Flow

```mermaid
flowchart LR
  A[Dashboard / Reports] --> B[Select Report Type]
  B --> C[Stock / Supplier / Customer / Movement]
  C --> D[Apply Filters]
  D --> E[View Table]
  E --> F[Export Excel or PDF]
```

- **Stock:** by product or by location
- **Supplier:** GRN history (optional filter by supplier_id)
- **Customer:** GDN history (optional filter by customer_id)
- **Movement:** GRN + GDN combined (date range)
- **Fast Moving:** products by dispatch volume (last N days)
- Export: Excel (XLSX) and PDF (stock report)

## 7. High-Level Module Map

```mermaid
flowchart TB
  subgraph Auth
    L[Login]
    U[User Management - Admin]
  end
  subgraph Master
    P[Products]
    S[Suppliers]
    C[Customers]
    W[Warehouse Locations]
  end
  subgraph Operations
    GRN[GRN Inbound]
    GDN[GDN Outbound]
    ST[Stock View]
  end
  subgraph Reporting
    R[Reports]
    E[Export Excel/PDF]
  end
  L --> Dashboard
  Dashboard --> P & S & C & W & GRN & GDN & ST & R
  R --> E
  U --> L
```

---

All workflows are implemented in the API and UI. Use these diagrams as reference for training or integration.
