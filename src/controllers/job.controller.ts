import { Request, Response } from 'express';
import { JobType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

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

export const getMyJobs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'غير مصرح.', [], 401);

    const jobs = await prisma.job.findMany({
      where: { publisherId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 'إعلاناتي الوظيفية', jobs);
  } catch (error: any) {
    return sendError(res, 'فشل جلب الإعلانات الوظيفية.', [error.message], 500);
  }
};

export const deleteJob = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return sendError(res, 'الإعلان الوظيفي غير موجود.', [], 404);

    if (job.publisherId !== userId && req.user?.role !== 'ADMIN') {
      return sendError(res, 'غير مصرح لك بحذف هذا الإعلان.', [], 403);
    }

    await prisma.job.delete({ where: { id } });
    return sendSuccess(res, 'تم حذف الإعلان الوظيفي بنجاح.');
  } catch (error: any) {
    return sendError(res, 'فشل حذف الإعلان الوظيفي.', [error.message], 500);
  }
};

export const updateJob = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return sendError(res, 'الإعلان الوظيفي غير موجود.', [], 404);

    if (job.publisherId !== userId && req.user?.role !== 'ADMIN') {
      return sendError(res, 'غير مصرح لك بتعديل هذا الإعلان.', [], 403);
    }

    const { title, description, roleCategory, governorate, salaryRange, experienceYears, contactPhone } = req.body;

    const updated = await prisma.job.update({
      where: { id },
      data: {
        title,
        description,
        roleCategory,
        governorate,
        salaryRange,
        experienceYears,
        contactPhone,
      },
    });

    return sendSuccess(res, 'تم تحديث الإعلان الوظيفي بنجاح!', updated);
  } catch (error: any) {
    return sendError(res, 'فشل تحديث الإعلان الوظيفي.', [error.message], 500);
  }
};

