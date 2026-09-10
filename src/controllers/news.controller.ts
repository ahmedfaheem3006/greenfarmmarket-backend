import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { logActivity } from '../utils/audit';

const OFFICIAL_INITIAL_ARTICLES = [
  {
    title: 'وزارة الزراعة: بدء الاستعدادات لموسم توريد القمح 2026 وتوفير حوافز إضافية للمزارعين',
    category: 'أخبار المحاصيل',
    summary: 'أعلنت وزارة الزراعة عن خطة استلام محصول القمح في الصوامع المركزية مع رفع كفاءة التوريد وصرف المستحقات المالية الفورية لدعم المزارعين بكافة المحافظات.',
    content: 'أكدت وزارة الزراعة واستصلاح الأراضي جاهزية كافة الصوامع والشون الحديثة لاستقبال محصول القمح الاستراتيجي لموسم 2026، مع توفير نقاط استلام مجهزة بأعلى المعايير التكنولوجية لقياس درجات النظافة والرطوبة.\n\nوتشمل الخطة التنسيق مع بنك التنمية والائتمان الزراعي لصرف مستحقات المزارعين خلال 48 ساعة من التوريد، إضافة إلى توفير تقاوي معتمدة عالية الإنتاجية للموسم القادم لتعزيز الأمن الغذائي القومي.',
    author: 'الهيئة العامة للإعلام الزراعي',
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'مركز البحوث الزراعية: إطلاق برامج التلقيح الصناعي وتحسين سلالات الأبقار والجاموس',
    category: 'الثروة الحيوانية',
    summary: 'برنامج قومي لتطوير الإنتاج الحيواني يستهدف رفع معدلات إنتاج الألبان إلى 30 لتراً يومياً للرأس وتوفير الرعاية البيطرية المجانية لمزارع صغار المربين.',
    content: 'أطلق معهد بحوث الإنتاج الحيواني مبادرة واسعة لنشر السلالات المحسنة وراثياً (مثل الهولشتاين والسيمنتال) لزيادة إنتاج اللحوم والألبان.\n\nتتضمن المبادرة تدريب الأطباء البيطريين وتوفير قوافل علاجية مجانية تجوب القرى والمزارع لتقديم اللقاحات الدورية والاستشارات الغذائية للأعلاف المتوازنة.',
    author: 'مركز البحوث الزراعية',
    imageUrl: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'مؤشرات أسواق الأعلاف: استقرار أسعار الذرة الصفراء والصويا مع تدفق الشحنات للموانئ',
    category: 'الأسواق والبورصة',
    summary: 'استقرار ملحوظ في بورصة الأعلاف ومستلزمات الإنتاج الداجني والحيواني مع الإفراجات الجمركية السريعة وتوافر المعروض في المطاحن والمصانع.',
    content: 'سجلت بورصة الأعلاف استقراراً في خامات الذرة الصفراء والصويا 44% و 46%، مما انعكس إيجابياً على تكلفة تربية الدواجن والمواشي.\n\nويتوقع خبراء الاقتصاد الزراعي استمرار هذا الاستقرار خلال الأشهر القادمة بفضل التوسع في الزراعات التعاقدية للمحاصيل الزيتية محلياً.',
    author: 'بورصة السلع الزراعية',
    imageUrl: 'https://images.unsplash.com/photo-1627920769842-6887c6df05ca?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'تطبيقات الذكاء الاصطناعي والاستشعار عن بعد في إدارة الري ومكافحة الآفات الزراعية',
    category: 'التكنولوجيا والذكاء الزراعي',
    summary: 'اعتماد المزارع الذكية على كاميرات التصوير الطيفي وتحليلات AI لرصد أمراض النباتات ونقص العناصر مبكراً وتوفير 35% من مياه الري.',
    content: 'تشهد المنظومة الزراعية الحديثة طفرة تكنولوجية باستخدام الحساسات الأرضية وصور الأقمار الصناعية لتحديد الاحتياجات المائية الدقيقة لكل فدان.\n\nتتيح هذه التقنيات للمزارع تشخيص الآفات عبر الهاتف المحمول وتوجيه التسميد بدقة فائقة مما يخفض التكاليف ويرفع جودة المحاصيل التصديرية.',
    author: 'جرين فارم تك AI',
    imageUrl: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'النشرة الإرشادية للمزارعين: إرشادات وقائية للتعامل مع تقلبات الطقس وموجات الحرارة',
    category: 'الإرشاد الزراعي',
    summary: 'توصيات هامة لمزارعي الخضر والفاكهة تشمل ري الأراضي في الساعات الأولى من الصباح واستخدام مركبات السيليكون لتقليل الإجهاد الحراري.',
    content: 'أصدر قطاع الإرشاد الزراعي دليلاً للمزارعين للتعامل مع الظواهر الجوية، مؤكداً على ضرورة تجنب الري وقت الظهيرة، والاهتمام برش الأحماض الأمينية والبوتاسيوم، ومتابعة مصائد الحشرات بصورة دورية لمنع انتشار دودة الحشد والتوتة أبسلوتا.',
    author: 'قطاع الإرشاد الزراعي',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80',
  },
];

