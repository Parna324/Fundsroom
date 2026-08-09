import * as customerRepo from '../repositories/customer.repository';
import { AppError } from '../utils/response';
import { z } from 'zod';
import { createCustomerSchema, customerQuerySchema, createFollowupSchema } from '../validations/schemas';

export async function getCustomers(query: z.infer<typeof customerQuerySchema>) {
  return customerRepo.findCustomers(query);
}

export async function getCustomerById(id: number) {
  const customer = await customerRepo.findCustomerById(id);
  if (!customer) {
    throw new AppError(`Customer with ID ${id} not found`, 404);
  }
  return customer;
}

export async function createCustomer(data: z.infer<typeof createCustomerSchema>) {
  return customerRepo.createCustomer(data);
}

export async function updateCustomer(id: number, data: Partial<z.infer<typeof createCustomerSchema>>) {
  await getCustomerById(id); // throws 404 if not found
  const updated = await customerRepo.updateCustomer(id, data);
  if (!updated) throw new AppError('Failed to update customer', 500);
  return updated;
}

export async function deleteCustomer(id: number) {
  await getCustomerById(id); // throws 404 if not found
  const deleted = await customerRepo.deleteCustomer(id);
  if (!deleted) throw new AppError('Failed to delete customer', 500);
}

export async function getFollowups(customerId: number) {
  await getCustomerById(customerId); // throws 404 if not found
  return customerRepo.findFollowupsByCustomer(customerId);
}

export async function addFollowup(
  customerId: number,
  data: z.infer<typeof createFollowupSchema>,
  createdBy: number
) {
  await getCustomerById(customerId); // throws 404 if not found
  return customerRepo.createFollowup(customerId, data.note, data.follow_up_date, createdBy);
}
