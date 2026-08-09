# Mini ERP + CRM Operations Portal

A production-quality full-stack ERP + CRM application for wholesale/distribution companies, built with Node.js, TypeScript, Express, PostgreSQL, React, and Vite.

---

## 🏗 Architecture Overview

```
Fundsroom/
├── backend/              # Node.js + TypeScript + Express API
│   ├── src/
│   │   ├── config/        # Database pool, environment
│   │   ├── controllers/   # HTTP handlers
│   │   ├── middleware/    # Auth, Error, Validation
│   │   ├── repositories/  # DB queries (pg driver)
│   │   ├── routes/        # Express routers
│   │   ├── services/      # Business logic (transactions)
│   │   ├── utils/         # Response helpers, JWT, bcrypt
│   │   ├── validations/   # Zod schemas
│   │   ├── __tests__/     # Jest + Supertest test suite
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/             # React + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/    # Shared UI components
│   │   ├── context/       # AuthContext, ToastContext
│   │   ├── layouts/       # AppLayout, Sidebar, Topbar
│   │   ├── pages/         # All route pages
│   │   ├── services/      # Axios API client + endpoints
│   │   ├── types/         # TypeScript interfaces
│   │   ├── App.tsx        # Router configuration
│   │   ├── main.tsx       # Entry point
│   │   └── index.css      # Design system CSS
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── database/
│   ├── migrations/001_schema.sql    # Full PostgreSQL schema
│   └── seed/seed.ts                 # TypeScript seeder
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm

### 1. Clone and setup

```bash
git clone <repo>
cd Fundsroom
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials and JWT secret
npm install
```

### 3. Database setup

Create the database and run migrations:

```bash
psql -U postgres -c "CREATE DATABASE mini_erp;"
psql -U postgres -d mini_erp -f database/migrations/001_schema.sql
```

Seed with test data:

```bash
cd database/seed
npm install  # if separate, or use ts-node
npx ts-node seed.ts
```

### 4. Run backend

```bash
cd backend
npm run dev    # Starts on http://localhost:5000
```

### 5. Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev    # Starts on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:5000`.

---

## 🧪 Running Tests

```bash
cd backend
npm test
```

The test suite covers 13+ cases including:
- Auth: login, invalid credentials, protected routes
- Role-based access control
- Challan: create draft, confirm (stock deduction), cancel
- Stock integrity: prevents negative inventory via DB transaction + row locking
- Snapshot integrity: challan items capture price/name at creation time

---

## 🔐 Test Accounts

| Role      | Email                 | Password    |
|-----------|-----------------------|-------------|
| Admin     | admin@test.com        | Test@1234   |
| Sales     | sales@test.com        | Test@1234   |
| Warehouse | warehouse@test.com    | Test@1234   |
| Accounts  | accounts@test.com     | Test@1234   |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint         | Description |
|--------|-----------------|-------------|
| POST   | `/api/auth/login` | Login, returns JWT |
| GET    | `/api/auth/me`    | Get current user |

### Customers
| Method | Endpoint                             | Description |
|--------|-------------------------------------|-------------|
| GET    | `/api/customers`                     | List with search/filter/pagination |
| POST   | `/api/customers`                     | Create customer (ADMIN, SALES) |
| GET    | `/api/customers/:id`                 | Get customer by ID |
| PUT    | `/api/customers/:id`                 | Update customer (ADMIN, SALES) |
| DELETE | `/api/customers/:id`                 | Delete customer (ADMIN) |
| GET    | `/api/customers/:id/followups`       | List follow-ups |
| POST   | `/api/customers/:id/followups`       | Add follow-up (ADMIN, SALES) |

### Products
| Method | Endpoint                 | Description |
|--------|-------------------------|-------------|
| GET    | `/api/products`          | List products |
| POST   | `/api/products`          | Create product (ADMIN, WAREHOUSE) |
| GET    | `/api/products/:id`      | Get product |
| PUT    | `/api/products/:id`      | Update product (ADMIN, WAREHOUSE) |
| GET    | `/api/products/categories` | Get all categories |
| GET    | `/api/products/low-stock`  | Get low-stock products |

### Inventory
| Method | Endpoint                          | Description |
|--------|----------------------------------|-------------|
| GET    | `/api/inventory`                  | Inventory overview + stats |
| GET    | `/api/inventory/movements`        | All recent movements |
| GET    | `/api/inventory/:productId/movements` | Per-product movements |

### Challans
| Method | Endpoint                      | Description |
|--------|------------------------------|-------------|
| GET    | `/api/challans`               | List challans |
| POST   | `/api/challans`               | Create draft challan (ADMIN, SALES) |
| GET    | `/api/challans/:id`           | Get challan with items |
| POST   | `/api/challans/:id/confirm`   | Confirm (deducts stock, atomic transaction) |
| POST   | `/api/challans/:id/cancel`    | Cancel draft |

### Dashboard
| Method | Endpoint         | Description |
|--------|-----------------|-------------|
| GET    | `/api/dashboard` | KPIs, low stock, recent data |

---

## 🔑 Business Rules

1. **Stock NEVER goes negative** — challan confirmation runs in a PostgreSQL transaction with `SELECT FOR UPDATE` row locks. Concurrency is safe.

2. **Challan snapshot** — `challan_items` captures product name, SKU, and unit price at creation time. Historical data is immutable even if products change later.

3. **Role-based access**:
   - `ADMIN` — full access
   - `SALES` — customers, challans, view inventory
   - `WAREHOUSE` — products, inventory, stock movements
   - `ACCOUNTS` — read-only on customers, products, challans

4. **Atomic confirmation** — if any single product in a challan has insufficient stock, the entire transaction rolls back and a `409 Conflict` is returned with detailed insufficient-stock information.

---

## 🐳 Docker

```bash
docker-compose up -d
```

This starts:
- `postgres` — PostgreSQL 15 with schema auto-applied
- `backend` — Express API on port 5000

Note: Run the seed script separately after containers are up.

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend runtime | Node.js 20, TypeScript |
| API framework | Express.js |
| Database | PostgreSQL 15 |
| ORM/Query | pg (node-postgres), raw SQL |
| Validation | Zod |
| Auth | JWT (jsonwebtoken) |
| Password | bcryptjs |
| Security | Helmet, CORS, express-rate-limit |
| Testing | Jest, Supertest |
| Frontend framework | React 18, TypeScript |
| Build tool | Vite 5 |
| HTTP client | Axios |
| Routing | React Router v6 |
| Styling | Vanilla CSS (design system) |
| Fonts | Inter, JetBrains Mono |
