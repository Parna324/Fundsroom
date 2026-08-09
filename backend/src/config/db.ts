import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

class InMemoryPoolAdapter {
  private adapterPool: any;
  private initialized: Promise<void>;

  constructor() {
    this.initialized = this.initialize();
  }

  private async initialize(): Promise<void> {
    const { newDb } = await import('pg-mem');
    const db = newDb();
    const adapter = db.adapters.createPg();
    this.adapterPool = new adapter.Pool();

    const schemaSql = `
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'SALES',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE customers (
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

      CREATE TABLE customer_followups (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        note TEXT NOT NULL,
        follow_up_date DATE,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE products (
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

      CREATE TABLE stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        movement_type VARCHAR(10) NOT NULL,
        reason VARCHAR(500),
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE challans (
        id SERIAL PRIMARY KEY,
        challan_number VARCHAR(50) NOT NULL UNIQUE,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        total_quantity INTEGER NOT NULL DEFAULT 0,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE challan_items (
        id SERIAL PRIMARY KEY,
        challan_id INTEGER NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id),
        product_name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        unit_price NUMERIC(12, 2) NOT NULL,
        quantity INTEGER NOT NULL
      );
    `;

    await this.adapterPool.query(schemaSql);

    // Seed test data for development
    try {
      const hash = await bcrypt.hash('Test@1234', 10);
      const users = [
        { name: 'Admin User', email: 'admin@test.com', role: 'ADMIN' },
        { name: 'Sales User', email: 'sales@test.com', role: 'SALES' },
        { name: 'Warehouse User', email: 'warehouse@test.com', role: 'WAREHOUSE' },
        { name: 'Accounts User', email: 'accounts@test.com', role: 'ACCOUNTS' },
      ];

      for (const user of users) {
        await this.adapterPool.query(
          `INSERT INTO users (name, email, password_hash, role) VALUES ('${user.name}', '${user.email}', '${hash}', '${user.role}')`
        );
      }
    } catch (err) {
      console.warn('⚠️ Could not seed test data:', (err as any).message);
    }
  }

  async query(text: string, params?: unknown[]) {
    await this.initialized;
    return this.adapterPool.query(text, params);
  }

  async connect() {
    await this.initialized;
    return this.adapterPool.connect();
  }

  async end() {
    await this.initialized;
    if (typeof this.adapterPool.end === 'function') {
      await this.adapterPool.end();
    }
  }

  on(_event: string, _listener: (...args: unknown[]) => void) {
    return this;
  }
}

const useInMemoryDatabase = process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL;

const pool = useInMemoryDatabase
  ? (new InMemoryPoolAdapter() as unknown as Pool)
  : new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

if (!useInMemoryDatabase) {
  pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });
}

export async function closePool() {
  if (useInMemoryDatabase) {
    await (pool as unknown as InMemoryPoolAdapter).end();
    return;
  }

  await pool.end();
}

export default pool;

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
