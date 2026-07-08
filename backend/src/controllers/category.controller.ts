import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const CategoryController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const result = await CategoryService.list();
    return sendSuccess(res, result, 'Categories list');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const result = await CategoryService.getById(Number(req.params.id));
    return sendSuccess(res, result, 'Category detail');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const result = await CategoryService.create(req.body);
    return sendSuccess(res, result, 'Category created', 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const result = await CategoryService.update(Number(req.params.id), req.body);
    return sendSuccess(res, result, 'Category updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const result = await CategoryService.remove(Number(req.params.id));
    return sendSuccess(res, result, 'Category deleted');
  }),
};
