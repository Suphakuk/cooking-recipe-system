import { Request, Response } from 'express';
import { DetectionService } from '../services/detection.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';

export const DetectionController = {
  detect: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('An image file is required (field name: "image")');
    const result = await DetectionService.detectFromUpload(req.user?.sub, req.file);
    return sendSuccess(res, result, 'Detection completed');
  }),

  history: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await DetectionService.history(
      req.user?.sub,
      req.query as Record<string, unknown>
    );
    return sendSuccess(res, items, 'Detection history', 200, meta);
  }),
};
