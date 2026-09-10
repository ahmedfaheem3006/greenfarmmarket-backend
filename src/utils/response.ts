import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export const sendSuccess = <T>(res: Response, message: string, data?: T, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data ?? {},
  } as ApiResponse<T>);
};

export const sendError = (res: Response, message: string, errors: any[] = [], statusCode = 400) => {
  const isProduction = process.env.NODE_ENV === 'production';
  let finalMessage = message;

  if (statusCode === 500) {
    console.error('[SERVER_500_ERROR]', { message, errors });

    const isMissingTable = errors.some(
      (err) => typeof err === 'string' && (err.includes("doesn't exist") || err.includes('does not exist'))
    );
    const isDbError = errors.some(
      (err) =>
        typeof err === 'string' &&
        (err.includes('pool timeout') ||
          err.includes('ECONNREFUSED') ||
          err.includes('ETIMEDOUT') ||
          err.includes('Access denied') ||
          err.includes('Can\'t connect') ||
          err.includes('connection'))
    );

    if (isMissingTable) {
      finalMessage = 'قاعدة البيانات متصلة ولكن الجداول لم يتم تهيئتها بعد (يرجى تنفيذ npx prisma migrate deploy في الاستضافة).';
    } else if (isDbError) {
      finalMessage = 'فشل في الاتصال بقاعدة البيانات. يرجى التحقق من صحة بيانات الاتصال بـ MySQL.';
    }
  }

  return res.status(statusCode).json({
    success: false,
    message: finalMessage,
    ...(isProduction ? {} : { errors }),
  } as ApiResponse);
};
