import { Request, Response } from 'express';
import { PrismaClient, TransportTier } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Centralized pricing constants
const PRICE_PER_KM = 12;
const PLATFORM_FEE_PERCENT = 0.05;

export const calculateCost = async (req: Request, res: Response) => {
  try {
    const { distanceKm, tier } = req.body;
    const km = parseFloat(distanceKm) || 10;
    const basePrice = km * PRICE_PER_KM;
    const fee = basePrice * PLATFORM_FEE_PERCENT;

    let tierMultiplier = 1.0;
    if (tier === 'TRANSPORT_PAY') tierMultiplier = 1.1;
    if (tier === 'TRANSPORT_PAY_INSPECT') tierMultiplier = 1.2;

    const totalPrice = Math.round((basePrice + fee) * tierMultiplier);

    return sendSuccess(res, 'حساب تكلفة النقل المقدرة', {
      distanceKm: km,
      basePrice,
      platformFee: fee,
      totalPrice,
      insuranceCovered: true,
    });
  } catch (error: any) {
    return sendError(res, 'خطأ في حساب التكلفة.', [error.message], 500);
  }
};

export const createTransportRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'غير مصرح.', [], 401);

    const { tier, pickupGov, pickupAddress, destGov, destAddress, cargoType, distanceKm, notes } = req.body;

    if (!pickupGov || !destGov || !cargoType || !distanceKm) {
      return sendError(res, 'جميع الحقول الأساسية لطلب النقل مطلوبة.', [], 400);
    }

    const km = parseFloat(distanceKm);
    const basePrice = km * PRICE_PER_KM;
    const calculatedPrice = Math.round((basePrice * (1 + PLATFORM_FEE_PERCENT)));

    const transportReq = await prisma.transportRequest.create({
      data: {
        userId,
        tier: (tier as TransportTier) || TransportTier.TRANSPORT_ONLY,
        pickupGov,
        pickupAddress: pickupAddress || pickupGov,
        destGov,
        destAddress: destAddress || destGov,
        cargoType,
        distanceKm: km,
        calculatedPrice,
        notes,
      },
    });

    return sendSuccess(res, 'تم تسجيل طلب النقل الذكي بنجاح!', transportReq, 201);
  } catch (error: any) {
    return sendError(res, 'فشل إنشاء طلب النقل.', [error.message], 500);
  }
};

export const getMyTransportRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'غير مصرح.', [], 401);

    const reqs = await prisma.transportRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 'طلبات النقل الخاصة بك', reqs);
  } catch (error: any) {
    return sendError(res, 'خطأ في جلب طلبات النقل.', [error.message], 500);
  }
};

export const getTransportOffers = async (req: Request, res: Response) => {
  try {
    const offers = await prisma.transportOffer.findMany({
      include: {
        driver: {
          select: { id: true, name: true, phone: true, governorate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 'عروض سيارات النقل المتاحة', offers);
  } catch (error: any) {
    return sendError(res, 'خطأ في جلب عروض النقل.', [error.message], 500);
  }
};
