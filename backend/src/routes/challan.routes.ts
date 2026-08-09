import { Router } from 'express';
import {
  listChallans,
  getChallan,
  createChallan,
  confirmChallan,
  cancelChallan,
} from '../controllers/challan.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// ACCOUNTS can read; SALES + ADMIN can write/confirm/cancel
router.get('/',    authorize('ADMIN', 'SALES', 'ACCOUNTS'), listChallans);
router.post('/',   authorize('ADMIN', 'SALES'), createChallan);
router.get('/:id', authorize('ADMIN', 'SALES', 'ACCOUNTS'), getChallan);
router.post('/:id/confirm', authorize('ADMIN', 'SALES'), confirmChallan);
router.post('/:id/cancel',  authorize('ADMIN', 'SALES'), cancelChallan);

export default router;
