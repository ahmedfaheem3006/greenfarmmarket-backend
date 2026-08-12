import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// If USE_PRISMA_ADAPTER is set to 'false', Prisma falls back to standard Prisma 6.19 MySQL engine
const useAdapter = process.env.USE_PRISMA_ADAPTER !== 'false';

const getAdapter = () => {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'greenfarm';

  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
    return new PrismaMariaDb({
      host: process.env.DB_HOST,
      port,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      connectionLimit: 5,
    });
  }

  if (process.env.DATABASE_URL) {
    return new PrismaMariaDb(process.env.DATABASE_URL);
  }

  return new PrismaMariaDb({
    host,
    port,
    user,
    password,
    database,
    connectionLimit: 5,
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = (): PrismaClient => {
  if (useAdapter) {
    return new PrismaClient({
      adapter: getAdapter(),
    });
  }
  // Fallback: standard Prisma 6.19 MySQL engine reading DATABASE_URL directly
  return new PrismaClient();
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
