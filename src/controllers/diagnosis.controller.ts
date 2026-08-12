import { Response } from 'express';
import { PrismaClient, DiagnosisMode } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { aiProvider } from '../services/ai.service';

const prisma = new PrismaClient();

export const createDiagnosis = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'يرجى تسجيل الدخول أولاً.', [], 401);

    const { mode, symptomsText, farmId, cropOrAnimal, governorate } = req.body;
    let fileUrl: string | undefined;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const diagnosisMode = (mode as DiagnosisMode) || DiagnosisMode.TEXT;

    const result = await aiProvider.analyze({
      mode: diagnosisMode,
      symptomsText,
      fileUrl,
      cropOrAnimal,
      governorate,
    });

    const diagnosis = await prisma.diagnosis.create({
      data: {
        userId,
        farmId,
        mode: diagnosisMode,
        symptomsText,
        fileUrl,
        detectedDisease: result.detectedDisease,
        confidenceScore: result.confidenceScore,
        severityLevel: result.severityLevel,
        recommendedTreatment: result.recommendedTreatment,
        satelliteTemp: result.satelliteTemp,
      },
    });

    return sendSuccess(res, 'تم تحليل الحالة وتشخيصها بنجاح عبر صيدلية AI!', diagnosis, 201);
  } catch (error: any) {
    console.error('Diagnosis error:', error);
    return sendError(res, 'فشل في إجراء تشخيص الذكاء الاصطناعي.', [error.message], 500);
  }
};

export const getMyDiagnoses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'غير مصرح.', [], 401);

    const diagnoses = await prisma.diagnosis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 'سجل التشخيصات الخاصة بك', diagnoses);
  } catch (error: any) {
    return sendError(res, 'فشل في جلب الفحوصات.', [error.message], 500);
  }
};