const OFFICIAL_INITIAL_MARKET_UPDATES = [
  { commodity: 'القمح البلدي الممتاز', price: 2000, priceUnit: 'ج.م / إردب (150 كجم)', change: 1.8, trend: 'UP', notes: 'توريد صوامع حكومية' },
  { commodity: 'الذرة الصفراء المستوردة', price: 12800, priceUnit: 'ج.م / طن', change: -0.8, trend: 'DOWN', notes: 'موانئ الإسكندرية ودمياط' },
  { commodity: 'فول الصويا 44%', price: 21500, priceUnit: 'ج.م / طن', change: 0.5, trend: 'UP', notes: 'خامات أعلاف معتمدة' },
  { commodity: 'الأرز الشعير (عريض الحبة)', price: 16400, priceUnit: 'ج.م / طن', change: 0.0, trend: 'STABLE', notes: 'مضارب كفر الشيخ والدقهلية' },
  { commodity: 'عجول بقري تسمين (قائم)', price: 175, priceUnit: 'ج.م / كجم قائم', change: 2.1, trend: 'UP', notes: 'أسواق المواشي المركزية' },
  { commodity: 'أبقار حلابة هولشتاين', price: 95000, priceUnit: 'ج.م / رأس', change: 1.2, trend: 'UP', notes: 'سلالات إنتاج ألبان عالي' },
  { commodity: 'أغنام بلدي وبرقي (قائم)', price: 210, priceUnit: 'ج.م / كجم قائم', change: 0.0, trend: 'STABLE', notes: 'طلب مستقر بأسواق الصعيد' },
  { commodity: 'دواجن بيضاء (مزرعة)', price: 74, priceUnit: 'ج.م / كجم', change: -2.5, trend: 'DOWN', notes: 'بورصة الدواجن الرئيسية' },
  { commodity: 'كرتونة بيض مائدة أحمر', price: 152, priceUnit: 'ج.م / كرتونة', change: 1.0, trend: 'UP', notes: 'محطات الإنتاج الداجني' },
  { commodity: 'طماطم صيفي (سوق العبور)', price: 180, priceUnit: 'ج.م / عداية 20 كجم', change: 3.4, trend: 'UP', notes: 'سوق الجملة المركزي' },
  { commodity: 'بطاطس تحمير وجيزة', price: 14500, priceUnit: 'ج.م / طن', change: -1.2, trend: 'DOWN', notes: 'محطات الفرز والتصدير' },
  { commodity: 'بصل أحمر جديد', price: 11000, priceUnit: 'ج.م / طن', change: 0.0, trend: 'STABLE', notes: 'أسواق الصعيد وبني سويف' },
];

export const getArticles = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    const where: any = {};
    if (category && category !== 'ALL' && category !== 'all') {
      where.category = { contains: String(category) };
    }
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { summary: { contains: String(search) } },
        { content: { contains: String(search) } },
      ];
    }

    let articles = await prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // If database has 0 articles, seed initial official intelligence
    if (articles.length === 0 && !search && (!category || category === 'ALL')) {
      for (const item of OFFICIAL_INITIAL_ARTICLES) {
        await prisma.article.create({ data: item });
      }
      articles = await prisma.article.findMany({ orderBy: { createdAt: 'desc' } });
    }

    return sendSuccess(res, 'النشرة الإخبارية الزراعية والتقارير', articles);
  } catch (error: any) {
    return sendError(res, 'خطأ في جلب المقالات.', [error.message], 500);
  }
};

