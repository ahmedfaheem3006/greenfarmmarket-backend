import { Response } from 'express';
import { DiagnosisMode } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { aiProvider } from '../services/ai.service';

export const createDiagnosis = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
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

    let savedDiagnosis = null;
    if (userId) {
      savedDiagnosis = await prisma.diagnosis.create({
        data: {
          userId,
          farmId: farmId || undefined,
          mode: diagnosisMode,
          symptomsText: symptomsText || 'فحص بصري / استفسار طبي',
          fileUrl,
          detectedDisease: result.detectedDisease,
          confidenceScore: result.confidenceScore,
          severityLevel: result.severityLevel,
          recommendedTreatment: result.recommendedTreatment,
          satelliteTemp: result.satelliteTemp,
        },
      });
    }

    const responsePayload = {
      ...(savedDiagnosis || {}),
      detectedDisease: result.detectedDisease,
      confidenceScore: result.confidenceScore,
      severityLevel: result.severityLevel,
      recommendedTreatment: result.recommendedTreatment,
      satelliteTemp: result.satelliteTemp,
      disclaimer: result.disclaimer,
      fileUrl,
      mode: diagnosisMode,
    };

    return sendSuccess(res, 'تم تحليل الحالة وتشخيصها بنجاح عبر صيدلية AI!', responsePayload, 201);
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
