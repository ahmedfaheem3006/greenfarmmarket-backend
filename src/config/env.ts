import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Intelligent DATABASE_URL Resolver.
 * If DATABASE_URL is missing, unformatted, or contains Hostinger placeholder strings,
 * this function dynamically constructs a valid URL from DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, and DB_NAME.
 */
export const getFormattedDatabaseUrl = (): string => {
  const rawUrl = process.env.DATABASE_URL || '';
  const isInvalidPlaceholder =
    !rawUrl ||
    rawUrl.includes('YOUR_DB_USER') ||
    rawUrl.includes('URL_ENCODED_PASSWORD') ||
    rawUrl.includes('YOUR_DB_NAME') ||
    !rawUrl.startsWith('mysql://');

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || '3306';
  const user = process.env.DB_USER || '';
  const pass = process.env.DB_PASSWORD || '';
  const db = process.env.DB_NAME || '';

  if (isInvalidPlaceholder && user && db) {
    const encodedPass = encodeURIComponent(pass);
    const constructedUrl = `mysql://${user}:${encodedPass}@${host}:${port}/${db}`;
    process.env.DATABASE_URL = constructedUrl;
    return constructedUrl;
  }

  if (rawUrl && !isInvalidPlaceholder) {
    return rawUrl;
  }

  if (user && db) {
    const encodedPass = encodeURIComponent(pass);
    const constructedUrl = `mysql://${user}:${encodedPass}@${host}:${port}/${db}`;
    process.env.DATABASE_URL = constructedUrl;
    return constructedUrl;
  }

  return rawUrl;
};

// Ensure process.env.DATABASE_URL is populated before validation
getFormattedDatabaseUrl();

const validateEnv = () => {
  if (isProduction) {
    const requiredVars = [
      'DB_HOST',
      'DB_PORT',
      'DB_USER',
      'DB_PASSWORD',
      'DB_NAME',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
    ];

    const missing = requiredVars.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `CRITICAL CONFIGURATION ERROR: Missing required production environment variable(s): ${missing.join(
          ', '
        )}`
      );
    }
  }
};

validateEnv();

const getJwtAccessSecret = (): string => {
  if (process.env.JWT_ACCESS_SECRET) {
    return process.env.JWT_ACCESS_SECRET;
  }
  if (isProduction) {
    throw new Error(
      'CRITICAL SECURITY CONFIGURATION ERROR: JWT_ACCESS_SECRET environment variable is missing in production!'
    );
  }
  return 'dev_fallback_jwt_access_secret_2026';
};

const getJwtRefreshSecret = (): string => {
  if (process.env.JWT_REFRESH_SECRET) {
    return process.env.JWT_REFRESH_SECRET;
  }
  if (isProduction) {
    throw new Error(
      'CRITICAL SECURITY CONFIGURATION ERROR: JWT_REFRESH_SECRET environment variable is missing in production!'
    );
  }
  return 'dev_fallback_jwt_refresh_secret_2026';
};

export const env = {
  PORT: Number(process.env.PORT || 3000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DATABASE_URL: getFormattedDatabaseUrl(),
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER || '',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || '',
  JWT_ACCESS_SECRET: getJwtAccessSecret(),
  JWT_REFRESH_SECRET: getJwtRefreshSecret(),
  JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '15m',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  AI_API_URL: process.env.AI_API_URL || '',
  AI_API_KEY: process.env.AI_API_KEY || '',
};
