import mariadb, { Connection } from 'mariadb';

export interface DatabaseProbeResult {
  driverConnected: boolean;
  error?: {
    code?: string;
    errno?: number;
    sqlState?: string;
    message?: string;
  };
}

/**
 * Raw MariaDB direct connectivity diagnostic probe.
 * Attempts a direct connection using the installed mariadb driver package without Prisma.
 * Used for startup/health diagnostics. Safe server-side logging without credentials.
 */
export async function probeDatabaseConnection(): Promise<DatabaseProbeResult> {
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

  let conn: Connection | null = null;
  try {
    conn = await mariadb.createConnection({
      host,
      port,
      user: user || 'root',
      password,
      database: database || 'greenfarm',
      connectTimeout: 5000,
    });

    await conn.query('SELECT 1 AS ok');
    await conn.end();
    return { driverConnected: true };
  } catch (err: any) {
    if (conn) {
      try {
        await conn.end();
      } catch {
        // Ignore cleanup error on failed connection
      }
    }

    const code = err.code || (err.fatal ? 'EFATAL' : 'UNKNOWN');
    const errno = err.errno;
    const sqlState = err.sqlState;
    const errorType = err.name || 'MariaDbError';

    // Safe diagnostic server-side logging (NEVER log DB_PASSWORD or credentials)
    console.error('[DB DIRECT PROBE FAILED]', {
      code,
      errno,
      sqlState,
      errorType,
      message: err.message ? err.message.substring(0, 150) : undefined,
    });

    return {
      driverConnected: false,
      error: {
        code: String(code),
        errno: typeof errno === 'number' ? errno : undefined,
        sqlState: typeof sqlState === 'string' ? sqlState : undefined,
        message: err.message,
      },
    };
  }
}
