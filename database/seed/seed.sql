-- ============================================================
-- Mini ERP + CRM — Seed Data
-- ============================================================
-- Default password for all users: Test@1234
-- bcrypt hash of "Test@1234" with cost 10
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================

INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User',      'admin@test.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'ADMIN'),
('Sales Manager',   'sales@test.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'SALES'),
('Warehouse Staff', 'warehouse@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'WAREHOUSE'),
('Accounts Team',   'accounts@test.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'ACCOUNTS');

-- NOTE: The above hash corresponds to password "password" (bcrypt). The seed.ts script will
-- properly hash "Test@1234" and insert. See database/seed/seed.ts for the authoritative seeder.

-- ============================================================
-- CUSTOMERS
-- ============================================================

INSERT INTO customers (name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes) VALUES
('Rahul Sharma',   '9876543210', 'rahul@abctraders.com',  'ABC Traders',       '27AABCU9603R1ZX', 'WHOLESALE',    '12, MG Road, Mumbai, Maharashtra 400001',          'ACTIVE',   '2026-08-15', 'Key wholesale client, prefers bulk orders'),
('Priya Mehta',    '9123456789', 'priya@pqrdist.com',     'PQR Distributors',  '29AAACR5055K1Z5', 'DISTRIBUTOR',  '45, Brigade Road, Bangalore, Karnataka 560001',    'ACTIVE',   '2026-08-12', 'Distributor for South India region'),
('Amit Kumar',     '8765432109', 'amit@xyzstore.com',     'XYZ Retail Store',  NULL,              'RETAIL',       '8, Connaught Place, Delhi 110001',                  'LEAD',     '2026-08-10', 'Interested in electronics category'),
('Sneha Patel',    '7654321098', 'sneha@modernmart.com',  'Modern Mart',       '24AAACP1234A1Z6', 'RETAIL',       '23, CG Road, Ahmedabad, Gujarat 380009',           'ACTIVE',   '2026-08-20', 'Repeat customer, excellent payment history'),
('Vikram Singh',   '6543210987', 'vikram@vstrading.com',  'VS Trading Co.',    '08AABCV5678B1Z1', 'WHOLESALE',    '67, Station Road, Jaipur, Rajasthan 302001',       'ACTIVE',   '2026-08-18', 'Wholesale electronics and accessories'),
('Deepa Nair',     '9087654321', 'deepa@keraladist.com',  'Kerala Distributors','32AADCD1234C1ZP','DISTRIBUTOR',  '12, MG Road, Kochi, Kerala 682001',                'LEAD',     '2026-08-08', 'New contact, follow up on pricing'),
('Suresh Yadav',   '8901234567', 'suresh@sselectronics.com','SS Electronics', '09AABCS5432D1Z8', 'WHOLESALE',    '34, Hazratganj, Lucknow, Uttar Pradesh 226001',    'INACTIVE', NULL,         'Account dormant since 3 months'),
('Anita Joshi',    '7890123456', 'anita@anita.com',       'Anita Enterprises', NULL,              'RETAIL',       '5, FC Road, Pune, Maharashtra 411004',              'LEAD',     '2026-08-25', 'Interested in office supplies category');

-- ============================================================
-- CUSTOMER FOLLOW-UPS
-- ============================================================

INSERT INTO customer_followups (customer_id, note, follow_up_date, created_by) VALUES
(1, 'Called regarding Q3 bulk order requirements. They need 50 units of laptops.',     '2026-08-01', 2),
(1, 'Sent product catalog via email. Awaiting decision.',                               '2026-08-05', 2),
(1, 'Agreed on bulk discount for order above 100 units.',                              '2026-08-07', 2),
(2, 'Initial meeting with Priya. Discussed distribution margins.',                      '2026-07-28', 2),
(2, 'Provided south India territory pricing structure.',                                '2026-08-02', 2),
(3, 'Cold call — Amit expressed interest in mobile accessories.',                       '2026-08-03', 2),
(4, 'Regular monthly order placed successfully.',                                       '2026-07-30', 2),
(5, 'Negotiated quarterly contract for electronics accessories.',                       '2026-08-04', 2),
(6, 'First contact. Shared company profile.',                                           '2026-08-06', 2);

-- ============================================================
-- PRODUCTS
-- ============================================================

INSERT INTO products (name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location) VALUES
-- Electronics
('HP Laptop 15s',           'LAP-HP-001',   'Electronics',      45000.00,   25,  5,  'A-01-01'),
('Dell Laptop Inspiron 14', 'LAP-DEL-002',  'Electronics',      52000.00,   18,  5,  'A-01-02'),
('Samsung 24" Monitor',     'MON-SAM-001',  'Electronics',      18000.00,   12,  3,  'A-02-01'),
('Lenovo ThinkPad E14',     'LAP-LEN-003',  'Electronics',      68000.00,   3,   5,  'A-01-03'),  -- LOW STOCK
('Apple MacBook Air M2',    'LAP-APL-004',  'Electronics',      115000.00,  2,   3,  'A-01-04'),  -- LOW STOCK

-- Peripherals
('Logitech Wireless Mouse',   'MOU-LOG-001',  'Peripherals',    899.00,   150, 20, 'B-01-01'),
('Dell Wired Keyboard',       'KEY-DEL-001',  'Peripherals',    699.00,   200, 30, 'B-01-02'),
('Sony WH-1000XM5 Headphones','HEAD-SON-001', 'Peripherals',    24990.00,  8,  3,  'B-02-01'),
('HP Wireless Keyboard+Mouse', 'KBM-HP-001',  'Peripherals',    1299.00,  75,  15, 'B-01-03'),
('Anker USB-C Hub 7-in-1',    'HUB-ANK-001',  'Peripherals',   2499.00,   40,  10, 'B-03-01'),

-- Networking
('TP-Link WiFi Router AC1200', 'RTR-TPL-001',  'Networking',    1999.00,  45,  10, 'C-01-01'),
('Netgear 8-Port Switch',      'SWT-NET-001',  'Networking',    3499.00,  20,   5, 'C-01-02'),
('D-Link Range Extender',      'EXT-DLK-001',  'Networking',    1299.00,  30,   8, 'C-01-03'),

-- Storage
('WD 1TB External HDD',        'HDD-WD-001',   'Storage',      4299.00,   35,  8,  'D-01-01'),
('Samsung 500GB SSD',          'SSD-SAM-001',  'Storage',      5499.00,   4,   5,  'D-01-02');  -- LOW STOCK

-- ============================================================
-- STOCK MOVEMENTS (Initial IN movements)
-- ============================================================

INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by) VALUES
(1,  30, 'IN', 'Initial stock purchase from HP distributor',            3),
(2,  20, 'IN', 'Initial stock purchase from Dell distributor',          3),
(3,  15, 'IN', 'Purchase Order PO-2026-001 from Samsung',              3),
(4,  10, 'IN', 'Initial stock — Lenovo ThinkPad consignment',          3),
(5,   5, 'IN', 'Initial stock — Apple premium consignment',            3),
(6, 200, 'IN', 'Bulk purchase — Logitech peripherals',                 3),
(7, 250, 'IN', 'Bulk purchase — Dell keyboards',                       3),
(8,  10, 'IN', 'Premium audio — Sony headphones',                      3),
(9, 100, 'IN', 'HP accessories bulk purchase',                         3),
(10, 50, 'IN', 'Anker hubs — tech accessories purchase',               3),
(11, 50, 'IN', 'Networking equipment — TP-Link batch',                 3),
(12, 25, 'IN', 'Netgear switches — network department order',          3),
(13, 40, 'IN', 'D-Link extenders batch',                               3),
(14, 40, 'IN', 'WD external storage — storage category replenishment', 3),
(15, 10, 'IN', 'Samsung SSD initial stock',                            3),
-- Some OUT movements from sales
(1,  5,  'OUT', 'Sales Challan CHN-2026-0001', 3),
(6,  50, 'OUT', 'Sales Challan CHN-2026-0001', 3),
(7,  50, 'OUT', 'Sales Challan CHN-2026-0002', 3),
(4,  7,  'OUT', 'Sales Challan CHN-2026-0002', 3),
(15, 6,  'OUT', 'Sales Challan CHN-2026-0003', 3);

-- ============================================================
-- CHALLANS
-- ============================================================

INSERT INTO challans (challan_number, customer_id, status, total_quantity, created_by) VALUES
('CHN-2026-0001', 1, 'CONFIRMED', 55, 2),
('CHN-2026-0002', 2, 'CONFIRMED', 57, 2),
('CHN-2026-0003', 4, 'CONFIRMED',  6, 2),
('CHN-2026-0004', 3, 'DRAFT',     15, 2),
('CHN-2026-0005', 5, 'DRAFT',     25, 2);

-- ============================================================
-- CHALLAN ITEMS (snapshots of product data at time of challan)
-- ============================================================

-- CHN-2026-0001 (Confirmed — ABC Traders)
INSERT INTO challan_items (challan_id, product_id, product_name, sku, unit_price, quantity) VALUES
(1, 1, 'HP Laptop 15s',           'LAP-HP-001',  45000.00, 5),
(1, 6, 'Logitech Wireless Mouse', 'MOU-LOG-001',   899.00, 50);

-- CHN-2026-0002 (Confirmed — PQR Distributors)
INSERT INTO challan_items (challan_id, product_id, product_name, sku, unit_price, quantity) VALUES
(2, 7, 'Dell Wired Keyboard',     'KEY-DEL-001',   699.00, 50),
(2, 4, 'Lenovo ThinkPad E14',     'LAP-LEN-003', 68000.00,  7);

-- CHN-2026-0003 (Confirmed — Modern Mart)
INSERT INTO challan_items (challan_id, product_id, product_name, sku, unit_price, quantity) VALUES
(3, 15, 'Samsung 500GB SSD',      'SSD-SAM-001', 5499.00, 6);

-- CHN-2026-0004 (Draft — XYZ Retail Store)
INSERT INTO challan_items (challan_id, product_id, product_name, sku, unit_price, quantity) VALUES
(4, 2,  'Dell Laptop Inspiron 14', 'LAP-DEL-002', 52000.00, 5),
(4, 9,  'HP Wireless Keyboard+Mouse','KBM-HP-001', 1299.00, 10);

-- CHN-2026-0005 (Draft — VS Trading Co.)
INSERT INTO challan_items (challan_id, product_id, product_name, sku, unit_price, quantity) VALUES
(5, 11, 'TP-Link WiFi Router AC1200', 'RTR-TPL-001', 1999.00, 20),
(5, 13, 'D-Link Range Extender',      'EXT-DLK-001', 1299.00,  5);
