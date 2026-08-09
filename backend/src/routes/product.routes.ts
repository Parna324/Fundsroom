import { Router } from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  getInventory,
  getStockMovements,
  getRecentMovements,
  getCategories,
  getLowStock,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Products — WAREHOUSE + ADMIN can write; SALES can read
router.get('/',       authorize('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), listProducts);
router.post('/',      authorize('ADMIN', 'WAREHOUSE'), createProduct);
router.get('/categories', authorize('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), getCategories);
router.get('/low-stock',  authorize('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), getLowStock);
router.get('/:id',    authorize('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), getProduct);
router.put('/:id',    authorize('ADMIN', 'WAREHOUSE'), updateProduct);

export default router;
