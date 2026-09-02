import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Role, ProductStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { logActivity } from '../utils/audit';

// ==========================================
// 1. OVERVIEW & PLATFORM STATS
// ==========================================
export const getAdminStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalFarms = await prisma.farm.count();
    const totalProducts = await prisma.product.count();
    const totalDiagnoses = await prisma.diagnosis.count();
    const totalTransportReqs = await prisma.transportRequest.count();
    const totalTransportOffers = await prisma.transportOffer.count();
    const totalJobs = await prisma.job.count();
    const totalNews = await prisma.article.count();
    const totalAuditLogs = await prisma.auditLog.count();
    const totalContactMsgs = await prisma.contactMessage.count();

    return sendSuccess(res, 'إحصائيات مركز الإدارة والتحكم', {
      totalUsers,
      totalFarms,
      totalProducts,
      totalDiagnoses,
      totalTransportReqs,
      totalTransportOffers,
      totalJobs,
      totalNews,
      totalAuditLogs,
      totalContactMsgs,
    });
  } catch (error: any) {
    return sendError(res, 'خطأ في جلب إحصائيات الإدارة.', [error.message], 500);
  }
};

// ==========================================
// 2. AUDIT LOGS MANAGEMENT
// ==========================================
export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { module, action, search, limit = '100' } = req.query;
    const where: any = {};

    if (module && module !== 'ALL') {
      where.module = String(module);
    }
    if (action && action !== 'ALL') {
      where.action = String(action);
    }
    if (search) {
      where.OR = [
        { description: { contains: String(search), mode: 'insensitive' } },
        { action: { contains: String(search), mode: 'insensitive' } },
        { ipAddress: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(String(limit)) || 100,
    });

    return sendSuccess(res, 'سجل العمليات والأنشطة الإدارية', logs);
  } catch (error: any) {
    return sendError(res, 'فشل جلب سجل العمليات.', [error.message], 500);
  }
};

export const createAuditLogManual = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, module, description } = req.body;
    await logActivity({
      userId: req.user?.userId,
      action: action || 'MANUAL_ENTRY',
      module: module || 'SYSTEM',
      description: description || 'إدخال يدوي من لوحة الإدارة',
      req,
    });
    return sendSuccess(res, 'تم تسجيل النشاط في سجل العمليات بنجاح.');
  } catch (error: any) {
    return sendError(res, 'فشل تسجيل النشاط.', [error.message], 500);
  }
};

// ==========================================
// 3. USER MANAGEMENT & RBAC
// ==========================================
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
        _count: {
          select: {
            products: true,
            postedJobs: true,
            diagnoses: true,
            transportReqs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, 'قائمة جميع المستخدمين', users);
  } catch (error: any) {
    return sendError(res, 'فشل جلب المستخدمين.', [error.message], 500);
  }
};

export const createAdminUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, phone, role, password, governorate, city } = req.body;

    if (!name || !email || !phone || !password) {
      return sendError(res, 'جميع البيانات الأساسية مطلوبة.', [], 400);
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existing) {
      return sendError(res, 'البريد الإلكتروني أو رقم الهاتف مسجل مسبقاً.', [], 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        role: (role as Role) || Role.FARMER,
        passwordHash,
        governorate: governorate || 'القاهرة',
        city: city || 'الرئيسية',
      },
    });

    await logActivity({
      userId: req.user?.userId,
      action: 'CREATE_USER',
      module: 'USERS',
      description: `تم إنشاء حساب مستخدم جديد: ${newUser.name} بصلاحية ${newUser.role}`,
      req,
    });

    return sendSuccess(res, 'تم إنشاء المستخدم بنجاح!', newUser, 201);
  } catch (error: any) {
    return sendError(res, 'فشل إنشاء المستخدم.', [error.message], 500);
  }
};

export const updateAdminUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, role, governorate, city } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(role && { role: role as Role }),
        ...(governorate && { governorate }),
        ...(city && { city }),
      },
    });

    await logActivity({
      userId: req.user?.userId,
      action: 'UPDATE_USER',
      module: 'USERS',
      description: `تم تحديث بيانات وصلاحية المستخدم: ${updatedUser.name} إلى ${updatedUser.role}`,
      req,
    });

    return sendSuccess(res, 'تم تحديث بيانات المستخدم بنجاح.', updatedUser);
  } catch (error: any) {
    return sendError(res, 'فشل تحديث المستخدم.', [error.message], 500);
  }
};

