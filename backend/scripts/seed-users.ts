import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set to seed users');
}

const users = [
  { name: 'Admin User', email: 'admin@test.com', role: 'ADMIN' },
  { name: 'Sales Manager', email: 'sales@test.com', role: 'SALES' },
  { name: 'Warehouse Staff', email: 'warehouse@test.com', role: 'WAREHOUSE' },
  { name: 'Accounts Team', email: 'accounts@test.com', role: 'ACCOUNTS' },
];

async function seedUsers() {
  const passwordHash = await bcrypt.hash('Test@1234', 10);
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const user of users) {
      await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE
           SET name = EXCLUDED.name,
               password_hash = EXCLUDED.password_hash,
               role = EXCLUDED.role,
               updated_at = NOW()`,
        [user.name, user.email, passwordHash, user.role]
      );
    }

    await client.query('COMMIT');
    console.log('Required users seeded');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedUsers().catch((err) => {
  console.error('User seed failed:', err);
  process.exit(1);
});
