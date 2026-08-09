import pool from '../config/db';
import { Customer, CustomerFollowup } from '../types';
import { z } from 'zod';
import { createCustomerSchema, customerQuerySchema } from '../validations/schemas';

type CreateCustomerData = z.infer<typeof createCustomerSchema>;

export async function findCustomers(
  query: z.infer<typeof customerQuerySchema>
): Promise<{ data: Customer[]; total: number }> {
  const { page, limit, search, status, customerType } = query;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (search) {
    conditions.push(`(c.name ILIKE $${paramIdx} OR c.business_name ILIKE $${paramIdx} OR c.mobile ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }
  if (status) {
    conditions.push(`c.status = $${paramIdx}`);
    params.push(status);
    paramIdx++;
  }
  if (customerType) {
    conditions.push(`c.customer_type = $${paramIdx}`);
    params.push(customerType);
    paramIdx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [dataResult, countResult] = await Promise.all([
    pool.query(
      `SELECT c.* FROM customers c ${where} ORDER BY c.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT COUNT(*) FROM customers c ${where}`, params),
  ]);

  return {
    data: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function findCustomerById(id: number): Promise<Customer | null> {
  const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createCustomer(data: CreateCustomerData): Promise<Customer> {
  const {
    name, mobile, email, business_name, gst_number, customer_type,
    address, status, follow_up_date, notes,
  } = data;

  const result = await pool.query(
    `INSERT INTO customers
      (name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      name,
      mobile,
      email || null,
      business_name || null,
      gst_number || null,
      customer_type,
      address || null,
      status,
      follow_up_date || null,
      notes || null,
    ]
  );
  return result.rows[0];
}

export async function updateCustomer(id: number, data: Partial<CreateCustomerData>): Promise<Customer | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const allowed: (keyof CreateCustomerData)[] = [
    'name', 'mobile', 'email', 'business_name', 'gst_number', 'customer_type',
    'address', 'status', 'follow_up_date', 'notes',
  ];

  for (const key of allowed) {
    if (key in data) {
      fields.push(`${key} = $${idx}`);
      values.push(data[key] === '' ? null : data[key]);
      idx++;
    }
  }

  if (fields.length === 0) return findCustomerById(id);

  values.push(id);
  const result = await pool.query(
    `UPDATE customers SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteCustomer(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM customers WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// ---- Follow-ups ----

export async function findFollowupsByCustomer(customerId: number): Promise<CustomerFollowup[]> {
  const result = await pool.query(
    `SELECT cf.*, u.name AS created_by_name
     FROM customer_followups cf
     JOIN users u ON u.id = cf.created_by
     WHERE cf.customer_id = $1
     ORDER BY cf.created_at DESC`,
    [customerId]
  );
  return result.rows;
}

export async function createFollowup(
  customerId: number,
  note: string,
  followUpDate: string | null | undefined,
  createdBy: number
): Promise<CustomerFollowup> {
  const result = await pool.query(
    `INSERT INTO customer_followups (customer_id, note, follow_up_date, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [customerId, note, followUpDate || null, createdBy]
  );
  return result.rows[0];
}
