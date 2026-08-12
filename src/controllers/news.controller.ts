import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';

const prisma = new PrismaClient();

export const getArticles = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const where: any = {};
    if (category && category !== 'all') {
      where.category = String(category);
    }

    const articles = await prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 'النشرة الإخبارية الزراعية', articles);
  } catch (error: any) {
    return sendError(res, 'خطأ في جلب المقالات.', [error.message], 500);
  }
};

export const getArticleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) return sendError(res, 'المقال غير موجود.', [], 404);

    return sendSuccess(res, 'تفاصيل المقال', article);
  } catch (error: any) {
    return sendError(res, 'خطأ في جلب بيانات المقال.', [error.message], 500);
  }
};
