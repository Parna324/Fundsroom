import app from './app';
import { config } from './config/config';
import pool from './config/db';

async function startServer() {
  try {
    // Test database connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Database connected successfully');

    const PORT = Number(process.env.PORT) || 5000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Mini ERP API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
