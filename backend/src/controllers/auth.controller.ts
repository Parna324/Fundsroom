import { Request, Response, NextFunction } from 'express';
import { loginService } from '../services/auth.service';
import { findUserById } from '../repositories/user.repository';
import { loginSchema } from '../validations/schemas';
import { sendSuccess, AppError } from '../utils/response';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginService(data.email, data.password);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const user = await findUserById(req.user.userId);
    if (!user) throw new AppError('User not found', 404);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}