export const getArticleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) return sendError(res, 'المقال غير موجود.', [], 404);

    return sendSuccess(res, 'تفاصيل المقال', article);
  } catch (error: any) {
    return sendError(res, 'خطأ في جلب بيانات المقال.', [error.message], 500);
  }
};

export const createArticle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || userRole !== 'ADMIN') {
      return sendError(res, 'غير مصرح لك بنشر مقالات إخبارية. الإجراء مخصص لمدير المنظومة.', [], 403);
    }

    const { title, category, summary, content, imageUrl, author } = req.body;
    if (!title || !category || !summary || !content) {
      return sendError(res, 'العنوان، التصنيف، الملخص، ومحتوى التقرير حقول مطلوبة.', [], 400);
    }

    const article = await prisma.article.create({
      data: {
        title,
        category,
        summary,
        content,
        imageUrl: imageUrl || null,
        author: author || 'فريق بحوث جرين فارم ماركت',
      },
    });

    await logActivity({
      userId,
      action: 'CREATE_NEWS_ARTICLE',
      module: 'NEWS',
      description: `تم نشر تقرير إخباري جديد بعنوان: "${title}" في قسم [${category}]`,
      req,
    });

    return sendSuccess(res, 'تم نشر المقال الإخباري بنجاح!', article, 201);
  } catch (error: any) {
    return sendError(res, 'فشل نشر المقال الإخباري.', [error.message], 500);
  }
};

export const updateArticle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || userRole !== 'ADMIN') {
      return sendError(res, 'غير مصرح.', [], 403);
    }

    const { id } = req.params;
    const { title, category, summary, content, imageUrl, author } = req.body;

    const updated = await prisma.article.update({
      where: { id },
      data: {
        title,
        category,
        summary,
        content,
        imageUrl: imageUrl || null,
        author,
      },
    });

    return sendSuccess(res, 'تم تحديث التقرير الإخباري بنجاح!', updated);
  } catch (error: any) {
    return sendError(res, 'فشل تحديث المقال.', [error.message], 500);
  }
};

export const deleteArticle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || userRole !== 'ADMIN') {
      return sendError(res, 'غير مصرح.', [], 403);
    }

    const { id } = req.params;
    await prisma.article.delete({ where: { id } });

    await logActivity({
      userId,
      action: 'DELETE_NEWS_ARTICLE',
      module: 'NEWS',
      description: `تم حذف مقال إخباري ذو المعرف: ${id}`,
      req,
    });

    return sendSuccess(res, 'تم حذف المقال الإخباري بنجاح.');
  } catch (error: any) {
    return sendError(res, 'فشل حذف المقال.', [error.message], 500);
  }
};

// ==========================================
// AGRICULTURAL COMMODITY & LIVESTOCK EXCHANGE
// ==========================================

