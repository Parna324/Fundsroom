import pool from './src/config/db';
import bcrypt from 'bcrypt';

async function seedDevDatabase() {
    try {
        const hash = await bcrypt.hash('Test@1234', 10);

        const users = [
            { name: 'Admin User', email: 'admin@test.com', role: 'ADMIN' },
            { name: 'Sales User', email: 'sales@test.com', role: 'SALES' },
            { name: 'Warehouse User', email: 'warehouse@test.com', role: 'WAREHOUSE' },
            { name: 'Accounts User', email: 'accounts@test.com', role: 'ACCOUNTS' },
        ];

        for (const user of users) {
            await pool.query(
                `INSERT INTO users (name, email, password_hash, role) VALUES ('${user.name}', '${user.email}', '${hash}', '${user.role}')`
            );
        }

        console.log('✅ Test users seeded successfully');
    } catch (err) {
        console.error('❌ Seeding failed:', err);
    }
}

seedDevDatabase();
