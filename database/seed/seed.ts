import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function seed() {
  const client = await pool.connect();
  console.log('🌱 Starting database seed...');

  try {
    await client.query('BEGIN');

    // --- Truncate all tables (cascade) ---
    await client.query(`
      TRUNCATE TABLE challan_items, challans, stock_movements, products,
                     customer_followups, customers, users RESTART IDENTITY CASCADE
    `);
    console.log('✅ Cleared existing data');

    // --- USERS ---
    const passwordHash = await hashPassword('Test@1234');
    const usersResult = await client.query(`
      INSERT INTO users (name, email, password_hash, role) VALUES
        ('Admin User',      'admin@test.com',     $1, 'ADMIN'),
        ('Sales Manager',   'sales@test.com',     $1, 'SALES'),
        ('Warehouse Staff', 'warehouse@test.com', $1, 'WAREHOUSE'),
        ('Accounts Team',   'accounts@test.com',  $1, 'ACCOUNTS')
      RETURNING id
    `, [passwordHash]);
    const [adminId, salesId, warehouseId] = usersResult.rows.map((r: { id: number }) => r.id);
    console.log('✅ Users seeded');

    // --- CUSTOMERS ---
    const customersResult = await client.query(`
      INSERT INTO customers (name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes) VALUES
        ('Rahul Sharma',   '9876543210', 'rahul@abctraders.com',    'ABC Traders',         '27AABCU9603R1ZX', 'WHOLESALE',   '12, MG Road, Mumbai, Maharashtra 400001',       'ACTIVE',   '2026-08-15', 'Key wholesale client, prefers bulk orders'),
        ('Priya Mehta',    '9123456789', 'priya@pqrdist.com',       'PQR Distributors',    '29AAACR5055K1Z5', 'DISTRIBUTOR', '45, Brigade Road, Bangalore, Karnataka 560001', 'ACTIVE',   '2026-08-12', 'Distributor for South India region'),
        ('Amit Kumar',     '8765432109', 'amit@xyzstore.com',       'XYZ Retail Store',    NULL,              'RETAIL',      '8, Connaught Place, Delhi 110001',               'LEAD',     '2026-08-10', 'Interested in electronics category'),
        ('Sneha Patel',    '7654321098', 'sneha@modernmart.com',    'Modern Mart',         '24AAACP1234A1Z6', 'RETAIL',      '23, CG Road, Ahmedabad, Gujarat 380009',        'ACTIVE',   '2026-08-20', 'Repeat customer, excellent payment history'),
        ('Vikram Singh',   '6543210987', 'vikram@vstrading.com',    'VS Trading Co.',      '08AABCV5678B1Z1', 'WHOLESALE',   '67, Station Road, Jaipur, Rajasthan 302001',    'ACTIVE',   '2026-08-18', 'Wholesale electronics and accessories'),
        ('Deepa Nair',     '9087654321', 'deepa@keraladist.com',    'Kerala Distributors', '32AADCD1234C1ZP', 'DISTRIBUTOR', '12, MG Road, Kochi, Kerala 682001',             'LEAD',     '2026-08-08', 'New contact, follow up on pricing'),
        ('Suresh Yadav',   '8901234567', 'suresh@sselectronics.com','SS Electronics',      '09AABCS5432D1Z8', 'WHOLESALE',   '34, Hazratganj, Lucknow, Uttar Pradesh 226001', 'INACTIVE', NULL,         'Account dormant since 3 months'),
        ('Anita Joshi',    '7890123456', 'anita@anita.com',         'Anita Enterprises',   NULL,              'RETAIL',      '5, FC Road, Pune, Maharashtra 411004',           'LEAD',     '2026-08-25', 'Interested in office supplies category')
      RETURNING id
    `);
    const customerIds = customersResult.rows.map((r: { id: number }) => r.id);
    console.log('✅ Customers seeded');

    // --- CUSTOMER FOLLOW-UPS ---
    await client.query(`
      INSERT INTO customer_followups (customer_id, note, follow_up_date, created_by) VALUES
        ($1, 'Called regarding Q3 bulk order requirements. They need 50 units of laptops.', '2026-08-01', $5),
        ($1, 'Sent product catalog via email. Awaiting decision.',                           '2026-08-05', $5),
        ($1, 'Agreed on bulk discount for orders above 100 units.',                         '2026-08-07', $5),
        ($2, 'Initial meeting with Priya. Discussed distribution margins.',                  '2026-07-28', $5),
        ($2, 'Provided south India territory pricing structure.',                            '2026-08-02', $5),
        ($3, 'Cold call — Amit expressed interest in mobile accessories.',                   '2026-08-03', $5),
        ($4, 'Regular monthly order placed successfully.',                                   '2026-07-30', $5),
        ($5, 'Negotiated quarterly contract for electronics accessories.',                   '2026-08-04', $5),
        ($6, 'First contact. Shared company profile.',                                      '2026-08-06', $5)
    `, [customerIds[0], customerIds[1], customerIds[2], customerIds[3], salesId]);
    console.log('✅ Follow-ups seeded');

    // --- PRODUCTS ---
    const productsResult = await client.query(`
      INSERT INTO products (name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location) VALUES
        ('HP Laptop 15s',             'LAP-HP-001',  'Electronics',  45000.00,  25,  5, 'A-01-01'),
        ('Dell Laptop Inspiron 14',   'LAP-DEL-002', 'Electronics',  52000.00,  18,  5, 'A-01-02'),
        ('Samsung 24" Monitor',       'MON-SAM-001', 'Electronics',  18000.00,  12,  3, 'A-02-01'),
        ('Lenovo ThinkPad E14',       'LAP-LEN-003', 'Electronics',  68000.00,   3,  5, 'A-01-03'),
        ('Apple MacBook Air M2',      'LAP-APL-004', 'Electronics', 115000.00,   2,  3, 'A-01-04'),
        ('Logitech Wireless Mouse',   'MOU-LOG-001', 'Peripherals',    899.00, 150, 20, 'B-01-01'),
        ('Dell Wired Keyboard',       'KEY-DEL-001', 'Peripherals',    699.00, 200, 30, 'B-01-02'),
        ('Sony WH-1000XM5 Headphones','HEAD-SON-001','Peripherals',  24990.00,   8,  3, 'B-02-01'),
        ('HP Wireless Keyboard+Mouse','KBM-HP-001',  'Peripherals',   1299.00,  75, 15, 'B-01-03'),
        ('Anker USB-C Hub 7-in-1',    'HUB-ANK-001', 'Peripherals',   2499.00,  40, 10, 'B-03-01'),
        ('TP-Link WiFi Router AC1200','RTR-TPL-001', 'Networking',    1999.00,  45, 10, 'C-01-01'),
        ('Netgear 8-Port Switch',     'SWT-NET-001', 'Networking',    3499.00,  20,  5, 'C-01-02'),
        ('D-Link Range Extender',     'EXT-DLK-001', 'Networking',    1299.00,  30,  8, 'C-01-03'),
        ('WD 1TB External HDD',       'HDD-WD-001',  'Storage',       4299.00,  35,  8, 'D-01-01'),
        ('Samsung 500GB SSD',         'SSD-SAM-001', 'Storage',       5499.00,   4,  5, 'D-01-02')
      RETURNING id
    `);
    const productIds = productsResult.rows.map((r: { id: number }) => r.id);
    console.log('✅ Products seeded');

    // --- STOCK MOVEMENTS (IN) ---
    const inMovements = [
      [productIds[0],  30, 'IN', 'Initial stock purchase from HP distributor'],
      [productIds[1],  20, 'IN', 'Initial stock purchase from Dell distributor'],
      [productIds[2],  15, 'IN', 'Purchase Order PO-2026-001 from Samsung'],
      [productIds[3],  10, 'IN', 'Initial stock — Lenovo ThinkPad consignment'],
      [productIds[4],   5, 'IN', 'Initial stock — Apple premium consignment'],
      [productIds[5], 200, 'IN', 'Bulk purchase — Logitech peripherals'],
      [productIds[6], 250, 'IN', 'Bulk purchase — Dell keyboards'],
      [productIds[7],  10, 'IN', 'Premium audio — Sony headphones'],
      [productIds[8], 100, 'IN', 'HP accessories bulk purchase'],
      [productIds[9],  50, 'IN', 'Anker hubs — tech accessories purchase'],
      [productIds[10], 50, 'IN', 'Networking equipment — TP-Link batch'],
      [productIds[11], 25, 'IN', 'Netgear switches — network department order'],
      [productIds[12], 40, 'IN', 'D-Link extenders batch'],
      [productIds[13], 40, 'IN', 'WD external storage — storage category replenishment'],
      [productIds[14], 10, 'IN', 'Samsung SSD initial stock'],
    ];

    for (const [pid, qty, mtype, reason] of inMovements) {
      await client.query(
        `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by) VALUES ($1, $2, $3, $4, $5)`,
        [pid, qty, mtype, reason, warehouseId]
      );
    }

    // OUT movements for confirmed challans
    const outMovements = [
      [productIds[0],  5, 'OUT', 'Sales Challan CHN-2026-0001', salesId],
      [productIds[5], 50, 'OUT', 'Sales Challan CHN-2026-0001', salesId],
      [productIds[6], 50, 'OUT', 'Sales Challan CHN-2026-0002', salesId],
      [productIds[3],  7, 'OUT', 'Sales Challan CHN-2026-0002', salesId],
      [productIds[14], 6, 'OUT', 'Sales Challan CHN-2026-0003', salesId],
    ];

    for (const [pid, qty, mtype, reason, userId] of outMovements) {
      await client.query(
        `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by) VALUES ($1, $2, $3, $4, $5)`,
        [pid, qty, mtype, reason, userId]
      );
    }
    console.log('✅ Stock movements seeded');

    // --- CHALLANS ---
    const challansResult = await client.query(`
      INSERT INTO challans (challan_number, customer_id, status, total_quantity, created_by) VALUES
        ('CHN-2026-0001', $1, 'CONFIRMED', 55, $5),
        ('CHN-2026-0002', $2, 'CONFIRMED', 57, $5),
        ('CHN-2026-0003', $4, 'CONFIRMED',  6, $5),
        ('CHN-2026-0004', $3, 'DRAFT',     15, $5),
        ('CHN-2026-0005', $6, 'DRAFT',     25, $5)
      RETURNING id
    `, [customerIds[0], customerIds[1], customerIds[2], customerIds[3], salesId, customerIds[4]]);

    const challanIds = challansResult.rows.map((r: { id: number }) => r.id);

    // Challan items (snapshots)
    await client.query(`
      INSERT INTO challan_items (challan_id, product_id, product_name, sku, unit_price, quantity) VALUES
        ($1, $6,  'HP Laptop 15s',              'LAP-HP-001',  45000.00,  5),
        ($1, $7,  'Logitech Wireless Mouse',     'MOU-LOG-001',   899.00, 50),
        ($2, $8,  'Dell Wired Keyboard',         'KEY-DEL-001',   699.00, 50),
        ($2, $9,  'Lenovo ThinkPad E14',         'LAP-LEN-003', 68000.00,  7),
        ($3, $10, 'Samsung 500GB SSD',           'SSD-SAM-001',  5499.00,  6),
        ($4, $11, 'Dell Laptop Inspiron 14',     'LAP-DEL-002', 52000.00,  5),
        ($4, $12, 'HP Wireless Keyboard+Mouse',  'KBM-HP-001',   1299.00, 10),
        ($5, $13, 'TP-Link WiFi Router AC1200',  'RTR-TPL-001',  1999.00, 20),
        ($5, $14, 'D-Link Range Extender',       'EXT-DLK-001',  1299.00,  5)
    `, [
      challanIds[0], challanIds[1], challanIds[2], challanIds[3], challanIds[4],
      productIds[0], productIds[5],
      productIds[6], productIds[3],
      productIds[14],
      productIds[1], productIds[8],
      productIds[10], productIds[12],
    ]);
    console.log('✅ Challans seeded');

    await client.query('COMMIT');
    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Test Credentials (password: Test@1234):');
    console.log('  admin@test.com      — ADMIN role');
    console.log('  sales@test.com      — SALES role');
    console.log('  warehouse@test.com  — WAREHOUSE role');
    console.log('  accounts@test.com   — ACCOUNTS role');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