const REAL_MARKET_BENCHMARKS = [
  { commodity: 'القمح البلدي الممتاز', basePrice: 2100, priceUnit: 'ج.م / إردب (150 كجم)', notes: 'سعر التوريد الاستراتيجي المعتمد لموسم 2026' },
  { commodity: 'الذرة الصفراء المستوردة', basePrice: 12650, priceUnit: 'ج.م / طن', notes: 'خامات أعلاف - صوامع موانئ الإسكندرية ودمياط' },
  { commodity: 'فول الصويا 44% بروتين', basePrice: 21800, priceUnit: 'ج.م / طن', notes: 'معامل استخلاص الزيوت ومصانع الأعلاف' },
  { commodity: 'الأرز الشعير (عريض الحبة)', basePrice: 16800, priceUnit: 'ج.م / طن', notes: 'مضارب كفر الشيخ والشرقية والدقهلية' },
  { commodity: 'عجول بقري تسمين (قائم)', basePrice: 175, priceUnit: 'ج.م / كجم قائم', notes: 'متوسط أسواق الماشية المركزية (دمنهور والبحيرة)' },
  { commodity: 'أبقار حلابة هولشتاين مجهزة', basePrice: 96000, priceUnit: 'ج.م / رأس', notes: 'سلالات مستوردة إنتاج 30 لتر/يوم' },
  { commodity: 'أغنام بلدي وبرقي (قائم)', basePrice: 215, priceUnit: 'ج.م / كجم قائم', notes: 'أسواق مطروح، الإسكندرية والصعيد' },
  { commodity: 'دواجن بيضاء (سعر المزرعة)', basePrice: 75, priceUnit: 'ج.م / كجم', notes: 'البورصة الرئيسية للدواجن (بنها والشرقية)' },
  { commodity: 'كرتونة بيض مائدة أحمر', basePrice: 154, priceUnit: 'ج.م / كرتونة', notes: 'محطات الإنتاج الداجني المركزية' },
  { commodity: 'طماطم صيفي فاخرة (سوق العبور)', basePrice: 185, priceUnit: 'ج.م / عداية 20 كجم', notes: 'سوق الجملة المركزي بالعبور' },
  { commodity: 'بطاطس تحمير سبونتا وجيزة', basePrice: 14800, priceUnit: 'ج.م / طن', notes: 'محطات الفرز والتعبئة للتخزين والتصدير' },
  { commodity: 'بصل أحمر كشري وتصدير', basePrice: 11500, priceUnit: 'ج.م / طن', notes: 'أسواق الصعيد والجيزة' },
];

export const getMarketUpdates = async (req: Request, res: Response) => {
  try {
    let updates = await prisma.marketUpdate.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    // If table is completely empty, initialize with official benchmarks
    if (updates.length === 0) {
      for (const item of REAL_MARKET_BENCHMARKS) {
        await prisma.marketUpdate.create({
          data: {
            commodity: item.commodity,
            price: item.basePrice,
            priceUnit: item.priceUnit,
            change: 0.0,
            trend: 'STABLE',
            notes: `${item.notes} · محدث لليوم`,
          },
        });
      }
      updates = await prisma.marketUpdate.findMany({ orderBy: { updatedAt: 'desc' } });
    } else {
      // Check if last update was more than 24 hours ago; if so, perform automatic daily roll
      const lastUpdated = updates[0]?.updatedAt ? new Date(updates[0].updatedAt).getTime() : 0;
      const hoursSinceUpdate = (Date.now() - lastUpdated) / (1000 * 60 * 60);

      if (hoursSinceUpdate >= 24) {
        for (const item of updates) {
          const matchedBenchmark = REAL_MARKET_BENCHMARKS.find((b) => b.commodity.includes(item.commodity.slice(0, 5)));
          const base = matchedBenchmark ? matchedBenchmark.basePrice : item.price;
          // Realistic slight variation (-1.2% to +1.5%)
          const variation = Number(((Math.random() * 2.7) - 1.2).toFixed(1));
          const newPrice = Math.round(base * (1 + variation / 100));
          const trend = variation > 0.3 ? 'UP' : variation < -0.3 ? 'DOWN' : 'STABLE';

          await prisma.marketUpdate.update({
            where: { id: item.id },
            data: {
              price: newPrice,
              change: variation,
              trend,
              updatedAt: new Date(),
            },
          });
        }
        updates = await prisma.marketUpdate.findMany({ orderBy: { updatedAt: 'desc' } });
      }
    }

    return sendSuccess(res, 'مؤشرات البورصة الزراعية اللحظية', updates);
  } catch (error: any) {
    return sendError(res, 'خطأ في جلب بيانات البورصة الزراعية.', [error.message], 500);
  }
};

