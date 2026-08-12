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

  if (isProduction && statusCode === 500) {
    const isDbError = errors.some(
      (err) =>
        typeof err === 'string' &&
        (err.includes('pool timeout') ||
          err.includes('prisma') ||
          err.includes('Prisma') ||
          err.includes('MariaDB') ||
          err.includes('mariadb') ||
          err.includes('connection'))
    );
    if (isDbError) {
      finalMessage = 'فشل في الاتصال بقاعدة البيانات.';
    }
  }

  return res.status(statusCode).json({
    success: false,
    message: finalMessage,
    ...(isProduction ? {} : { errors }),
  } as ApiResponse);
};
