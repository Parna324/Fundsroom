import { PoolClient } from 'pg';
import pool from '../config/db';
import { Challan, ChallanItem } from '../types';
import { z } from 'zod';
import { challanQuerySchema } from '../validations/schemas';

let challanCounter = 0;

export async function generateChallanNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await pool.query(
    `SELECT COUNT(*) FROM challans WHERE challan_number LIKE $1`,
    [`CHN-${year}-%`]
  );
  const count = parseInt(result.rows[0].count, 10) + 1 + challanCounter++;
  return `CHN-${year}-${String(count).padStart(4, '0')}`;
}

export async function findChallans(
  query: z.infer<typeof challanQuerySchema>
): Promise<{ data: Challan[]; total: number }> {
  const { page, limit, status, customer_id } = query;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (status) {
    conditions.push(`ch.status = $${idx}`);
    params.push(status);
    idx++;
  }
  if (customer_id) {
    conditions.push(`ch.customer_id = $${idx}`);
    params.push(customer_id);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [dataResult, countResult] = await Promise.all([
    pool.query(
      `SELECT ch.*, c.name AS customer_name, c.business_name, u.name AS created_by_name
       FROM challans ch
       JOIN customers c ON c.id = ch.customer_id
       JOIN users u ON u.id = ch.created_by
       ${where}
       ORDER BY ch.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM challans ch ${where}`,
      params
    ),
  ]);

  return {
    data: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function findChallanById(id: number): Promise<Challan | null> {
  const challanResult = await pool.query(
    `SELECT ch.*, c.name AS customer_name, c.business_name, c.mobile, c.email,
            u.name AS created_by_name
     FROM challans ch
     JOIN customers c ON c.id = ch.customer_id
     JOIN users u ON u.id = ch.created_by
     WHERE ch.id = $1`,
    [id]
  );

  if (!challanResult.rows[0]) return null;

  const challan = challanResult.rows[0] as Challan;

  const itemsResult = await pool.query(
    `SELECT * FROM challan_items WHERE challan_id = $1 ORDER BY id`,
    [id]
  );

  challan.items = itemsResult.rows;
  return challan;
}

export async function createChallanWithItems(
  client: PoolClient,
  challanNumber: string,
  customerId: number,
  createdBy: number,
  items: Array<{
    product_id: number;
    product_name: string;
    sku: string;
    unit_price: number;
    quantity: number;
  }>
): Promise<Challan> {
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  const challanResult = await client.query(
    `INSERT INTO challans (challan_number, customer_id, status, total_quantity, created_by)
     VALUES ($1, $2, 'DRAFT', $3, $4) RETURNING *`,
    [challanNumber, customerId, totalQuantity, createdBy]
  );

  const challan = challanResult.rows[0] as Challan;

  for (const item of items) {
    await client.query(
      `INSERT INTO challan_items (challan_id, product_id, product_name, sku, unit_price, quantity)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [challan.id, item.product_id, item.product_name, item.sku, item.unit_price, item.quantity]
    );
  }

  return challan;
}

export async function updateChallanStatus(
  client: PoolClient,
  challanId: number,
  status: string
): Promise<void> {
  await client.query(
    `UPDATE challans SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, challanId]
  );
}

export async function getChallanItems(
  client: PoolClient,
  challanId: number
): Promise<ChallanItem[]> {
  const result = await client.query(
    `SELECT * FROM challan_items WHERE challan_id = $1`,
    [challanId]
  );
  return result.rows;
}

export async function getChallanStats(): Promise<{
  draft: number;
  confirmed: number;
  cancelled: number;
}> {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'DRAFT') AS draft,
      COUNT(*) FILTER (WHERE status = 'CONFIRMED') AS confirmed,
      COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled
    FROM challans
  `);
  const row = result.rows[0];
  return {
    draft: parseInt(row.draft, 10),
    confirmed: parseInt(row.confirmed, 10),
    cancelled: parseInt(row.cancelled, 10),
  };
}

export async function getRecentChallans(limit = 5): Promise<Challan[]> {
  const result = await pool.query(
    `SELECT ch.*, c.name AS customer_name, c.business_name, u.name AS created_by_name
     FROM challans ch
     JOIN customers c ON c.id = ch.customer_id
     JOIN users u ON u.id = ch.created_by
     ORDER BY ch.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}
