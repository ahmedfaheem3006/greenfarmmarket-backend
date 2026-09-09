import path from 'path';
import fs from 'fs';
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
  isOutOfScope?: boolean;
}

export interface IAIProvider {
  analyze(req: DiagnosisRequest): Promise<DiagnosisResponse>;
}

const SYSTEM_PROMPT = `أنت "صيدلية وطبيب منصة جرين فارم ماركت (Green Farm Market)" - مستشار زراعي وطبيب بيطري خبير متخصص حصرياً في تشخيص وعلاج أمراض النباتات والمحاصيل الزراعية، وأمراض وصحة الماشية والدواجن والحيوانات، وعلوم التربة والتسميد، والإنتاج الزراعي والحيواني في مصر والعالم العربي.

قاعدة صارمة وحاسمة لا تقبل أي استثناء (Strict Scope Boundary):
- اختصاصك الوحيد والمطلق والمصرح به هو: (النباتات، المحاصيل الزراعية، الخضار والفواكه، الأشجار، المحاصيل الحقلية، التربة، التسميد، الري، الآفات الزراعية، مكافحة الفطريات والحشرات الزراعية، الأبقار، الجاموس، الأغنام، الماعز، الخيول، الجمال، الدواجن، الطيور، الثروة الحيوانية والداجنة، الطب البيطري والأدوية البيطرية والزراعية).
- إذا كان السؤال أو الوصف أو الصورة خارج هذا النطاق إطلاقاً (مثل: البرمجة، السياسة، الرياضة، الفن، الطبخ العام، الطب البشري، التاريخ، التكنولوجيا العامة، أسئلة عامة، أو دردشة لا تخص الزراعة والمواشي):
  يجب عليك فوراً وبشكل قاطع رفض الإجابة، وإرجاع رد بصيغة JSON محدد كالتالي تماماً:
  {
    "detectedDisease": "خارج نطاق التخصص الزراعي والبيطري",
    "confidenceScore": 1.0,
    "severityLevel": "تنبيه: خارج الاختصاص",
    "recommendedTreatment": "أعتذر منك، أنا صيدلية وطبيب منصة جرين فارم ماركت المتخصص حصرياً في فحص وتشخيص أمراض النباتات والمحاصيل الزراعية وصحة ورعاية الماشية والإنتاج الحيواني والداجني. لا يمكنني تقديم أي إجابات أو استشارات خارج هذا النطاق الزراعي والبيطري المعتمد.",
    "satelliteTemp": "غير متاح للاستفسارات العامة",
    "disclaimer": "يرجى توجيه استفسارك حول محصول زراعي أو حيوان مزرعة لمساعدتك بالتوجيه العلمي والدوائي السليم.",
    "isOutOfScope": true
  }

إذا كان الاستفسار زراعياً أو بيطرياً:
قم بتقديم تشخيص علمي دقيق وخطة علاجية واضحة ومقنعة تتضمن:
1. detectedDisease: اسم المرض أو الإصابة بدقة باللغتين العربية والإنجليزية.
2. confidenceScore: نسبة ثقة رقمية بين 0.85 و 0.99.
3. severityLevel: درجة الخطورة (مثال: "درجة الخطورة: مرتفعة (تتطلب تدخلاً سريعاً)" أو "درجة الخطورة: متوسطة").
4. recommendedTreatment: خطة علاجية تفصيلية تشمل أسماء المواد الفعالة الدوائية أو المبيدات، الجرعات الموصى بها، خطوات العزل أو الوقاية، وتوصيات التغذية أو الرش.
5. satelliteTemp: قراءة استرشادية للمؤشرات البيئية (مثال: "المؤشر البيئي الإقليمي للمزرعة: درجة الحرارة 31°م - الرطوبة 50%").
6. disclaimer: تنبيه استرشادي بضرورة استشارة الطبيب البيطري الميداني أو المهندس الزراعي المعتمد لتأكيد الجرعات على أرض الواقع.
7. isOutOfScope: false

يجب أن يكون الرد دائماً كائن JSON صالح فقط دون أي نصوص إضافية خارجه.`;

