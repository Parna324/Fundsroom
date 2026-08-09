import { Router } from 'express';
import {
  getInventory,
  getStockMovements,
  getRecentMovements,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), getInventory);
router.get('/movements', authorize('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), getRecentMovements);
router.get('/:productId/movements', authorize('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), getStockMovements);

export default router;
