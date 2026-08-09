import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || '',
};

if (!config.jwtSecret || config.jwtSecret === 'fallback-secret-change-in-production') {
  if (config.nodeEnv === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
}

if (!config.databaseUrl && config.nodeEnv === 'production') {
  throw new Error('DATABASE_URL must be set in production');
}
