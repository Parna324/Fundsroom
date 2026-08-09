import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/product.service';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '../validations/schemas';
import { sendSuccess, AppError } from '../utils/response';

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const query = productQuerySchema.parse(req.query);
    const { data, total } = await productService.getProducts(query);
    sendSuccess(res, data, 200, {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    });
  } catch (err) { next(err); }
}

export async function getProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new AppError('Invalid product ID', 400);
    const product = await productService.getProductById(id);
    sendSuccess(res, product);
  } catch (err) { next(err); }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await productService.createProduct(data);
    sendSuccess(res, product, 201);
  } catch (err) { next(err); }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new AppError('Invalid product ID', 400);
    const data = updateProductSchema.parse(req.body);
    const product = await productService.updateProduct(id, data);
    sendSuccess(res, product);
  } catch (err) { next(err); }
}

export async function getInventory(req: Request, res: Response, next: NextFunction) {
  try {
    const query = productQuerySchema.parse(req.query);
    const [products, stats, categories] = await Promise.all([
      productService.getProducts(query),
      productService.getInventoryStats(),
      productService.getProductCategories(),
    ]);
    sendSuccess(res, {
      products: products.data,
      stats,
      categories,
      total: products.total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(products.total / query.limit),
    });
  } catch (err) { next(err); }
}

export async function getStockMovements(req: Request, res: Response, next: NextFunction) {
  try {
    const productId = parseInt(req.params.productId, 10);
    if (isNaN(productId)) throw new AppError('Invalid product ID', 400);
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const result = await productService.getStockMovements(productId, page, limit);
    sendSuccess(res, result.data, 200, {
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (err) { next(err); }
}

export async function getRecentMovements(req: Request, res: Response, next: NextFunction) {
  try {
    const movements = await productService.getAllRecentMovements();
    sendSuccess(res, movements);
  } catch (err) { next(err); }
}

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await productService.getProductCategories();
    sendSuccess(res, categories);
  } catch (err) { next(err); }
}

export async function getLowStock(req: Request, res: Response, next: NextFunction) {
  try {
    const products = await productService.getLowStockProducts();
    sendSuccess(res, products);
  } catch (err) { next(err); }
}
