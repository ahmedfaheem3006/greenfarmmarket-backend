import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { getFormattedDatabaseUrl } from '../config/env';

// By default, use standard Prisma 6.19 native MySQL engine (rock-solid connection pool, auto-reconnect, zero adapter dead-socket hangs).
// If USE_PRISMA_ADAPTER is explicitly set to 'true', Prisma uses @prisma/adapter-mariadb.
const useAdapter = process.env.USE_PRISMA_ADAPTER === 'true';

const getAdapter = () => {
  let host = process.env.DB_HOST || '127.0.0.1';
  let port = Number(process.env.DB_PORT || 3306);
  let user = process.env.DB_USER || '';
  let password = process.env.DB_PASSWORD || '';
  let database = process.env.DB_NAME || '';

  if (!user && process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      host = parsed.hostname || host;
      port = Number(parsed.port || 3306);
      user = decodeURIComponent(parsed.username || '');
      password = decodeURIComponent(parsed.password || '');
      database = parsed.pathname.replace(/^\//, '');
    } catch {}
  }

  return new PrismaMariaDb({
    host,
    port,
    user: user || 'root',
    password,
    database: database || 'greenfarm',
    connectionLimit: 10,
    connectTimeout: 10000,
    idleTimeout: 15000,
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = (): PrismaClient => {
  const formattedUrl = getFormattedDatabaseUrl();

  if (useAdapter) {
    return new PrismaClient({
      adapter: getAdapter(),
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  // Standard Prisma 6 native MySQL engine:
  return new PrismaClient({
    ...(formattedUrl ? { datasources: { db: { url: formattedUrl } } } : {}),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
