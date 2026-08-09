import { z } from 'zod';

// ============================================================
// Auth
// ============================================================
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ============================================================
// Customers
// ============================================================
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (10 digits starting with 6-9)'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  business_name: z.string().max(255).optional(),
  gst_number: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number')
    .optional()
    .or(z.literal('')),
  customer_type: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().max(1000).optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
  follow_up_date: z.string().optional().or(z.null()),
  notes: z.string().max(2000).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).optional(),
});

// ============================================================
// Follow-ups
// ============================================================
export const createFollowupSchema = z.object({
  note: z.string().min(1, 'Note is required').max(2000),
  follow_up_date: z.string().optional().or(z.null()),
});

// ============================================================
// Products
// ============================================================
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  sku: z.string().min(1, 'SKU is required').max(100).toUpperCase(),
  category: z.string().min(1, 'Category is required').max(100),
  unit_price: z.number().positive('Unit price must be positive'),
  current_stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  minimum_stock: z.number().int().min(0, 'Minimum stock cannot be negative').default(0),
  warehouse_location: z.string().max(255).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
});

// ============================================================
// Stock Movements
// ============================================================
export const createStockMovementSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive('Quantity must be positive'),
  movement_type: z.enum(['IN', 'OUT']),
  reason: z.string().max(500).optional(),
});

// ============================================================
// Challans
// ============================================================
export const challanItemSchema = z.object({
  product_id: z.number().int().positive('Product ID must be positive'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const createChallanSchema = z.object({
  customer_id: z.number().int().positive('Customer ID must be positive'),
  items: z
    .array(challanItemSchema)
    .min(1, 'At least one product is required')
    .refine(
      (items) => {
        const ids = items.map((i) => i.product_id);
        return ids.length === new Set(ids).size;
      },
      { message: 'Duplicate products in challan are not allowed' }
    ),
});

export const challanQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']).optional(),
  customer_id: z.coerce.number().int().positive().optional(),
});
