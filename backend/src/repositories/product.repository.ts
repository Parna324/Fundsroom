import pool from '../config/db';
import { Product, StockMovement } from '../types';
import { z } from 'zod';
import { createProductSchema, productQuerySchema } from '../validations/schemas';

type CreateProductData = z.infer<typeof createProductSchema>;

export async function findProducts(
  query: z.infer<typeof productQuerySchema>
): Promise<{ data: Product[]; total: number }> {
  const { page, limit, search, category, lowStock } = query;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (search) {
    conditions.push(`(name ILIKE $${idx} OR sku ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  if (category) {
    conditions.push(`category = $${idx}`);
    params.push(category);
    idx++;
  }
  if (lowStock) {
    conditions.push(`current_stock <= minimum_stock`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [dataResult, countResult] = await Promise.all([
    pool.query(
      `SELECT * FROM products ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT COUNT(*) FROM products ${where}`, params),
  ]);

  return {
    data: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function findProductById(id: number): Promise<Product | null> {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function findProductBySku(sku: string): Promise<Product | null> {
  const result = await pool.query('SELECT * FROM products WHERE sku = $1', [sku.toUpperCase()]);
  return result.rows[0] || null;
}

export async function createProduct(data: CreateProductData): Promise<Product> {
  const {
    name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location,
  } = data;

  const result = await pool.query(
    `INSERT INTO products (name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name, sku.toUpperCase(), category, unit_price, current_stock ?? 0, minimum_stock ?? 0, warehouse_location || null]
  );
  return result.rows[0];
}

export async function updateProduct(id: number, data: Partial<CreateProductData>): Promise<Product | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const allowed: (keyof CreateProductData)[] = [
    'name', 'sku', 'category', 'unit_price', 'current_stock', 'minimum_stock', 'warehouse_location',
  ];

  for (const key of allowed) {
    if (key in data) {
      const val = data[key];
      fields.push(`${key} = $${idx}`);
      values.push(key === 'sku' && typeof val === 'string' ? val.toUpperCase() : val);
      idx++;
    }
  }

  if (fields.length === 0) return findProductById(id);

  values.push(id);
  const result = await pool.query(
    `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

// ---- Inventory Stats ----
export async function getInventoryStats(): Promise<{
  totalProducts: number;
  totalStockUnits: number;
  lowStockCount: number;
}> {
  const result = await pool.query(`
    SELECT
      COUNT(*) AS total_products,
      COALESCE(SUM(current_stock), 0) AS total_stock_units,
      COUNT(*) FILTER (WHERE current_stock <= minimum_stock) AS low_stock_count
    FROM products
  `);

  const row = result.rows[0];
  return {
    totalProducts: parseInt(row.total_products, 10),
    totalStockUnits: parseInt(row.total_stock_units, 10),
    lowStockCount: parseInt(row.low_stock_count, 10),
  };
}

export async function getLowStockProducts(limit = 10): Promise<Product[]> {
  const result = await pool.query(
    `SELECT * FROM products WHERE current_stock <= minimum_stock ORDER BY current_stock ASC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function getProductCategories(): Promise<string[]> {
  const result = await pool.query(
    'SELECT DISTINCT category FROM products ORDER BY category'
  );
  return result.rows.map((r: { category: string }) => r.category);
}

// ---- Stock Movements ----
export async function findStockMovementsByProduct(
  productId: number,
  page: number = 1,
  limit: number = 20
): Promise<{ data: StockMovement[]; total: number }> {
  const offset = (page - 1) * limit;
  const [dataResult, countResult] = await Promise.all([
    pool.query(
      `SELECT sm.*, p.name AS product_name, p.sku, u.name AS created_by_name
       FROM stock_movements sm
       JOIN products p ON p.id = sm.product_id
       JOIN users u ON u.id = sm.created_by
       WHERE sm.product_id = $1
       ORDER BY sm.created_at DESC
       LIMIT $2 OFFSET $3`,
      [productId, limit, offset]
    ),
    pool.query('SELECT COUNT(*) FROM stock_movements WHERE product_id = $1', [productId]),
  ]);

  return {
    data: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function findRecentStockMovements(limit = 10): Promise<StockMovement[]> {
  const result = await pool.query(
    `SELECT sm.*, p.name AS product_name, p.sku, u.name AS created_by_name
     FROM stock_movements sm
     JOIN products p ON p.id = sm.product_id
     JOIN users u ON u.id = sm.created_by
     ORDER BY sm.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}
