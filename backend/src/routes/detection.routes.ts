import { Router } from 'express';
import { DetectionController } from '../controllers/detection.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// Upload an image (field name "image") -> mock detection -> ingredients
// authenticate is optional here; we attach user if present but allow guests.
router.post('/', authenticate, upload.single('image'), DetectionController.detect);
router.get('/history', authenticate, DetectionController.history);

export default router;
