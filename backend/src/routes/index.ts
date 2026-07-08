import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import ingredientRoutes from './ingredient.routes';
import categoryRoutes from './category.routes';
import recipeRoutes from './recipe.routes';
import detectionRoutes from './detection.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API is healthy', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/ingredients', ingredientRoutes);
router.use('/categories', categoryRoutes);
router.use('/recipes', recipeRoutes);
router.use('/detections', detectionRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
