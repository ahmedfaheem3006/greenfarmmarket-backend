import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('[Centralized Error Log]:', err);

  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  let message = err.message || 'حدث خطأ في الخادم الداخلي.';

  if (isProduction) {
    const isDbError =
      err.name?.includes('Prisma') ||
      err.message?.includes('prisma') ||
      err.message?.includes('MariaDB') ||
      err.message?.includes('mysql') ||
      err.message?.includes('SELECT') ||
      err.message?.includes('INSERT') ||
      err.message?.includes('UPDATE') ||
      err.message?.includes('DELETE');

    if (isDbError) {
      message = 'حدث خطأ أثناء الاتصال بقاعدة البيانات.';
    } else if (statusCode === 500) {
      message = 'حدث خطأ غير متوقع في الخادم الداخلي.';
    }
  }

  const errors = isProduction ? [] : (err.errors || [err.stack]);

  return sendError(res, message, errors, statusCode);
};

export const notFoundHandler = (req: Request, res: Response) => {
  return sendError(res, `المسار غير موجود: ${req.originalUrl}`, [], 404);
};
