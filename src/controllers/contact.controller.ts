import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';

export const createContactMessage = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, subject, message, userId } = req.body;

    if (!name || !phone || !email || !subject || !message) {
      return sendError(res, 'جميع الحقول مطلوبة لإرسال الرسالة.', [], 400);
    }

    const contactMsg = await prisma.contactMessage.create({
      data: {
        userId: userId || undefined,
        name,
        phone,
        email,
        subject,
        message,
      },
    });

    return sendSuccess(res, 'تم إرسال رسالتك بنجاح! سيتواصل معك فريق خدمة العملاء قريباً.', contactMsg, 201);
  } catch (error: any) {
    return sendError(res, 'فشل إرسال الرسالة.', [error.message], 500);
  }
};

export const claimDiscount = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return sendError(res, 'يرجى إدخال بريد إلكتروني صالح.', [], 400);
    }

    const discountCode = 'GREENFARM10';

    const contactMsg = await prisma.contactMessage.create({
      data: {
        name: 'مشترك عرض الخصم 10%',
        phone: '01000000000',
        email: email.trim().toLowerCase(),
        subject: 'تفعيل كود الخصم الحصري 10% (GREENFARM10)',
        message: `تم الاشتراك في عرض الانضمام الحصري وتفعيل كود الخصم 10% (GREENFARM10) للبريد الإلكتروني: ${email}`,
      },
    });

    return sendSuccess(
      res,
      'تهانينا! تم تفعيل كود الخصم 10% بنجاح.',
      {
        discountCode,
        email: contactMsg.email,
        validUntil: '2026-12-31',
        discountPercent: 10,
      },
      200
    );
  } catch (error: any) {
    console.error('Claim discount error:', error);
    return sendError(res, 'فشل تفعيل كود الخصم.', [error.message], 500);
  }
};
