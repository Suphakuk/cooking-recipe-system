import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createCategorySchema, updateCategorySchema } from '../utils/validators';

const router = Router();

router.get('/', CategoryController.list);
router.get('/:id', CategoryController.getById);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createCategorySchema),
  CategoryController.create
);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateCategorySchema),
  CategoryController.update
);
router.delete('/:id', authenticate, authorize('ADMIN'), CategoryController.remove);

export default router;
