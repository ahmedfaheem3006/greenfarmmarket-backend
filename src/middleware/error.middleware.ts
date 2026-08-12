import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('[Centralized Error Log]:', err);

  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Do not expose stack traces or internal server error details in production responses
  const message = isProduction && statusCode === 500
    ? 'حدث خطأ غير متوقع في الخادم الداخلي.'
    : err.message || 'حدث خطأ في الخادم الداخلي.';

  const errors = isProduction ? [] : (err.errors || [err.stack]);

  return sendError(res, message, errors, statusCode);
};

export const notFoundHandler = (req: Request, res: Response) => {
  return sendError(res, `المسار غير موجود: ${req.originalUrl}`, [], 404);
};
