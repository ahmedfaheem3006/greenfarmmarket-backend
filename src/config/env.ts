import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

const getJwtAccessSecret = (): string => {
  if (process.env.JWT_ACCESS_SECRET) {
    return process.env.JWT_ACCESS_SECRET;
  }
  if (isProduction) {
    throw new Error('CRITICAL SECURITY CONFIGURATION ERROR: JWT_ACCESS_SECRET environment variable is missing in production!');
  }
  return 'dev_fallback_jwt_access_secret_2026';
};

const getJwtRefreshSecret = (): string => {
  if (process.env.JWT_REFRESH_SECRET) {
    return process.env.JWT_REFRESH_SECRET;
  }
  if (isProduction) {
    throw new Error('CRITICAL SECURITY CONFIGURATION ERROR: JWT_REFRESH_SECRET environment variable is missing in production!');
  }
  return 'dev_fallback_jwt_refresh_secret_2026';
};

export const env = {
  PORT: Number(process.env.PORT || 3000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_ACCESS_SECRET: getJwtAccessSecret(),
  JWT_REFRESH_SECRET: getJwtRefreshSecret(),
  JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '15m',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  AI_API_URL: process.env.AI_API_URL || '',
  AI_API_KEY: process.env.AI_API_KEY || '',
};
