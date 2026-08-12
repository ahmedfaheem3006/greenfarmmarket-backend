import { env } from '../config/env';

export interface DiagnosisRequest {
  mode: 'TEXT' | 'IMAGE' | 'VIDEO';
  symptomsText?: string;
  fileUrl?: string;
  cropOrAnimal?: string;
  governorate?: string;
}

export interface DiagnosisResponse {
  detectedDisease: string;
  confidenceScore: number;
  severityLevel: string;
  recommendedTreatment: string;
  satelliteTemp: string;
  disclaimer: string;
}

export interface IAIProvider {
  analyze(req: DiagnosisRequest): Promise<DiagnosisResponse>;
}

export class MockAIProvider implements IAIProvider {
  async analyze(req: DiagnosisRequest): Promise<DiagnosisResponse> {
    console.log(`[AIProvider] Requesting analysis via ${env.AI_API_URL || 'Mock Engine'} using key: ${env.AI_API_KEY ? 'CONFIGURED' : 'DEMO'}`);
    
    // Simulate AI processing latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (req.mode === 'IMAGE' || req.symptomsText?.includes('اصفرار') || req.symptomsText?.includes('بقع')) {
      return {
        detectedDisease: 'الإصابة الحالية: مرض النمش البكتيري (Bacterial Speck) / التبقع الورقي',
        confidenceScore: 0.94,
        severityLevel: 'درجة الخطورة: متوسطة (تأثير على 12% من المساحة المغروسة)',
        recommendedTreatment: 'الرش بمبيد هيدروكسيد النحاس بمعدل 250جم/100 لتر ماء مع تقليل ساعات الري السطحي وإضافة مخصب عضوي محفز للجذور.',
        satelliteTemp: 'درجة حرارة المزرعة الحالية عبر الأقمار: 31°م - رطوبة 45%',
        disclaimer: 'تنبيه مهم: هذه نتائج تشخيص استرشادي تعتمد على الذكاء الاصطناعي وليست بديلاً عن المعاينة الميدانية للera المعتمد أو الخبير البيطري.',
      };
    }

    if (req.mode === 'VIDEO') {
      return {
        detectedDisease: 'تحليل السلوك والعرج: إجهاد حراري مع عرج خفيف في القائمة الخلفية للماشية',
        confidenceScore: 0.89,
        severityLevel: 'درجة الخطورة: منخفضة إلى متوسطة',
        recommendedTreatment: 'رش الماء البارد في مظلات الإيواء، وإضافة فيتامين C وأملاح التعويض في مياه الشرب، وفحص الحافر للتأكد من خلوه من التعفن.',
        satelliteTemp: 'درجة حرارة المزرعة الحالية عبر الأقمار: 33°م - رطوبة 52%',
        disclaimer: 'تنبيه مهم: هذه نتائج تشخيص استرشادي تعتمد على الذكاء الاصطناعي وليست بديلاً عن المعاينة الميدانية للera المعتمد أو الخبير البيطري.',
      };
    }

    return {
      detectedDisease: 'فحص وقائي عام: لا توجد مؤشرات آفات حادة متفشية',
      confidenceScore: 0.96,
      severityLevel: 'حالة ممتازة - وقائية',
      recommendedTreatment: 'الالتزام بجدول التسميد الدوري والري في الساعات الصباحية المبكرة.',
      satelliteTemp: 'درجة حرارة المزرعة الحالية عبر الأقمار: 29°م - رطوبة 40%',
      disclaimer: 'تنبيه مهم: هذه نتائج تشخيص استرشادي تعتمد على الذكاء الاصطناعي وليست بديلاً عن المعاينة الميدانية للera المعتمد أو الخبير البيطري.',
    };
  }
}

export const aiProvider = new MockAIProvider();
