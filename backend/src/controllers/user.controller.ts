import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const UserController = {
  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const result = await UserService.updateProfile(req.user!.sub, req.body);
    return sendSuccess(res, result, 'Profile updated');
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const result = await UserService.changePassword(req.user!.sub, currentPassword, newPassword);
    return sendSuccess(res, result, 'Password changed');
  }),

  // Admin
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await UserService.list(req.query as Record<string, unknown>);
    return sendSuccess(res, items, 'Users list', 200, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const result = await UserService.getById(Number(req.params.id));
    return sendSuccess(res, result, 'User detail');
  }),

  adminUpdate: asyncHandler(async (req: Request, res: Response) => {
    const result = await UserService.adminUpdate(Number(req.params.id), req.body);
    return sendSuccess(res, result, 'User updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const result = await UserService.remove(Number(req.params.id));
    return sendSuccess(res, result, 'User deleted');
  }),
};