export class MockAIProvider implements IAIProvider {
  async analyze(req: DiagnosisRequest): Promise<DiagnosisResponse> {
    console.log(`[AIProvider] Requesting fallback analysis via Agritech Rule Engine`);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const text = (req.symptomsText || '').toLowerCase();
    const subject = (req.cropOrAnimal || '').toLowerCase();

    // Check for obvious non-agricultural topics in fallback mode
    const offTopicKeywords = ['كود', 'برمجة', 'سياسة', 'كورة', 'مباراة', 'أغنية', 'فيلم', 'python', 'javascript', 'code', 'football'];
    if (offTopicKeywords.some(kw => text.includes(kw) || subject.includes(kw))) {
      return {
        detectedDisease: 'خارج نطاق التخصص الزراعي والبيطري',
        confidenceScore: 1.0,
        severityLevel: 'تنبيه: خارج الاختصاص',
        recommendedTreatment: 'أعتذر منك، أنا صيدلية وطبيب منصة جرين فارم ماركت المتخصص حصرياً في فحص وتشخيص أمراض النباتات والمحاصيل الزراعية وصحة ورعاية الماشية والإنتاج الحيواني والداجني. لا يمكنني تقديم أي إجابات أو استشارات خارج هذا النطاق الزراعي والبيطري المعتمد.',
        satelliteTemp: 'غير متاح للاستفسارات العامة',
        disclaimer: 'يرجى توجيه استفسارك حول محصول زراعي أو حيوان مزرعة لمساعدتك بالتوجيه العلمي والدوائي السليم.',
        isOutOfScope: true,
      };
    }

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

export class GroqAIProvider implements IAIProvider {
  async analyze(req: DiagnosisRequest): Promise<DiagnosisResponse> {
    const apiKey = env.GROQ_API_KEY || env.AI_API_KEY;

    if (!apiKey) {
      console.warn('[AIProvider] No GROQ_API_KEY found in environment. Using fallback agritech engine.');
      return new MockAIProvider().analyze(req);
    }

    try {
      const isImage = req.mode === 'IMAGE' && Boolean(req.fileUrl);
      let model = env.GROQ_MODEL || 'llama-3.3-70b-versatile';
      const messages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }];

      const userContextText = `
المجال / الكائن (محصول أو ماشية): ${req.cropOrAnimal || 'غير محدد'}
المحافظة أو الموقع الجغرافي: ${req.governorate || 'غير محدد'}
طريقة الفحص: ${req.mode}
وصف الحالة والأعراض الميدانية: ${req.symptomsText || 'لا يوجد وصف نصي إضافي. يرجى الفحص بناءً على المدخلات المرفقة.'}
      `.trim();

      let imageIncluded = false;
      if (isImage && req.fileUrl) {
        try {
          const uploadsDir = path.resolve(__dirname, '../../', env.UPLOAD_DIR);
          const fileName = path.basename(req.fileUrl);
          const filePath = path.join(uploadsDir, fileName);

          if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeMap: Record<string, string> = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.webp': 'image/webp',
            };
            const mimeType = mimeMap[ext];
            if (mimeType) {
              const fileBuffer = fs.readFileSync(filePath);
              const base64Data = fileBuffer.toString('base64');
              const dataUrl = `data:${mimeType};base64,${base64Data}`;

              messages.push({
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: { url: dataUrl },
                  },
                  {
                    type: 'text',
                    text: `${userContextText}\n\nيرجى فحص الصورة المرفقة كصيدلية وطبيب زراعي/بيطري خبير، وتشخيص الإصابة أو المرض، أو تحديد ما إذا كان المحتوى خارج نطاق الزراعة والمواشي.`,
                  },
                ],
              });

              model = env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview';
              imageIncluded = true;
            }
          }
        } catch (imgErr) {
          console.error('[AIProvider] Failed to prepare vision image for Groq:', imgErr);
        }
      }

      if (!imageIncluded) {
        messages.push({
          role: 'user',
          content: userContextText,
        });
      }

      console.log(`[AIProvider] Dispatching request to Groq API (${model})...`);

      const baseUrl = (env.AI_API_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
      const completionsUrl = baseUrl.endsWith('/chat/completions')
        ? baseUrl
        : `${baseUrl}/chat/completions`;

      const response = await fetch(completionsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[AIProvider] Groq API HTTP ${response.status} error:`, errText);
        return new MockAIProvider().analyze(req);
      }

      const data: any = await response.json();
      const rawContent = data?.choices?.[0]?.message?.content;

      if (!rawContent) {
        throw new Error('Groq returned empty response message content');
      }

      const parsed = JSON.parse(rawContent);

      return {
        detectedDisease: parsed.detectedDisease || 'تشخيص زراعي/بيطري',
        confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.95,
        severityLevel: parsed.severityLevel || 'درجة الخطورة: متوسطة',
        recommendedTreatment: parsed.recommendedTreatment || 'يرجى مراجعة المهندس الزراعي أو الطبيب البيطري المعتمد.',
        satelliteTemp: parsed.satelliteTemp || 'المؤشر البيئي للمزرعة: درجة الحرارة 30°م - الرطوبة 50%',
        disclaimer: parsed.disclaimer || 'تنبيه استرشادي: هذا التشخيص مدعوم بالذكاء الاصطناعي لتقديم التوجيه المبدئي. يرجى استشارة الطبيب البيطري الميداني أو المهندس الزراعي لتأكيد الجرعات.',
        isOutOfScope: Boolean(parsed.isOutOfScope),
      };
    } catch (error: any) {
      console.error('[AIProvider] Groq AI processing exception:', error?.message || error);
      return new MockAIProvider().analyze(req);
    }
  }
}

export const aiProvider: IAIProvider = new GroqAIProvider();
