import * as productRepo from '../repositories/product.repository';
import { AppError } from '../utils/response';
import { z } from 'zod';
import { createProductSchema, productQuerySchema } from '../validations/schemas';

export async function getProducts(query: z.infer<typeof productQuerySchema>) {
  return productRepo.findProducts(query);
}

export async function getProductById(id: number) {
  const product = await productRepo.findProductById(id);
  if (!product) {
    throw new AppError(`Product with ID ${id} not found`, 404);
  }
  return product;
}

export async function createProduct(data: z.infer<typeof createProductSchema>) {
  // Check SKU uniqueness
  const existing = await productRepo.findProductBySku(data.sku);
  if (existing) {
    throw new AppError(`Product with SKU '${data.sku}' already exists`, 409);
  }
  return productRepo.createProduct(data);
}

export async function updateProduct(id: number, data: Partial<z.infer<typeof createProductSchema>>) {
  await getProductById(id); // throws 404 if not found

  // Check SKU uniqueness if being changed
  if (data.sku) {
    const existing = await productRepo.findProductBySku(data.sku);
    if (existing && existing.id !== id) {
      throw new AppError(`Product with SKU '${data.sku}' already exists`, 409);
    }
  }

  const updated = await productRepo.updateProduct(id, data);
  if (!updated) throw new AppError('Failed to update product', 500);
  return updated;
}

export async function getInventoryStats() {
  return productRepo.getInventoryStats();
}

export async function getLowStockProducts() {
  return productRepo.getLowStockProducts();
}

export async function getProductCategories() {
  return productRepo.getProductCategories();
}

export async function getStockMovements(
  productId: number,
  page: number = 1,
  limit: number = 20
) {
  await getProductById(productId); // throws 404 if not found
  return productRepo.findStockMovementsByProduct(productId, page, limit);
}

export async function getAllRecentMovements() {
  return productRepo.findRecentStockMovements(15);
}
