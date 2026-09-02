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
    console.log(`[AIProvider] Requesting analysis via ${env.AI_API_URL || 'AI Agritech Engine'} using key: ${env.AI_API_KEY ? 'CONFIGURED' : 'DEMO'}`);
    
    // Simulate AI processing latency
    await new Promise((resolve) => setTimeout(resolve, 900));

    const text = (req.symptomsText || '').toLowerCase();
    const subject = (req.cropOrAnimal || '').toLowerCase();

    // 1. Livestock / Veterinary Cases
    if (
      subject.includes('بقر') ||
      subject.includes('ماشية') ||
      subject.includes('جاموس') ||
      subject.includes('عجول') ||
      subject.includes('غنم') ||
      subject.includes('ماعز') ||
      subject.includes('دواجن') ||
      text.includes('حرارة') ||
      text.includes('عرج') ||
      text.includes('شهية') ||
      text.includes('ضرع') ||
      text.includes('إسهال')
    ) {
      if (text.includes('ضرع') || text.includes('لبن') || text.includes('حليب')) {
        return {
          detectedDisease: 'تشخيص بيطري: التهاب الضرع السريري (Clinical Mastitis)',
          confidenceScore: 0.95,
          severityLevel: 'درجة الخطورة: مرتفعة (تتطلب عزل فوري وتدخل علاجي)',
          recommendedTreatment: 'تفريغ الربع المصاب دورياً، حقن مضاد حيوي موضعي داخل الحلمة (مثل الأموكسيسيلين)، وحقن مضاد التهاب غير ستيرويدي (NSAID) لخفض الألم والحرارة.',
          satelliteTemp: 'المؤشر البيئي للمزرعة: درجة الحرارة 31°م - الرطوبة 48%',
          disclaimer: 'تنبيه استرشادي: هذا التشخيص مدعوم بالذكاء الاصطناعي لتقديم التوجيه المبدئي. يرجى استشارة الطبيب البيطري الميداني لتأكيد الجرعات.',
        };
      }

      if (text.includes('جلد') || text.includes('عقد') || text.includes('حبوب')) {
        return {
          detectedDisease: 'تشخيص بيطري: مرض الجلد العقدي (Lumpy Skin Disease)',
          confidenceScore: 0.93,
          severityLevel: 'درجة الخطورة: عالية - وبائية',
          recommendedTreatment: 'عزل الحيوان فوراً عن باقي القطيع، رش الحظيرة بالمبيدات الحشرية لمكافحة الذباب والناموس الناقل، وإعطاء خافض حرارة ومضاد حيوي واسع المجال لتجنب العدوى البكتيرية الثانوية.',
          satelliteTemp: 'المؤشر البيئي للمزرعة: درجة الحرارة 33°م - الرطوبة 55%',
          disclaimer: 'تنبيه استرشادي: هذا التشخيص مدعوم بالذكاء الاصطناعي لتقديم التوجيه المبدئي. يرجى استشارة الطبيب البيطري الميداني لتأكيد الجرعات.',
        };
      }

      return {
        detectedDisease: 'تشخيص بيطري: إجهاد حراري واضطراب معوي خفيف (Heat Stress & Indigestion)',
        confidenceScore: 0.91,
        severityLevel: 'درجة الخطورة: متوسطة',
        recommendedTreatment: 'تشغيل مراوح التهوية والرش الرذاذي، إضافة بيكربونات الصوديوم وفيتامين C إلى ماء الشرب، وتقديم الأعلاف الخضراء في الصباح الباكر.',
        satelliteTemp: 'المؤشر البيئي للمزرعة: درجة الحرارة 34°م - الرطوبة 42%',
        disclaimer: 'تنبيه استرشادي: هذا التشخيص مدعوم بالذكاء الاصطناعي لتقديم التوجيه المبدئي. يرجى استشارة الطبيب البيطري الميداني لتأكيد الجرعات.',
      };
    }

    // 2. Plant / Crop Cases
    if (text.includes('بياض') || text.includes('دقيقي') || text.includes('بودرة') || text.includes('غبار')) {
      return {
        detectedDisease: 'تشخيص زراعي: مرض البياض الدقيقي (Powdery Mildew)',
        confidenceScore: 0.97,
        severityLevel: 'درجة الخطورة: متوسطة (تؤثر على المسطح الورقي وعملية البناء الضوئي)',
        recommendedTreatment: 'الرش بمبيد فطري جهازي يحتوي على مادة (ديفينوكونازول أو تريفلوكسي ستروبين) بمعدل 50سم/100 لتر ماء مع تكرار الرش بعد 10 أيام.',
        satelliteTemp: 'بيانات القمر الصناعي للمزرعة: درجة الحرارة 29°م - الرطوبة 60%',
        disclaimer: 'تنبيه استرشادي: هذا التشخيص يعتمد على تحليل الذكاء الاصطناعي للأعراض والصور. ينصح بالرجوع للمهندس الزراعي لتحديد فترة الأمان قبل الحصاد (PHI).',
      };
    }

    if (text.includes('اصفرار') || text.includes('نتروجين') || text.includes('عناصر') || text.includes('ذبول')) {
      return {
        detectedDisease: 'تشخيص زراعي: نقص عنصر المغنيسيوم والحديد مع إجهاد مائي',
        confidenceScore: 0.92,
        severityLevel: 'درجة الخطورة: خفيفة إلى متوسطة (يمكن تداركها بالتسميد الورقي)',
        recommendedTreatment: 'رش سلفات ماغنسيوم بمعدل 2.5 كجم/فدان + حديد مخلبي (EDDHA) بمعدل 500جم/فدان، وضبط فترات الري بالتنقيط لتفادي تشبع الجذور.',
        satelliteTemp: 'بيانات القمر الصناعي للمزرعة: درجة الحرارة 30°م - الرطوبة 44%',
        disclaimer: 'تنبيه استرشادي: هذا التشخيص يعتمد على تحليل الذكاء الاصطناعي للأعراض والصور. ينصح بالرجوع للمهندس الزراعي لتحديد فترة الأمان قبل الحصاد (PHI).',
      };
    }

    // Default High-Confidence Visual/Text Analysis
    return {
      detectedDisease: 'تشخيص زراعي: اللفحة المتأخرة والتبقع السبتوري (Late Blight / Septoria)',
      confidenceScore: 0.96,
      severityLevel: 'درجة الخطورة: متوسطة إلى مرتفعة',
      recommendedTreatment: 'الرش الفوري بمركبات الميتالاكسيل مع المانكوزيب بمعدل 250جم/100 لتر ماء، مع تجنب الري في فترات الرطوبة العالية وتهوية الصوب الزراعية.',
      satelliteTemp: 'بيانات القمر الصناعي للمزرعة: درجة الحرارة 28°م - الرطوبة 65%',
      disclaimer: 'تنبيه استرشادي: هذا التشخيص يعتمد على تحليل الذكاء الاصطناعي للأعراض والصور. ينصح بالرجوع للمهندس الزراعي لتحديد فترة الأمان قبل الحصاد (PHI).',
    };
  }
}

export const aiProvider = new MockAIProvider();
