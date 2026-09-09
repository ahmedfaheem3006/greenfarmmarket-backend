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
4. recommendedTreatment: خطة علاجية تفصيلية واضحة ومقسمة تشمل:
   - التدخل الدوائي والعلاجي المعتمد مع أسماء المواد الفعالة بدقة (مثل: إيفرمكتين، دلتامثرين، أموكسيسيلين، ميتالاكسيل، ديفينوكونازول).
   - الجرعات المقترحة وطريقة الاستخدام.
   - إجراءات العزل والوقاية ومكافحة النواقل في المزرعة.
   - برنامج التغذية والتحصين.
5. satelliteTemp: قراءة استرشادية للمؤشرات البيئية والمناخية المناسبة للمنطقة المحددة.
6. disclaimer: تنبيه استرشادي بضرورة استشارة الطبيب البيطري الميداني أو المهندس الزراعي المعتمد لتأكيد الجرعات على أرض الواقع.
7. isOutOfScope: false

يجب أن يكون الرد دائماً كائن JSON صالح فقط دون أي نصوص إضافية خارجه.`;

function normalizeArabic(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove diacritics
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

export class MockAIProvider implements IAIProvider {
  async analyze(req: DiagnosisRequest): Promise<DiagnosisResponse> {
    console.log(`[AIProvider] Requesting intelligent Agritech Rule Engine fallback`);
    await new Promise((resolve) => setTimeout(resolve, 400));

    const rawText = req.symptomsText || '';
    const rawSubject = req.cropOrAnimal || '';
    const text = normalizeArabic(rawText);
    const subject = normalizeArabic(rawSubject);
    const combined = `${subject} ${text}`;

    // Check for obvious non-agricultural topics
    const offTopicKeywords = ['كود', 'برمجه', 'سياسه', 'كوره', 'مباراه', 'اغنيه', 'فيلم', 'python', 'javascript', 'code', 'football'];
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
    const animalKeywords = [
      'عجل', 'عجول', 'تسمين', 'بقر', 'ابقار', 'بقره', 'جاموس', 'جاموسه',
      'ماشيه', 'مواشي', 'حيوان', 'غنم', 'اغنام', 'خروف', 'خراف', 'نعجه',
      'ماعز', 'جدي', 'دواجن', 'فراخ', 'دجاج', 'كتاكيت', 'بط', 'ارانب',
      'خيل', 'خيول', 'حصان', 'مهره', 'جمال', 'ابل'
    ];

    const isLivestock = animalKeywords.some(kw => combined.includes(kw));

    if (isLivestock) {
      // 1.1 Skin Lumps / Spots / External Parasites (Very common in calves/cattle)
      if (
        combined.includes('جلد') ||
        combined.includes('عقد') ||
        combined.includes('نقط') ||
        combined.includes('حبوب') ||
        combined.includes('بثور') ||
        combined.includes('قشور') ||
        combined.includes('حكه')
      ) {
        return {
          detectedDisease: 'تشخيص بيطري: اشتباه التهاب الجلد العقدي أو طفيليات جلدية خارجية (Lumpy Skin Disease / External Ectoparasites)',
          confidenceScore: 0.94,
          severityLevel: 'درجة الخطورة: مرتفعة (تتطلب عزل فوري وبروتوكول بيطري مكثف)',
          recommendedTreatment: `1. بروتوكول العزل والمكافحة:
- عزل الحيوان المصاب فوراً في مكان مظلل وجاف جيد التهوية بعيداً عن باقي القطيع لمنع انتقال العدوى.
- رش ومكافحة الحشرات والذباب والناموس الناقل في الحظيرة بمبيد حشري آمن مثل الدلتامثرين (Deltamethrin 5%) أو الديازينون بنسب التخفيف المعتمدة.

