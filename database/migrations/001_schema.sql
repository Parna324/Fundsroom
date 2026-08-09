-- ============================================================
-- Mini ERP + CRM — Database Schema Migration 001
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS');
CREATE TYPE customer_type AS ENUM ('RETAIL', 'WHOLESALE', 'DISTRIBUTOR');
CREATE TYPE customer_status AS ENUM ('LEAD', 'ACTIVE', 'INACTIVE');
CREATE TYPE movement_type AS ENUM ('IN', 'OUT');
CREATE TYPE challan_status AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role        user_role NOT NULL DEFAULT 'SALES',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE TABLE customers (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    mobile          VARCHAR(20) NOT NULL,
    email           VARCHAR(255),
    business_name   VARCHAR(255),
    gst_number      VARCHAR(15),
    customer_type   customer_type NOT NULL DEFAULT 'RETAIL',
    address         TEXT,
    status          customer_status NOT NULL DEFAULT 'LEAD',
    follow_up_date  DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_mobile ON customers(mobile);

-- ============================================================
-- CUSTOMER FOLLOW-UPS
-- ============================================================

CREATE TABLE customer_followups (
    id              SERIAL PRIMARY KEY,
    customer_id     INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    note            TEXT NOT NULL,
    follow_up_date  DATE,
    created_by      INTEGER NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_followups_customer ON customer_followups(customer_id);
CREATE INDEX idx_followups_date ON customer_followups(follow_up_date);

-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE products (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    sku                 VARCHAR(100) NOT NULL UNIQUE,
    category            VARCHAR(100) NOT NULL,
    unit_price          NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    current_stock       INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    minimum_stock       INTEGER NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    warehouse_location  VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_stock ON products(current_stock);

-- ============================================================
-- STOCK MOVEMENTS
-- ============================================================

CREATE TABLE stock_movements (
    id              SERIAL PRIMARY KEY,
    product_id      INTEGER NOT NULL REFERENCES products(id),
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    movement_type   movement_type NOT NULL,
    reason          VARCHAR(500),
    created_by      INTEGER NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at DESC);

-- ============================================================
-- CHALLANS
-- ============================================================

CREATE TABLE challans (
    id              SERIAL PRIMARY KEY,
    challan_number  VARCHAR(50) NOT NULL UNIQUE,
    customer_id     INTEGER NOT NULL REFERENCES customers(id),
    status          challan_status NOT NULL DEFAULT 'DRAFT',
    total_quantity  INTEGER NOT NULL DEFAULT 0,
    created_by      INTEGER NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_challans_customer ON challans(customer_id);
CREATE INDEX idx_challans_status ON challans(status);
CREATE INDEX idx_challans_number ON challans(challan_number);

-- ============================================================
-- CHALLAN ITEMS (with product snapshot)
-- ============================================================

CREATE TABLE challan_items (
    id              SERIAL PRIMARY KEY,
    challan_id      INTEGER NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES products(id),
    product_name    VARCHAR(255) NOT NULL,   -- snapshot
    sku             VARCHAR(100) NOT NULL,   -- snapshot
    unit_price      NUMERIC(12, 2) NOT NULL, -- snapshot
    quantity        INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE INDEX idx_challan_items_challan ON challan_items(challan_id);
CREATE INDEX idx_challan_items_product ON challan_items(product_id);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER challans_updated_at BEFORE UPDATE ON challans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
