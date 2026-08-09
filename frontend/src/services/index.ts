import api from './api';
import { User, Customer, CustomerFollowup, Product, StockMovement, Challan, DashboardData } from '../types';

// ── Auth ──────────────────────────────────────────────────────
export const authService = {
  login: (email: string, password: string) =>
    api.post<{ success: boolean; data: { user: User; token: string } }>('/auth/login', { email, password }),

  me: () =>
    api.get<{ success: boolean; data: User }>('/auth/me'),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardService = {
  get: () =>
    api.get<{ success: boolean; data: DashboardData }>('/dashboard'),
};

// ── Customers ─────────────────────────────────────────────────
export const customerService = {
  list: (params?: Record<string, unknown>) =>
    api.get('/customers', { params }),

  get: (id: number) =>
    api.get<{ success: boolean; data: Customer }>(`/customers/${id}`),

  create: (data: Partial<Customer>) =>
    api.post<{ success: boolean; data: Customer }>('/customers', data),

  update: (id: number, data: Partial<Customer>) =>
    api.put<{ success: boolean; data: Customer }>(`/customers/${id}`, data),

  delete: (id: number) =>
    api.delete(`/customers/${id}`),

  listFollowups: (customerId: number) =>
    api.get<{ success: boolean; data: CustomerFollowup[] }>(`/customers/${customerId}/followups`),

  addFollowup: (customerId: number, data: { note: string; follow_up_date?: string }) =>
    api.post<{ success: boolean; data: CustomerFollowup }>(`/customers/${customerId}/followups`, data),
};

// ── Products ──────────────────────────────────────────────────
export const productService = {
  list: (params?: Record<string, unknown>) =>
    api.get('/products', { params }),

  get: (id: number) =>
    api.get<{ success: boolean; data: Product }>(`/products/${id}`),

  create: (data: Partial<Product>) =>
    api.post<{ success: boolean; data: Product }>('/products', data),

  update: (id: number, data: Partial<Product>) =>
    api.put<{ success: boolean; data: Product }>(`/products/${id}`, data),

  getCategories: () =>
    api.get<{ success: boolean; data: string[] }>('/products/categories'),

  getLowStock: () =>
    api.get<{ success: boolean; data: Product[] }>('/products/low-stock'),
};

// ── Inventory ─────────────────────────────────────────────────
export const inventoryService = {
  get: (params?: Record<string, unknown>) =>
    api.get('/inventory', { params }),

  getMovements: (productId: number, params?: Record<string, unknown>) =>
    api.get<{ success: boolean; data: StockMovement[] }>(`/inventory/${productId}/movements`, { params }),

  getAllMovements: () =>
    api.get<{ success: boolean; data: StockMovement[] }>('/inventory/movements'),
};

// ── Challans ──────────────────────────────────────────────────
export const challanService = {
  list: (params?: Record<string, unknown>) =>
    api.get('/challans', { params }),

  get: (id: number) =>
    api.get<{ success: boolean; data: Challan }>(`/challans/${id}`),

  create: (data: { customer_id: number; items: Array<{ product_id: number; quantity: number }> }) =>
    api.post<{ success: boolean; data: Challan }>('/challans', data),

  confirm: (id: number) =>
    api.post<{ success: boolean; data: Challan }>(`/challans/${id}/confirm`),

  cancel: (id: number) =>
    api.post<{ success: boolean; data: Challan }>(`/challans/${id}/cancel`),
};
