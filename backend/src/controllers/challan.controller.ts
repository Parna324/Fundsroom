import { Request, Response, NextFunction } from 'express';
import * as challanService from '../services/challan.service';
import {
  createChallanSchema,
  challanQuerySchema,
} from '../validations/schemas';
import { sendSuccess, AppError } from '../utils/response';

export async function listChallans(req: Request, res: Response, next: NextFunction) {
  try {
    const query = challanQuerySchema.parse(req.query);
    const { data, total } = await challanService.getChallans(query);
    sendSuccess(res, data, 200, {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    });
  } catch (err) { next(err); }
}

export async function getChallan(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new AppError('Invalid challan ID', 400);
    const challan = await challanService.getChallanById(id);
    sendSuccess(res, challan);
  } catch (err) { next(err); }
}

export async function createChallan(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const data = createChallanSchema.parse(req.body);
    const challan = await challanService.createChallan(data, req.user.userId);
    sendSuccess(res, challan, 201);
  } catch (err) { next(err); }
}

export async function confirmChallan(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new AppError('Invalid challan ID', 400);
    const challan = await challanService.confirmChallan(id, req.user.userId);
    sendSuccess(res, challan);
  } catch (err) { next(err); }
}

export async function cancelChallan(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new AppError('Invalid challan ID', 400);
    const challan = await challanService.cancelChallan(id, req.user.userId);
    sendSuccess(res, challan);
  } catch (err) { next(err); }
}
