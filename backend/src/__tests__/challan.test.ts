import request from 'supertest';
import app from '../app';
import pool, { closePool } from '../config/db';
import bcrypt from 'bcrypt';

// ──────────────────────────────────────────────────────────────
// Test helpers / setup
// ──────────────────────────────────────────────────────────────

let adminToken: string;
let salesToken: string;
let warehouseToken: string;
let accountsToken: string;

let testCustomerId: number;
let testProductId: number;
let testChallanId: number;

beforeAll(async () => {
  // Create test users
  const hash = await bcrypt.hash('Test@1234', 10);
  await pool.query(`
    INSERT INTO users (name, email, password_hash, role) VALUES
      ('Test Admin',    'test_admin@test.com',     $1, 'ADMIN'),
      ('Test Sales',    'test_sales@test.com',     $1, 'SALES'),
      ('Test Warehouse','test_warehouse@test.com', $1, 'WAREHOUSE'),
      ('Test Accounts', 'test_accounts@test.com',  $1, 'ACCOUNTS')
    ON CONFLICT (email) DO NOTHING
  `, [hash]);

  // Get tokens
  const [adminRes, salesRes, warehouseRes, accountsRes] = await Promise.all([
    request(app).post('/api/auth/login').send({ email: 'test_admin@test.com', password: 'Test@1234' }),
    request(app).post('/api/auth/login').send({ email: 'test_sales@test.com', password: 'Test@1234' }),
    request(app).post('/api/auth/login').send({ email: 'test_warehouse@test.com', password: 'Test@1234' }),
    request(app).post('/api/auth/login').send({ email: 'test_accounts@test.com', password: 'Test@1234' }),
  ]);

  adminToken = adminRes.body.data.token;
  salesToken = salesRes.body.data.token;
  warehouseToken = warehouseRes.body.data.token;
  accountsToken = accountsRes.body.data.token;
});

afterAll(async () => {
  // Cleanup test data in dependency-safe order
  await pool.query(`
    DELETE FROM challan_items;
    DELETE FROM challans;
    DELETE FROM stock_movements;
    DELETE FROM customer_followups;
    DELETE FROM customers;
    DELETE FROM products;
    DELETE FROM users WHERE email IN (
      'test_admin@test.com','test_sales@test.com',
      'test_warehouse@test.com','test_accounts@test.com'
    )
  `);
  await closePool();
});

// ──────────────────────────────────────────────────────────────
// 1. Auth Tests
// ──────────────────────────────────────────────────────────────

describe('Authentication', () => {
  test('1. Login works with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test_admin@test.com', password: 'Test@1234' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('test_admin@test.com');
    expect(res.body.data.user.password_hash).toBeUndefined();
  });

  test('2. Invalid login fails (wrong password)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test_admin@test.com', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('2b. Invalid login fails (non-existent user)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@nowhere.com', password: 'Test@1234' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('3. Protected API rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('3b. /api/auth/me returns user for valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('test_admin@test.com');
  });
});

// ──────────────────────────────────────────────────────────────
// 4. Role Restriction Tests
// ──────────────────────────────────────────────────────────────

