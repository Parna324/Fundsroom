import { Request, Response, NextFunction } from 'express';
import * as customerService from '../services/customer.service';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
  createFollowupSchema,
} from '../validations/schemas';
import { sendSuccess, AppError } from '../utils/response';

export async function listCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = customerQuerySchema.parse(req.query);
    const { data, total } = await customerService.getCustomers(query);
    sendSuccess(res, data, 200, {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    });
  } catch (err) { next(err); }
}

export async function getCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new AppError('Invalid customer ID', 400);
    const customer = await customerService.getCustomerById(id);
    sendSuccess(res, customer);
  } catch (err) { next(err); }
}

export async function createCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createCustomerSchema.parse(req.body);
    const customer = await customerService.createCustomer(data);
    sendSuccess(res, customer, 201);
  } catch (err) { next(err); }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new AppError('Invalid customer ID', 400);
    const data = updateCustomerSchema.parse(req.body);
    const customer = await customerService.updateCustomer(id, data);
    sendSuccess(res, customer);
  } catch (err) { next(err); }
}

export async function deleteCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new AppError('Invalid customer ID', 400);
    await customerService.deleteCustomer(id);
    sendSuccess(res, { message: 'Customer deleted successfully' });
  } catch (err) { next(err); }
}

export async function listFollowups(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (isNaN(customerId)) throw new AppError('Invalid customer ID', 400);
    const followups = await customerService.getFollowups(customerId);
    sendSuccess(res, followups);
  } catch (err) { next(err); }
}

export async function addFollowup(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (isNaN(customerId)) throw new AppError('Invalid customer ID', 400);
    if (!req.user) throw new AppError('Not authenticated', 401);
    const data = createFollowupSchema.parse(req.body);
    const followup = await customerService.addFollowup(customerId, data, req.user.userId);
    sendSuccess(res, followup, 201);
  } catch (err) { next(err); }
}
