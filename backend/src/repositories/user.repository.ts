import pool from '../config/db';
import { User, UserPublic } from '../types';

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
}

export async function findUserById(id: number): Promise<UserPublic | null> {
  const result = await pool.query(
    'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function findAllUsers(): Promise<UserPublic[]> {
  const result = await pool.query(
    'SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY name'
  );
  return result.rows;
}
