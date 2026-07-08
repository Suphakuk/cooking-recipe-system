import { Request, Response } from 'express';
import { RecipeService } from '../services/recipe.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { fileToDataUrl } from '../middlewares/upload.middleware';

export const RecipeController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await RecipeService.list(req.query as Record<string, unknown>);
    return sendSuccess(res, items, 'Recipes list', 200, meta);
  }),

  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    const result = await RecipeService.getBySlug(req.params.slug);
    return sendSuccess(res, result, 'Recipe detail');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const result = await RecipeService.getById(Number(req.params.id));
    return sendSuccess(res, result, 'Recipe detail');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = { ...req.body };
    if (req.file) data.imageUrl = fileToDataUrl(req.file);
    const result = await RecipeService.create(req.user!.sub, data);
    return sendSuccess(res, result, 'Recipe created', 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = { ...req.body };
    if (req.file) data.imageUrl = fileToDataUrl(req.file);
    const result = await RecipeService.update(Number(req.params.id), data);
    return sendSuccess(res, result, 'Recipe updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const result = await RecipeService.remove(Number(req.params.id));
    return sendSuccess(res, result, 'Recipe deleted');
  }),

  recommend: asyncHandler(async (req: Request, res: Response) => {
    const { ingredientIds, matchMode, limit } = req.body;
    const result = await RecipeService.recommend(ingredientIds, matchMode, limit);
    return sendSuccess(res, result, 'Recommended recipes');
  }),

  // Favorites
  toggleFavorite: asyncHandler(async (req: Request, res: Response) => {
    const result = await RecipeService.toggleFavorite(req.user!.sub, Number(req.params.id));
    return sendSuccess(res, result, 'Favorite toggled');
  }),

  listFavorites: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await RecipeService.listFavorites(
      req.user!.sub,
      req.query as Record<string, unknown>
    );
    return sendSuccess(res, items, 'Favorites list', 200, meta);
  }),

  // Reviews
  addReview: asyncHandler(async (req: Request, res: Response) => {
    const { rating, comment } = req.body;
    const result = await RecipeService.addReview(
      req.user!.sub,
      Number(req.params.id),
      rating,
      comment
    );
    return sendSuccess(res, result, 'Review saved', 201);
  }),
};