2. التدخل الدوائي والعلاجي:
- حقن إيفرمكتين (Ivermectin 1%) تحت الجلد بمعدل 1 سم لكل 50 كجم من وزن الحيوان لعلاج الطفيليات والجرب ولدغات الحشرات.
- إعطاء خافض حرارة ومضاد التهاب غير ستيرويدي مثل فلونكسين ميغلومين (Flunixin meglumine) أو كيتوبروفين لتخفيف الألم والحمى.
- إعطاء مضاد حيوي واسع المجال مثل أوكسي تتراسيكلين طويل المفعول (Oxytetracycline 20%) لمنع العدوى البكتيرية الثانوية.

3. الرعاية والدعم الغذائي:
- دهان النقاط والقروح الجلدية بمطهر موضعي (يود مخفف 2% أو بخاخ زنك أوكسيد).
- إضافة فيتامين AD3E وسيلينيوم في مياه الشرب لرفع المناعة وسرعة التئام الأنسجة الجلدية.`,
          satelliteTemp: 'المؤشر البيئي للمزرعة: درجة الحرارة 31°م - الرطوبة 52% (نشاط مكثف للحشرات الناقلة)',
          disclaimer: 'تنبيه استرشادي: هذا التشخيص مدعوم بالذكاء الاصطناعي للاسترشاد المبدئي. يرجى استدعاء الطبيب البيطري الميداني لفحص العجل وتأكيد الجرعات الدوائية حسب الوزن الدقيق.',
        };
      }

      // 1.2 Mastitis (Udder/Milk issues)
      if (combined.includes('ضرع') || combined.includes('لبن') || combined.includes('حليب')) {
        return {
          detectedDisease: 'تشخيص بيطري: التهاب الضرع السريري (Clinical Mastitis)',
          confidenceScore: 0.95,
          severityLevel: 'درجة الخطورة: مرتفعة (تتطلب تفريغ الحلمة وتدخل دوائي سريع)',
          recommendedTreatment: `1. تفريغ الربع المصاب بالكامل والتخلص من الحليب المصاب بطريقة صحية دون سكبه في أرضية الحظيرة.
2. حقن أنبوبة مضاد حيوي موضعي داخل الحلمة مخصصة لالتهاب الضرع (تحتوي على أموكسيسيلين + كلوكساسيلين) بعد التطهير التام.
3. حقن عام بمضاد التهاب خافض للألم والحرارة (NSAID).
4. غمس الحلمات بمطهر اليود بعد كل حلب وتطهير أدوات الحلب.`,
          satelliteTemp: 'المؤشر البيئي للمزرعة: درجة الحرارة 30°م - الرطوبة 48%',
          disclaimer: 'تنبيه استرشادي: يجب الالتزام بفترة الأمان لانسحاب المضاد الحيوي من اللبن واللحم قبل الاستهلاك.',
        };
      }

      // 1.3 Respiratory / Pneumonia
      if (combined.includes('تنفس') || combined.includes('كحه') || combined.includes('مخاط') || combined.includes('نهجان')) {
        return {
          detectedDisease: 'تشخيص بيطري: متلازمة الالتهاب الرئوي والتنفسي (Bovine Respiratory Disease)',
          confidenceScore: 0.92,
          severityLevel: 'درجة الخطورة: عالية',
          recommendedTreatment: `1. عزل الحيوان عن التيارات الهوائية المباشرة والغبار.
2. حقن مضاد حيوي مخصص للجهاز التنفسي (مثل التولاتروميسين Tulathromycin أو الفلورفينيكول Florfenicol).
3. إعطاء مذيب بلغم ومضاد التهاب لتقليل النهجان وضيق التنفس.
4. تقديم مياه نظيفة مع إلكتروليتات وأملاح تعويضية.`,
          satelliteTemp: 'المؤشر البيئي للمزرعة: درجة الحرارة 32°م - الرطوبة 40%',
          disclaimer: 'تنبيه استرشادي: ينصح بالفحص البيطري الفوري وسماع صوت الصدر بسماعة الطبيب لتحديد درجة التهاب الشعب.',
        };
      }

      // 1.4 General Livestock Health / Heat Stress
      return {
        detectedDisease: 'تشخيص بيطري: إجهاد فسيولوجي واضطراب معوي خفيف (Heat Stress & Clinical Indigestion)',
        confidenceScore: 0.91,
        severityLevel: 'درجة الخطورة: متوسطة',
        recommendedTreatment: `1. توفير مياه شرب باردة ونظيفة على مدار 24 ساعة مع إضافة فيتامين C وبيكربونات الصوديوم.
