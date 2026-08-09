import { Router } from 'express';
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  listFollowups,
  addFollowup,
} from '../controllers/customer.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Customer CRUD
// ACCOUNTS can read; SALES, ADMIN can write; WAREHOUSE has no access
router.get('/',    authorize('ADMIN', 'SALES', 'ACCOUNTS'), listCustomers);
router.post('/',   authorize('ADMIN', 'SALES'), createCustomer);
router.get('/:id', authorize('ADMIN', 'SALES', 'ACCOUNTS'), getCustomer);
router.put('/:id', authorize('ADMIN', 'SALES'), updateCustomer);
router.delete('/:id', authorize('ADMIN'), deleteCustomer);

// Follow-ups
router.get('/:id/followups',  authorize('ADMIN', 'SALES', 'ACCOUNTS'), listFollowups);
router.post('/:id/followups', authorize('ADMIN', 'SALES'), addFollowup);

export default router;
