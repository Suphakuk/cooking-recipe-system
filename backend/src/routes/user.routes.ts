import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  updateProfileSchema,
  changePasswordSchema,
  adminUpdateUserSchema,
} from '../utils/validators';

const router = Router();

// Current user profile
router.patch('/profile', authenticate, validate(updateProfileSchema), UserController.updateProfile);
router.patch(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  UserController.changePassword
);

// Admin only
router.get('/', authenticate, authorize('ADMIN'), UserController.list);
router.get('/:id', authenticate, authorize('ADMIN'), UserController.getById);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(adminUpdateUserSchema),
  UserController.adminUpdate
);
router.delete('/:id', authenticate, authorize('ADMIN'), UserController.remove);

export default router;
