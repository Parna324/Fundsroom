// ============================================================
// Shared TypeScript types for the ERP backend
// ============================================================

export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type MovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

// ---------------------------------------------------------------
// Users
// ---------------------------------------------------------------
export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublic {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ---------------------------------------------------------------
// Customers
// ---------------------------------------------------------------
export interface Customer {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  business_name?: string;
  gst_number?: string;
  customer_type: CustomerType;
  address?: string;
  status: CustomerStatus;
  follow_up_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerFollowup {
  id: number;
  customer_id: number;
  note: string;
  follow_up_date?: Date;
  created_by: number;
  created_at: Date;
  // Joined fields
  created_by_name?: string;
}

// ---------------------------------------------------------------
// Products
// ---------------------------------------------------------------
export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  warehouse_location?: string;
  created_at: Date;
  updated_at: Date;
}

// ---------------------------------------------------------------
// Stock Movements
// ---------------------------------------------------------------
export interface StockMovement {
  id: number;
  product_id: number;
  quantity: number;
  movement_type: MovementType;
  reason?: string;
  created_by: number;
  created_at: Date;
  // Joined
  product_name?: string;
  sku?: string;
  created_by_name?: string;
}

// ---------------------------------------------------------------
// Challans
// ---------------------------------------------------------------
export interface ChallanItem {
  id: number;
  challan_id: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
}

export interface Challan {
  id: number;
  challan_number: string;
  customer_id: number;
  status: ChallanStatus;
  total_quantity: number;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  // Joined
  customer_name?: string;
  business_name?: string;
  created_by_name?: string;
  items?: ChallanItem[];
}

// ---------------------------------------------------------------
// API / Request types
// ---------------------------------------------------------------
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------------
// Express augmentation
// ---------------------------------------------------------------
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
