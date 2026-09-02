import { Request, Response } from 'express';
import { TransportTier } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

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

export const createTransportOffer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'يرجى تسجيل الدخول أولاً كقائد مركبة.', [], 401);

    const { vehicleType, originGov, destGov, capacityTons, tripDate, contactPhone } = req.body;

    if (!vehicleType || !originGov || !destGov || !capacityTons || !contactPhone) {
      return sendError(res, 'جميع الحقول الأساسية لتسجيل المركبة مطلوبة.', [], 400);
    }

    const offer = await prisma.transportOffer.create({
      data: {
        driverId: userId,
        vehicleType,
        originGov,
        destGov,
        capacityTons: parseFloat(capacityTons) || 5,
        tripDate: tripDate || 'متاح يومياً',
        contactPhone,
      },
      include: {
        driver: {
          select: { id: true, name: true, phone: true, governorate: true },
        },
      },
    });

    return sendSuccess(res, 'تم تسجيل مركبتك وعرض النقل بنجاح في الشبكة!', offer, 201);
  } catch (error: any) {
    return sendError(res, 'فشل تسجيل المركبة.', [error.message], 500);
  }
};

export const deleteTransportOffer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const offer = await prisma.transportOffer.findUnique({ where: { id } });
    if (!offer) return sendError(res, 'العرض غير موجود.', [], 404);

    if (offer.driverId !== userId && req.user?.role !== 'ADMIN') {
      return sendError(res, 'غير مصرح لك بحذف هذا العرض.', [], 403);
    }

    await prisma.transportOffer.delete({ where: { id } });
    return sendSuccess(res, 'تم حذف عرض النقل بنجاح.');
  } catch (error: any) {
    return sendError(res, 'فشل حذف عرض النقل.', [error.message], 500);
  }
};
