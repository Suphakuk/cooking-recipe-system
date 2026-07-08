import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const DashboardController = {
  stats: asyncHandler(async (_req: Request, res: Response) => {
    const result = await DashboardService.stats();
    return sendSuccess(res, result, 'Dashboard stats');
  }),
};