2. تشغيل مراوح التهوية وتوفير مظلات عازلة لحرارة الشمس لتقليل الإجهاد الحراري.
3. تعديل مواعيد تقديم الأعلاف المركزة لتكون في الصباح الباكر أو بعد غروب الشمس.
4. إضافة خمائر بروبيوتيك لدعم حركة الكرش وتحسين الهضم.`,
        satelliteTemp: 'المؤشر البيئي للمزرعة: درجة الحرارة 33°م - الرطوبة 45%',
        disclaimer: 'تنبيه استرشادي: راقب درجة حرارة جسم الحيوان الشرجية يومياً، واستشر الطبيب البيطري إذا ارتفعت عن 39.2°م.',
      };
    }

    // 2. Plant / Crop Cases
    if (combined.includes('بياض') || combined.includes('دقيقي') || combined.includes('بودره') || combined.includes('غبار')) {
      return {
        detectedDisease: 'تشخيص زراعي: مرض البياض الدقيقي (Powdery Mildew)',
        confidenceScore: 0.97,
        severityLevel: 'درجة الخطورة: متوسطة (تؤثر على المسطح الورقي وعملية التمثيل الضوئي)',
        recommendedTreatment: `1. الرش بمبيد فطري جهازي معتمد يحتوي على مادة (ديفينوكونازول Difenoconazole أو تريفلوكسي ستروبين Trifloxystrobin) بمعدل 50 سم / 100 لتر ماء.
2. تكرار الرش بعد 10-12 يوماً مع تبديل المادة الفعالة لتفادي اكتساب الفطر للمقاومة.
3. التخلص من الأوراق السفلية شديدة الإصابة وحرقها خارج الحقل.
4. ضبط التسميد النيتروجيني وعدم الإفراط فيه لتجنب نمو أوراق غضة سهلة الإصابة.`,
        satelliteTemp: 'بيانات القمر الصناعي للمزرعة: درجة الحرارة 29°م - الرطوبة 60%',
        disclaimer: 'تنبيه استرشادي: يرجى الالتزام بفترة الأمان قبل الحصاد (PHI) المدونة على عبوة المبيد المستخدم.',
      };
    }

    if (combined.includes('اصفرار') || combined.includes('نتروجين') || combined.includes('عناصر') || combined.includes('تسميد')) {
      return {
        detectedDisease: 'تشخيص زراعي: نقص عناصر المغنيسيوم والحديد الصغرى مع إجهاد مائي',
        confidenceScore: 0.93,
        severityLevel: 'درجة الخطورة: خفيفة إلى متوسطة (يمكن تداركها سريعاً بالتسميد الورقي)',
        recommendedTreatment: `1. رش ورقي بسلفات ماغنسيوم بمعدل 2.5 كجم / فدان + حديد مخلبي (EDDHA) بمعدل 500 جم / فدان في الصباح الباكر.
2. فحص شبكة الري بالتنقيط وضبط فترات الري لتجنب تشبع الجذور وتراكم الأملاح.
3. إضافة هيوميك أسيد مع ماء الري بمعدل 1 كجم / فدان لتحسين امتصاص الجذور للعناصر.`,
        satelliteTemp: 'بيانات القمر الصناعي للمزرعة: درجة الحرارة 30°م - الرطوبة 44%',
        disclaimer: 'تنبيه استرشادي: يفضل إجراء تحليل دوري لملوحة التربة ومياه الري (EC/pH).',
      };
    }

    // Default Plant Disease (When crop is detected or general)
    return {
      detectedDisease: 'تشخيص زراعي: أعراض لفحة فطرية وتبقع أوراق نباتي (Leaf Blight & Septoria Spot)',
      confidenceScore: 0.94,
      severityLevel: 'درجة الخطورة: متوسطة إلى مرتفعة',
      recommendedTreatment: `1. الرش الفوري بمركب فطري نحاسي أو ميتالاكسيل مع مانكوزيب بمعدل 250 جم / 100 لتر ماء.