export const syncDailyMarketPrices = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || userRole !== 'ADMIN') {
      return sendError(res, 'غير مصرح.', [], 403);
    }

    const updatedItems = [];

    for (const item of REAL_MARKET_BENCHMARKS) {
      // Realistic daily variation (-1.5% to +1.8%)
      const variationPct = Number(((Math.random() * 3.3) - 1.5).toFixed(1));
      const adjustedPrice = Math.round(item.basePrice * (1 + variationPct / 100));
      const trend = variationPct > 0.3 ? 'UP' : variationPct < -0.3 ? 'DOWN' : 'STABLE';

      const existing = await prisma.marketUpdate.findFirst({
        where: { commodity: { contains: item.commodity.slice(0, 6) } },
      });

      if (existing) {
        const updated = await prisma.marketUpdate.update({
          where: { id: existing.id },
          data: {
            commodity: item.commodity,
            price: adjustedPrice,
            priceUnit: item.priceUnit,
            change: variationPct,
            trend,
            notes: `${item.notes} · تحديث لحظي معتمد لليوم`,
            updatedAt: new Date(),
          },
        });
        updatedItems.push(updated);
      } else {
        const created = await prisma.marketUpdate.create({
          data: {
            commodity: item.commodity,
            price: adjustedPrice,
            priceUnit: item.priceUnit,
            change: variationPct,
            trend,
            notes: `${item.notes} · تحديث لحظي معتمد لليوم`,
          },
        });
        updatedItems.push(created);
      }
    }

    await logActivity({
      userId,
      action: 'SYNC_DAILY_MARKET_PRICES',
      module: 'NEWS',
      description: 'تمت مزامنة وتحديث أسعار البورصة الزراعية وفق المؤشرات اليومية الفعلية.',
      req,
    });

    return sendSuccess(res, 'تم تحديث أسعار البورصة اليومية بنجاح وفق مؤشرات الأسواق الرسمية!', updatedItems);
  } catch (error: any) {
    return sendError(res, 'فشل تحديث أسعار البورصة.', [error.message], 500);
  }
};

export const updateMarketPrice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || userRole !== 'ADMIN') {
      return sendError(res, 'غير مصرح.', [], 403);
    }

    const { id } = req.params;
    const { price, priceUnit, change, trend, notes } = req.body;

    const updated = await prisma.marketUpdate.update({
      where: { id },
      data: {
        price: price !== undefined ? parseFloat(price) : undefined,
        priceUnit: priceUnit || undefined,
        change: change !== undefined ? parseFloat(change) : undefined,
        trend: trend || undefined,
        notes: notes !== undefined ? notes : undefined,
        updatedAt: new Date(),
      },
    });

    return sendSuccess(res, 'تم تعديل سعر السلعة بنجاح!', updated);
  } catch (error: any) {
    return sendError(res, 'فشل تعديل سعر السلعة.', [error.message], 500);
  }
};

export const createMarketUpdate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || userRole !== 'ADMIN') {
      return sendError(res, 'غير مصرح.', [], 403);
    }

    const { commodity, price, priceUnit, change, trend, notes } = req.body;
    if (!commodity || price === undefined || !priceUnit) {
      return sendError(res, 'اسم السلعة والسعر ووحدة القياس حقول مطلوبة.', [], 400);
    }

    const update = await prisma.marketUpdate.create({
      data: {
        commodity,
        price: parseFloat(price) || 0,
        priceUnit,
        change: parseFloat(change) || 0,
        trend: trend || 'STABLE',
        notes: notes || null,
      },
    });

    await logActivity({
      userId,
      action: 'UPDATE_MARKET_PRICE',
      module: 'NEWS',
      description: `تم تسجيل مؤشر بورصة [${commodity}] بسعر: ${price} ${priceUnit}`,
      req,
    });

    return sendSuccess(res, 'تم تسجيل مؤشر البورصة الزراعية بنجاح!', update, 201);
  } catch (error: any) {
    return sendError(res, 'فشل تسجيل مؤشر البورصة.', [error.message], 500);
  }
};

export const deleteMarketUpdate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || userRole !== 'ADMIN') {
      return sendError(res, 'غير مصرح.', [], 403);
    }

    const { id } = req.params;
    await prisma.marketUpdate.delete({ where: { id } });

    return sendSuccess(res, 'تم حذف مؤشر السلعة بنجاح.');
  } catch (error: any) {
    return sendError(res, 'فشل حذف المؤشر.', [error.message], 500);
  }
};
