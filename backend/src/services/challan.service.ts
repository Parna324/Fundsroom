import { PoolClient } from 'pg';
import pool from '../config/db';
import * as challanRepo from '../repositories/challan.repository';
import * as productRepo from '../repositories/product.repository';
import { AppError } from '../utils/response';
import { findCustomerById } from '../repositories/customer.repository';
import { z } from 'zod';
import { createChallanSchema, challanQuerySchema } from '../validations/schemas';

export async function getChallans(query: z.infer<typeof challanQuerySchema>) {
  return challanRepo.findChallans(query);
}

export async function getChallanById(id: number) {
  const challan = await challanRepo.findChallanById(id);
  if (!challan) {
    throw new AppError(`Challan with ID ${id} not found`, 404);
  }
  return challan;
}

export async function createChallan(
  data: z.infer<typeof createChallanSchema>,
  createdBy: number
) {
  // Validate customer exists
  const customer = await findCustomerById(data.customer_id);
  if (!customer) {
    throw new AppError(`Customer with ID ${data.customer_id} not found`, 404);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Resolve product details for snapshot
    const resolvedItems: Array<{
      product_id: number;
      product_name: string;
      sku: string;
      unit_price: number;
      quantity: number;
    }> = [];

    for (const item of data.items) {
      const product = await productRepo.findProductById(item.product_id);
      if (!product) {
        throw new AppError(`Product with ID ${item.product_id} not found`, 404);
      }
      resolvedItems.push({
        product_id: product.id,
        product_name: product.name,    // snapshot
        sku: product.sku,              // snapshot
        unit_price: product.unit_price,// snapshot
        quantity: item.quantity,
      });
    }

    const challanNumber = await challanRepo.generateChallanNumber();

    const challan = await challanRepo.createChallanWithItems(
      client,
      challanNumber,
      data.customer_id,
      createdBy,
      resolvedItems
    );

    await client.query('COMMIT');
    return challan;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ============================================================
// CRITICAL BUSINESS LOGIC — Challan Confirmation
// ============================================================
// Rules:
// 1. Run in a DB transaction
// 2. Lock all relevant product rows (SELECT FOR UPDATE)
// 3. Check every product has sufficient stock
// 4. If ANY insufficient: rollback, return 409
// 5. If all OK: deduct stock, create OUT movements, confirm challan
// ============================================================
export async function confirmChallan(challanId: number, confirmedBy: number) {
  // Pre-check without lock (fast check)
  const challan = await challanRepo.findChallanById(challanId);
  if (!challan) throw new AppError(`Challan with ID ${challanId} not found`, 404);

  if (challan.status !== 'DRAFT') {
    throw new AppError(
      `Cannot confirm challan. Current status: ${challan.status}. Only DRAFT challans can be confirmed.`,
      409
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get challan items
    const items = await challanRepo.getChallanItems(client, challanId);

    if (items.length === 0) {
      throw new AppError('Challan has no items', 400);
    }

    // Lock product rows for update (prevents race conditions)
    const productMap = new Map<number, { id: number; name: string; current_stock: number; sku: string }>();

    for (const item of items) {
      const lockedProduct = await client.query<{
        id: number;
        name: string;
        current_stock: number;
        sku: string;
      }>(
        `SELECT id, name, sku, current_stock FROM products WHERE id = $1 FOR UPDATE`,
        [item.product_id]
      );

      const product = lockedProduct.rows[0];
      if (!product) {
        throw new AppError(`Product ID ${item.product_id} not found`, 404);
      }

      productMap.set(product.id, product);
    }

    // Validate stock for every item
    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        throw new AppError(`Product ID ${item.product_id} not found`, 404);
      }

      if (product.current_stock < item.quantity) {
        // Rollback handled by finally
        throw new AppError(
          `Insufficient stock for "${product.name}" (SKU: ${product.sku})`,
          409,
          [
            {
              product_id: product.id,
              product_name: product.name,
              sku: product.sku,
              available: product.current_stock,
              requested: item.quantity,
            },
          ]
        );
      }
    }

    // All stock OK — deduct and create movements
    for (const item of items) {
      // Deduct stock
      await client.query(
        `UPDATE products SET current_stock = current_stock - ${item.quantity}, updated_at = NOW() WHERE id = ${item.product_id}`
      );

      // Create OUT stock movement
      await client.query(
        `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
         VALUES ($1, $2, 'OUT', $3, $4)`,
        [
          item.product_id,
          item.quantity,
          `Sales Challan ${challan.challan_number}`,
          confirmedBy,
        ]
      );
    }

    // Update challan status to CONFIRMED
    await challanRepo.updateChallanStatus(client, challanId, 'CONFIRMED');

    await client.query('COMMIT');

    return challanRepo.findChallanById(challanId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function cancelChallan(challanId: number, _cancelledBy: number) {
  const challan = await challanRepo.findChallanById(challanId);
  if (!challan) throw new AppError(`Challan with ID ${challanId} not found`, 404);

  if (challan.status === 'CANCELLED') {
    throw new AppError('Challan is already cancelled', 409);
  }

  if (challan.status === 'CONFIRMED') {
    throw new AppError(
      'Cannot cancel a confirmed challan. Please contact admin.',
      409
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await challanRepo.updateChallanStatus(client, challanId, 'CANCELLED');
    await client.query('COMMIT');
    return challanRepo.findChallanById(challanId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getChallanStats() {
  return challanRepo.getChallanStats();
}

export async function getRecentChallans() {
  return challanRepo.getRecentChallans();
}