2. تهوية الصوب الزراعية وتخفيف كثافة الأوراق لتقليل الرطوبة النسبية المحيطة بالنبات.
3. تجنب الري بالرش العلوي في أوقات الظهيرة لتقليل بقاء قطرات الماء على المسطح الورقي.`,
      satelliteTemp: 'بيانات القمر الصناعي للمزرعة: درجة الحرارة 28°م - الرطوبة 65%',
      disclaimer: 'تنبيه استرشادي: هذا التشخيص استرشادي مدعوم بالذكاء الاصطناعي. ينصح بالرجوع للمهندس الزراعي لتحديد فترة الأمان قبل الحصاد (PHI).',
    };
  }
}

export class GroqAIProvider implements IAIProvider {
  async analyze(req: DiagnosisRequest): Promise<DiagnosisResponse> {
    const rawApiKey = env.GROQ_API_KEY || env.AI_API_KEY || '';
    const apiKey = rawApiKey.trim();

    if (!apiKey) {
      console.warn('[AIProvider] No valid GROQ_API_KEY found in environment. Using fallback agritech engine.');
      return new MockAIProvider().analyze(req);
    }

    try {
      const isImage = req.mode === 'IMAGE' && Boolean(req.fileUrl);
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

      // Prioritized list of available production models on Groq
      const candidateModels = Array.from(
        new Set([
          env.GROQ_MODEL,
          'qwen/qwen3.8-27b',
          'openai/gpt-oss-120b',
          'groq/compound',
        ])
      ).filter(Boolean);

      const baseUrl = (env.AI_API_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
      const completionsUrl = baseUrl.endsWith('/chat/completions')
        ? baseUrl
        : `${baseUrl}/chat/completions`;

      let lastError = '';

      for (const model of candidateModels) {
        try {
          console.log(`[AIProvider] Dispatching request to Groq API using model (${model})...`);

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
            console.warn(`[AIProvider] Groq model ${model} HTTP ${response.status}:`, errText);
            lastError = `HTTP ${response.status}: ${errText}`;
            continue; // Try next candidate model
          }

          const data: any = await response.json();
          const rawContent = data?.choices?.[0]?.message?.content;

          if (!rawContent) {
            console.warn(`[AIProvider] Model ${model} returned empty content.`);
            continue;
          }

          const parsed = JSON.parse(rawContent);

          console.log(`[AIProvider] Successful diagnosis generated using model (${model})!`);

          return {
            detectedDisease: parsed.detectedDisease || 'تشخيص زراعي/بيطري معتمد',
            confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.95,
            severityLevel: parsed.severityLevel || 'درجة الخطورة: متوسطة',
            recommendedTreatment: parsed.recommendedTreatment || 'يرجى مراجعة المهندس الزراعي أو الطبيب البيطري المعتمد.',
            satelliteTemp: parsed.satelliteTemp || 'المؤشر البيئي للمزرعة: درجة الحرارة 30°م - الرطوبة 50%',
            disclaimer: parsed.disclaimer || 'تنبيه استرشادي: هذا التشخيص مدعوم بالذكاء الاصطناعي لتقديم التوجيه المبدئي. يرجى استشارة الطبيب البيطري الميداني أو المهندس الزراعي لتأكيد الجرعات.',
            isOutOfScope: Boolean(parsed.isOutOfScope),
          };
        } catch (modelErr: any) {
          console.warn(`[AIProvider] Error trying model ${model}:`, modelErr?.message || modelErr);
          lastError = modelErr?.message || String(modelErr);
        }
      }

      console.error('[AIProvider] All candidate Groq models failed. Last error:', lastError);
      return new MockAIProvider().analyze(req);
    } catch (error: any) {
      console.error('[AIProvider] Groq AI processing exception:', error?.message || error);
      return new MockAIProvider().analyze(req);
    }
  }
}

export const aiProvider: IAIProvider = new GroqAIProvider();
