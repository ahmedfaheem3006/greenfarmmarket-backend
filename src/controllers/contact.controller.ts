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
