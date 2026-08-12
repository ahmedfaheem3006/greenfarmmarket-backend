import { Request, Response } from 'express';
import { PrismaClient, JobType } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getJobs = async (req: Request, res: Response) => {
  try {
    const { type, governorate, role } = req.query;
    const where: any = {};

    if (type) where.type = type === 'hiring' ? JobType.HIRING : JobType.SEEKING;
    if (governorate) where.governorate = String(governorate);
    if (role) where.roleCategory = String(role);

    const jobs = await prisma.job.findMany({
      where,
      include: {
        publisher: {
          select: { id: true, name: true, phone: true, governorate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 'قائمة الفرص التوظيفية', jobs);
  } catch (error: any) {
    return sendError(res, 'فشل جلب إعلانات الوظائف.', [error.message], 500);
  }
};

export const createJob = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'غير مصرح.', [], 401);

    const { type, title, description, roleCategory, governorate, salaryRange, experienceYears, contactPhone } = req.body;

    if (!title || !roleCategory || !governorate || !contactPhone) {
      return sendError(res, 'البيانات الأساسية للوظيفة مطلوبة.', [], 400);
    }

    const job = await prisma.job.create({
      data: {
        publisherId: userId,
        type: type === 'hiring' ? JobType.HIRING : JobType.SEEKING,
        title,
        description,
        roleCategory,
        governorate,
        salaryRange,
        experienceYears,
        contactPhone,
      },
    });

    return sendSuccess(res, 'تم نشر الإعلان الوظيفي بنجاح!', job, 201);
  } catch (error: any) {
    return sendError(res, 'فشل نشر الوظيفة.', [error.message], 500);
  }
};
