import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getAdminStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalFarms = await prisma.farm.count();
    const totalProducts = await prisma.product.count();
    const totalDiagnoses = await prisma.diagnosis.count();
    const totalTransportReqs = await prisma.transportRequest.count();
    const totalJobs = await prisma.job.count();
    const totalContactMsgs = await prisma.contactMessage.count();

    return sendSuccess(res, 'إحصائيات لوحة التحكم الإدارية', {
      totalUsers,
      totalFarms,
      totalProducts,
      totalDiagnoses,
      totalTransportReqs,
      totalJobs,
      totalContactMsgs,
    });
  } catch (error: any) {
    return sendError(res, 'خطأ في جلب إحصائيات الإدارة.', [error.message], 500);
  }
};

export const getAdminUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        governorate: true,
        city: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, 'قائمة جميع المستخدمين', users);
  } catch (error: any) {
    return sendError(res, 'فشل جلب المستخدمين.', [error.message], 500);
  }
};

export const getAdminContactMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, 'رسائل تواصل معنا', messages);
  } catch (error: any) {
    return sendError(res, 'فشل جلب الرسائل.', [error.message], 500);
  }
};
