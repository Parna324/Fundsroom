// All shared TypeScript types for the frontend

export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type MovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

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
  follow_up_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerFollowup {
  id: number;
  customer_id: number;
  note: string;
  follow_up_date?: string;
  created_by: number;
  created_at: string;
  created_by_name?: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  warehouse_location?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  quantity: number;
  movement_type: MovementType;
  reason?: string;
  created_by: number;
  created_at: string;
  product_name?: string;
  sku?: string;
  created_by_name?: string;
}

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
  created_at: string;
  updated_at: string;
  customer_name?: string;
  business_name?: string;
  created_by_name?: string;
  items?: ChallanItem[];
}

export interface InventoryStats {
  totalProducts: number;
  totalStockUnits: number;
  lowStockCount: number;
}

export interface DashboardData {
  kpis: {
    totalCustomers: number;
    totalProducts: number;
    totalStockUnits: number;
    lowStockCount: number;
    draftChallans: number;
    confirmedChallans: number;
  };
  lowStockProducts: Product[];
  recentChallans: Challan[];
  recentMovements: StockMovement[];
  upcomingFollowUps: Array<{
    id: number;
    name: string;
    business_name?: string;
    follow_up_date: string;
    status: CustomerStatus;
  }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}
