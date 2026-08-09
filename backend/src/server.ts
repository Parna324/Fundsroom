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

    app.listen(config.port, () => {
      console.log(`🚀 Mini ERP API running on port ${config.port}`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   Health: http://localhost:${config.port}/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
