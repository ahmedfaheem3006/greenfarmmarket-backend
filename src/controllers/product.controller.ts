import { Request, Response } from 'express';
import { ProductStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, governorate, search, minPrice, maxPrice } = req.query;

    const where: any = { status: ProductStatus.ACTIVE };

    if (category && category !== 'all') {
      where.categorySlug = String(category);
    }
    if (governorate) {
      where.governorate = String(governorate);
    }
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(String(minPrice));
      if (maxPrice) where.price.lte = parseFloat(String(maxPrice));
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        seller: {
          select: { id: true, name: true, phone: true, governorate: true, city: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 'قائمة المنتجات الزراعية', products);
  } catch (error: any) {
    return sendError(res, 'فشل في جلب إعلانات السوق.', [error.message], 500);
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        seller: {
          select: { id: true, name: true, phone: true, governorate: true, city: true },
        },
      },
    });

    if (!product) return sendError(res, 'المنتج غير موجود.', [], 404);

    return sendSuccess(res, 'تفاصيل المنتج', product);
  } catch (error: any) {
    return sendError(res, 'خطأ في جلب بيانات المنتج.', [error.message], 500);
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'غير مصرح.', [], 401);

    const { title, description, categorySlug, price, priceUnit, governorate, city, quantity, condition } = req.body;

    if (!title || !categorySlug || !price || !governorate || !city) {
      return sendError(res, 'جميع البيانات الأساسية للمنتج مطلوبة.', [], 400);
    }

    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return sendError(res, 'التصنيف غير موجود.', [], 400);

    const images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((f: Express.Multer.File) => images.push(`/uploads/${f.filename}`));
    } else if (req.body.image) {
      images.push(req.body.image);
    }

    const product = await prisma.product.create({
      data: {
        sellerId: userId,
        title,
        description: description || '',
        categorySlug,
        categoryId: category.id,
        price: parseFloat(price),
        priceUnit: priceUnit || 'ج.م',
        governorate,
        city,
        quantity: quantity ? parseInt(quantity) : 1,
        condition: condition || 'جديد',
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop'],
      },
    });

    return sendSuccess(res, 'تمت إضافة المنتج للسوق بنجاح!', product, 201);
  } catch (error: any) {
    console.error('Create product error:', error);
    return sendError(res, 'فشل إضافة المنتج.', [error.message], 500);
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return sendError(res, 'المنتج غير موجود.', [], 404);

    if (product.sellerId !== userId && role !== 'ADMIN') {
      return sendError(res, 'ليس لديك صلاحية لحذف هذا الإعلان.', [], 403);
    }

    await prisma.product.delete({ where: { id } });
    return sendSuccess(res, 'تم حذف المنتج بنجاح.');
  } catch (error: any) {
    return sendError(res, 'فشل حذف المنتج.', [error.message], 500);
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany();
    return sendSuccess(res, 'تصنيفات السوق', categories);
  } catch (error: any) {
    return sendError(res, 'فشل جلب التصنيفات.', [error.message], 500);
  }
};
