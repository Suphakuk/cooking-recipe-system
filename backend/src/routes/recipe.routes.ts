import { Router } from 'express';
import { RecipeController } from '../controllers/recipe.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { upload } from '../middlewares/upload.middleware';
import {
  createRecipeSchema,
  updateRecipeSchema,
  recommendSchema,
  createReviewSchema,
} from '../utils/validators';

const router = Router();

// Recommendation (ingredient-based). Public — no login needed to try.
router.post('/recommend', validate(recommendSchema), RecipeController.recommend);

// Favorites (must be before /:slug to avoid conflict)
router.get('/me/favorites', authenticate, RecipeController.listFavorites);

// Public reads
router.get('/', RecipeController.list);
// Fetch by numeric id (admin edit form) — declared before /:slug so "id" isn't
// mistaken for a slug.
router.get('/id/:id', authenticate, authorize('ADMIN'), RecipeController.getById);
router.get('/:slug', RecipeController.getBySlug);

// Admin writes
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  upload.single('image'),
  validate(createRecipeSchema),
  RecipeController.create
);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  upload.single('image'),
  validate(updateRecipeSchema),
  RecipeController.update
);
router.delete('/:id', authenticate, authorize('ADMIN'), RecipeController.remove);

// Authenticated user actions
router.post('/:id/favorite', authenticate, RecipeController.toggleFavorite);
router.post(
  '/:id/reviews',
  authenticate,
  validate(createReviewSchema),
  RecipeController.addReview
);

export default router;