describe('Role-based access control', () => {
  test('4. WAREHOUSE role cannot create customer (403)', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        name: 'Test Customer',
        mobile: '9876543210',
        customer_type: 'RETAIL',
        status: 'LEAD',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('4b. ACCOUNTS role cannot create product (403)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${accountsToken}`)
      .send({
        name: 'Test Product',
        sku: 'TEST-SKU-001',
        category: 'Test',
        unit_price: 100,
      });

    expect(res.status).toBe(403);
  });

  test('4c. ACCOUNTS can read customers', async () => {
    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${accountsToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// 5. Customer CRUD
// ──────────────────────────────────────────────────────────────

describe('Customer management', () => {
  test('5. Customer creation works', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        name: 'Jest Test Customer',
        mobile: '9000000001',
        email: 'jestcustomer@test.com',
        business_name: 'Jest Corp',
        customer_type: 'WHOLESALE',
        status: 'LEAD',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Jest Test Customer');
    expect(res.body.data.id).toBeDefined();
    testCustomerId = res.body.data.id;
  });

  test('5b. Customer list returns paginated data', async () => {
    const res = await request(app)
      .get('/api/customers?page=1&limit=5')
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBeDefined();
  });

  test('5c. Customer search works', async () => {
    const res = await request(app)
      .get('/api/customers?search=Jest')
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('5d. Customer validation fails for invalid mobile', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        name: 'Bad Customer',
        mobile: '12345',  // invalid
        customer_type: 'RETAIL',
        status: 'LEAD',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────
// 6. Product CRUD
// ──────────────────────────────────────────────────────────────

describe('Product management', () => {
  test('6. Product creation works', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        name: 'Jest Test Product',
        sku: 'JEST-PROD-001',
        category: 'Test',
        unit_price: 999.99,
        current_stock: 50,
        minimum_stock: 10,
        warehouse_location: 'TEST-01',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sku).toBe('JEST-PROD-001');
    testProductId = res.body.data.id;
  });

  test('6b. Duplicate SKU is rejected', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        name: 'Duplicate SKU Product',
        sku: 'JEST-PROD-001', // same SKU
        category: 'Test',
        unit_price: 500,
        current_stock: 10,
        minimum_stock: 2,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('6c. Negative price is rejected', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        name: 'Negative Price',
        sku: 'JEST-NEG-001',
        category: 'Test',
        unit_price: -100,
        current_stock: 0,
        minimum_stock: 0,
      });

    expect(res.status).toBe(400);
  });
});

// ──────────────────────────────────────────────────────────────
// 7-13. Challan Business Logic (the most critical tests)
// ──────────────────────────────────────────────────────────────

describe('Challan business logic', () => {
  let draftChallanId: number;

  test('7. Creating a DRAFT challan does NOT modify stock', async () => {
    // Get current stock
    const productBefore = await request(app)
      .get(`/api/products/${testProductId}`)
      .set('Authorization', `Bearer ${salesToken}`);
    const stockBefore = productBefore.body.data.current_stock;

    // Create draft challan
    const res = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomerId,
        items: [{ product_id: testProductId, quantity: 5 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('DRAFT');
    draftChallanId = res.body.data.id;
    testChallanId = draftChallanId;

    // Stock should be unchanged
    const productAfter = await request(app)
      .get(`/api/products/${testProductId}`)
      .set('Authorization', `Bearer ${salesToken}`);
    expect(productAfter.body.data.current_stock).toBe(stockBefore);
  });

  test('8. Confirming a challan reduces stock', async () => {
    // Create fresh challan
    const createRes = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomerId,
        items: [{ product_id: testProductId, quantity: 3 }],
      });
    const challanId = createRes.body.data.id;

    // Stock before
    const productBefore = await request(app)
      .get(`/api/products/${testProductId}`)
      .set('Authorization', `Bearer ${salesToken}`);
    const stockBefore = productBefore.body.data.current_stock;

    // Confirm
    const confirmRes = await request(app)
      .post(`/api/challans/${challanId}/confirm`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('CONFIRMED');

    // Stock after
    const productAfter = await request(app)
      .get(`/api/products/${testProductId}`)
      .set('Authorization', `Bearer ${salesToken}`);
    expect(productAfter.body.data.current_stock).toBe(stockBefore - 3);
  });

  test('9. Insufficient stock fails with 409', async () => {
    // Get current stock
    const productRes = await request(app)
      .get(`/api/products/${testProductId}`)
      .set('Authorization', `Bearer ${salesToken}`);
    const currentStock = productRes.body.data.current_stock;

    // Create challan requesting MORE than available
    const createRes = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomerId,
        items: [{ product_id: testProductId, quantity: currentStock + 100 }],
      });
    const challanId = createRes.body.data.id;

    // Attempt to confirm (should fail)
    const confirmRes = await request(app)
      .post(`/api/challans/${challanId}/confirm`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(confirmRes.status).toBe(409);
    expect(confirmRes.body.success).toBe(false);
    expect(confirmRes.body.message).toContain('Insufficient stock');
  });

  test('10. Stock never becomes negative', async () => {
    const productRes = await request(app)
      .get(`/api/products/${testProductId}`)
      .set('Authorization', `Bearer ${salesToken}`);
    const currentStock = productRes.body.data.current_stock;
    expect(currentStock).toBeGreaterThanOrEqual(0);
  });

  test('11. Stock movement is created after confirmation', async () => {
    // Create and confirm a challan
    const createRes = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomerId,
        items: [{ product_id: testProductId, quantity: 1 }],
      });
    const challanId = createRes.body.data.id;

    await request(app)
      .post(`/api/challans/${challanId}/confirm`)
      .set('Authorization', `Bearer ${salesToken}`);

    // Check stock movements
    const movementsRes = await request(app)
      .get(`/api/inventory/${testProductId}/movements`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(movementsRes.status).toBe(200);
    const outMovements = movementsRes.body.data.filter(
      (m: { movement_type: string }) => m.movement_type === 'OUT'
    );
    expect(outMovements.length).toBeGreaterThan(0);
  });

  test('12. Challan product snapshot is stored correctly', async () => {
    const challanRes = await request(app)
      .get(`/api/challans/${draftChallanId}`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(challanRes.status).toBe(200);
    expect(challanRes.body.data.items).toBeDefined();
    expect(challanRes.body.data.items.length).toBeGreaterThan(0);

    const item = challanRes.body.data.items[0];
    // Snapshot fields must be stored
    expect(item.product_name).toBe('Jest Test Product');
    expect(item.sku).toBe('JEST-PROD-001');
    expect(item.unit_price).toBeDefined();
    expect(item.quantity).toBe(5);
  });

  test('13. Cannot confirm an already confirmed challan', async () => {
    // Create & confirm
    const createRes = await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: testCustomerId,
        items: [{ product_id: testProductId, quantity: 1 }],
      });
    const challanId = createRes.body.data.id;

    await request(app)
      .post(`/api/challans/${challanId}/confirm`)
      .set('Authorization', `Bearer ${salesToken}`);

    // Try to confirm again
    const secondConfirm = await request(app)
      .post(`/api/challans/${challanId}/confirm`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(secondConfirm.status).toBe(409);
    expect(secondConfirm.body.success).toBe(false);
  });
});
