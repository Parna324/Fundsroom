import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set to run migrations');
}

async function migrate() {
  const migrationPath = path.resolve(process.cwd(), '..', 'database', 'migrations', '001_schema.sql');
  const schemaSql = fs.readFileSync(migrationPath, 'utf8');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await pool.query(schemaSql);
    console.log('Database schema migration completed');
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Database schema migration failed:', err);
  process.exit(1);
});
