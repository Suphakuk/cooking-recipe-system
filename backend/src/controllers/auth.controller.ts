import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const result = await AuthService.register(name, email, password);
    return sendSuccess(res, result, 'Registered successfully', 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    return sendSuccess(res, result, 'Logged in successfully');
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refresh(refreshToken);
    return sendSuccess(res, result, 'Token refreshed');
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw ApiError.badRequest('refreshToken is required');
    const result = await AuthService.logout(refreshToken);
    return sendSuccess(res, result, 'Logged out');
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.me(req.user!.sub);
    return sendSuccess(res, result, 'Current user');
  }),
};