export const deleteAdminUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (id === req.user?.userId) {
      return sendError(res, 'لا يمكنك حذف حساب المدير الخاص بك أثناء تسجيل الدخول.', [], 400);
    }

    const deleted = await prisma.user.delete({ where: { id } });

    await logActivity({
      userId: req.user?.userId,
      action: 'DELETE_USER',
      module: 'USERS',
      description: `تم حذف حساب المستخدم: ${deleted.name} (${deleted.email})`,
      req,
    });

    return sendSuccess(res, 'تم حذف المستخدم بنجاح.');
  } catch (error: any) {
    return sendError(res, 'فشل حذف المستخدم.', [error.message], 500);
  }
};

// ==========================================
// 4. PRODUCTS MODERATION
// ==========================================
export const getAdminProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        seller: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, 'قائمة جميع المنتجات بالسوق', products);
  } catch (error: any) {
    return sendError(res, 'فشل جلب المنتجات.', [error.message], 500);
  }
};

export const updateProductStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.product.update({
      where: { id },
      data: { status: status as ProductStatus },
    });

    await logActivity({
      userId: req.user?.userId,
      action: 'UPDATE_PRODUCT_STATUS',
      module: 'MARKETPLACE',
      description: `تم تغيير حالة المنتج: ${updated.title} إلى ${updated.status}`,
      req,
    });

    return sendSuccess(res, 'تم تحديث حالة المنتج بنجاح.', updated);
  } catch (error: any) {
    return sendError(res, 'فشل تحديث حالة المنتج.', [error.message], 500);
  }
};

export const deleteAdminProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.product.delete({ where: { id } });

    await logActivity({
      userId: req.user?.userId,
      action: 'DELETE_PRODUCT',
      module: 'MARKETPLACE',
      description: `تم حذف المنتج من السوق: ${deleted.title}`,
      req,
    });

    return sendSuccess(res, 'تم حذف المنتج من السوق بنجاح.');
  } catch (error: any) {
    return sendError(res, 'فشل حذف المنتج.', [error.message], 500);
  }
};

// ==========================================
// 5. JOBS MODERATION
// ==========================================
export const getAdminJobs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        publisher: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, 'قائمة إعلانات التوظيف', jobs);
  } catch (error: any) {
    return sendError(res, 'فشل جلب الوظائف.', [error.message], 500);
  }
};

export const deleteAdminJob = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.job.delete({ where: { id } });

    await logActivity({
      userId: req.user?.userId,
      action: 'DELETE_JOB',
      module: 'JOBS',
      description: `تم حذف الإعلان الوظيفي: ${deleted.title}`,
      req,
    });

    return sendSuccess(res, 'تم حذف الإعلان الوظيفي بنجاح.');
  } catch (error: any) {
    return sendError(res, 'فشل حذف الوظيفة.', [error.message], 500);
  }
};

// ==========================================
// 6. NEWS & GUIDANCE MANAGEMENT
// ==========================================
export const getAdminNews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, 'قائمة المقالات الإخبارية', articles);
  } catch (error: any) {
    return sendError(res, 'فشل جلب المقالات.', [error.message], 500);
  }
};

export const createAdminNews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, category, summary, content, imageUrl, author } = req.body;

    if (!title || !category || !content) {
      return sendError(res, 'العنوان والتصنيف والمحتوى مطلوبة.', [], 400);
    }

    const article = await prisma.article.create({
      data: {
        title,
        category,
        summary: summary || title,
        content,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&auto=format&fit=crop',
        author: author || 'إدارة منصة جرين فارم ماركت',
      },
    });

    await logActivity({
      userId: req.user?.userId,
      action: 'CREATE_NEWS',
      module: 'NEWS',
      description: `تم نشر مقال زراعي جديد: ${article.title}`,
      req,
    });

    return sendSuccess(res, 'تم نشر المقال بنجاح!', article, 201);
  } catch (error: any) {
    return sendError(res, 'فشل نشر المقال.', [error.message], 500);
  }
};

