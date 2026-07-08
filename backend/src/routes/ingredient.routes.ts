import { Router } from 'express';
import { IngredientController } from '../controllers/ingredient.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { upload } from '../middlewares/upload.middleware';
import { createIngredientSchema, updateIngredientSchema } from '../utils/validators';

const router = Router();

// Public reads
router.get('/', IngredientController.list);
router.get('/:id', IngredientController.getById);

// Admin writes (multipart: optional "image" file + fields)
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  upload.single('image'),
  validate(createIngredientSchema),
  IngredientController.create
);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  upload.single('image'),
  validate(updateIngredientSchema),
  IngredientController.update
);
router.delete('/:id', authenticate, authorize('ADMIN'), IngredientController.remove);

export default router;
