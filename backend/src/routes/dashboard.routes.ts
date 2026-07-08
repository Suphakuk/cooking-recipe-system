import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/stats', authenticate, authorize('ADMIN'), DashboardController.stats);

export default router;