export const updateAdminNews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, category, summary, content, imageUrl, author } = req.body;

    const updated = await prisma.article.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(category && { category }),
        ...(summary && { summary }),
        ...(content && { content }),
        ...(imageUrl && { imageUrl }),
        ...(author && { author }),
      },
    });

    await logActivity({
      userId: req.user?.userId,
      action: 'UPDATE_NEWS',
      module: 'NEWS',
      description: `تم تحديث المقال: ${updated.title}`,
      req,
    });

    return sendSuccess(res, 'تم تحديث المقال بنجاح.', updated);
  } catch (error: any) {
    return sendError(res, 'فشل تحديث المقال.', [error.message], 500);
  }
};

export const deleteAdminNews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.article.delete({ where: { id } });

    await logActivity({
      userId: req.user?.userId,
      action: 'DELETE_NEWS',
      module: 'NEWS',
      description: `تم حذف المقال: ${deleted.title}`,
      req,
    });

    return sendSuccess(res, 'تم حذف المقال بنجاح.');
  } catch (error: any) {
    return sendError(res, 'فشل حذف المقال.', [error.message], 500);
  }
};

// ==========================================
// 7. AGRICULTURAL STOCK MARKET / BOURSE
// ==========================================
export const getAdminMarketUpdates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updates = await prisma.marketUpdate.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return sendSuccess(res, 'مؤشرات وأسعار البورصة الزراعية', updates);
  } catch (error: any) {
    return sendError(res, 'فشل جلب أسعار البورصة.', [error.message], 500);
  }
};

export const createMarketUpdate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { commodity, price, priceUnit, change, trend, notes } = req.body;

    if (!commodity || !price || !priceUnit) {
      return sendError(res, 'اسم السلعة والسعر ووحدة القياس مطلوبة.', [], 400);
    }

    const created = await prisma.marketUpdate.create({
      data: {
        commodity,
        price: parseFloat(price),
        priceUnit,
        change: change ? parseFloat(change) : 0,
        trend: trend || 'STABLE',
        notes: notes || '',
      },
    });

    await logActivity({
      userId: req.user?.userId,
      action: 'CREATE_MARKET_UPDATE',
      module: 'MARKET',
      description: `تم تحديث سعر السلعة في البورصة: ${created.commodity} بمبلغ ${created.price} ${created.priceUnit}`,
      req,
    });

    return sendSuccess(res, 'تم إضافة السلعة للبورصة بنجاح!', created, 201);
  } catch (error: any) {
    return sendError(res, 'فشل إضافة السلعة.', [error.message], 500);
  }
};

export const updateMarketUpdate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { commodity, price, priceUnit, change, trend, notes } = req.body;

    const updated = await prisma.marketUpdate.update({
      where: { id },
      data: {
        ...(commodity && { commodity }),
        ...(price && { price: parseFloat(price) }),
        ...(priceUnit && { priceUnit }),
        ...(change !== undefined && { change: parseFloat(change) }),
        ...(trend && { trend }),
        ...(notes !== undefined && { notes }),
      },
    });

    await logActivity({
      userId: req.user?.userId,
      action: 'UPDATE_MARKET_UPDATE',
      module: 'MARKET',
      description: `تم تعديل مؤشر السلعة: ${updated.commodity} إلى ${updated.price} ${updated.priceUnit}`,
      req,
    });

    return sendSuccess(res, 'تم تعديل سعر السلعة بنجاح.', updated);
  } catch (error: any) {
    return sendError(res, 'فشل تعديل السلعة.', [error.message], 500);
  }
};

export const deleteMarketUpdate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.marketUpdate.delete({ where: { id } });

    await logActivity({
      userId: req.user?.userId,
      action: 'DELETE_MARKET_UPDATE',
      module: 'MARKET',
      description: `تم حذف السلعة من البورصة: ${deleted.commodity}`,
      req,
    });

    return sendSuccess(res, 'تم حذف السلعة من البورصة بنجاح.');
  } catch (error: any) {
    return sendError(res, 'فشل حذف السلعة.', [error.message], 500);
  }
};

// ==========================================
// 8. CONTACT MESSAGES
// ==========================================
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
