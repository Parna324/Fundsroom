-- Mini ERP + CRM PostgreSQL schema
-- Safe to run repeatedly: creates required tables and indexes if missing.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'SALES',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  business_name VARCHAR(255),
  gst_number VARCHAR(15),
  customer_type VARCHAR(50) NOT NULL DEFAULT 'RETAIL',
  address TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'LEAD',
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_followups (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  follow_up_date DATE,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  warehouse_location VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  movement_type VARCHAR(10) NOT NULL,
  reason VARCHAR(500),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challans (
  id SERIAL PRIMARY KEY,
  challan_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  total_quantity INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challan_items (
  id SERIAL PRIMARY KEY,
  challan_id INTEGER NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_follow_up_date ON customers(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_customer_followups_customer_id ON customer_followups(customer_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_challans_customer_id ON challans(customer_id);
CREATE INDEX IF NOT EXISTS idx_challans_status ON challans(status);
CREATE INDEX IF NOT EXISTS idx_challan_items_challan_id ON challan_items(challan_id);
