import { Request, Response } from 'express';
import { IngredientService } from '../services/ingredient.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { fileToDataUrl } from '../middlewares/upload.middleware';

export const IngredientController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await IngredientService.list(req.query as Record<string, unknown>);
    return sendSuccess(res, items, 'Ingredients list', 200, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const result = await IngredientService.getById(Number(req.params.id));
    return sendSuccess(res, result, 'Ingredient detail');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = { ...req.body };
    if (req.file) data.imageUrl = fileToDataUrl(req.file);
    const result = await IngredientService.create(data);
    return sendSuccess(res, result, 'Ingredient created', 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = { ...req.body };
    if (req.file) data.imageUrl = fileToDataUrl(req.file);
    const result = await IngredientService.update(Number(req.params.id), data);
    return sendSuccess(res, result, 'Ingredient updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const result = await IngredientService.remove(Number(req.params.id));
    return sendSuccess(res, result, 'Ingredient deleted');
  }),
};
