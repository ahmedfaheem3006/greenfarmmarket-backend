import { PrismaClient, Role, AreaUnit, ProductStatus, TransportTier, TransportStatus, JobType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Green Farm Market database...');

  // 1. Password Hashes
  const passwordHash = await bcrypt.hash('12345678', 10);

  // 2. Demo Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@greenfarm.com' },
    update: {},
    create: {
      name: 'م. أحمد زكي (المدير)',
      email: 'admin@greenfarm.com',
      phone: '01012345678',
      passwordHash,
      role: Role.ADMIN,
      governorate: 'بني سويف',
      city: 'الواسطى',
    },
  });

  const farmerUser = await prisma.user.upsert({
    where: { email: 'farmer@greenfarm.com' },
    update: {},
    create: {
      name: 'الحاج محمود عبد الستار',
      email: 'farmer@greenfarm.com',
      phone: '01122334455',
      passwordHash,
      role: Role.FARM_OWNER,
      governorate: 'البحيرة',
      city: 'النوبارية',
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@greenfarm.com' },
    update: {},
    create: {
      name: 'كابتن حسن الصاوي',
      email: 'driver@greenfarm.com',
      phone: '01234567890',
      passwordHash,
      role: Role.DRIVER,
      governorate: 'الشرقية',
      city: 'الزقازيق',
    },
  });

  // 3. Demo Farm
  await prisma.farm.create({
    data: {
      userId: farmerUser.id,
      name: 'مزرعة النور للموالح والتسمين',
      governorate: 'البحيرة',
      city: 'النوبارية',
      area: 25,
      areaUnit: AreaUnit.FEDDAN,
      mainCrops: 'مانجو كيت، برتقال صيفي',
      animalType: 'عجول سيمينتال',
      animalCount: 40,
      notes: 'مزرعة مجهزة بنظام ري بالتنقيط حديث وشبكة طاقة شمسية',
    },
  });

  // 4. Categories
  const categories = [
    { name: 'المواشي والإنتاج الحيواني', slug: 'livestock' },
    { name: 'الأشجار والشتلات', slug: 'trees' },
    { name: 'الخضروات والفاكهة', slug: 'crops' },
    { name: 'منتجات الألبان', slug: 'dairy' },
    { name: 'قطع غيار المزارع (كهرباء ومياه)', slug: 'spare_parts' },
    { name: 'البذور والأسمدة', slug: 'fertilizers' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug, type: 'MARKETPLACE' },
    });
  }

  const livestockCat = await prisma.category.findUnique({ where: { slug: 'livestock' } });
  const treesCat = await prisma.category.findUnique({ where: { slug: 'trees' } });
  const sparePartsCat = await prisma.category.findUnique({ where: { slug: 'spare_parts' } });
  const cropsCat = await prisma.category.findUnique({ where: { slug: 'crops' } });

  // 5. Demo Products
  if (livestockCat && treesCat && sparePartsCat && cropsCat) {
    await prisma.product.createMany({
      data: [
        {
          sellerId: farmerUser.id,
          title: 'عجول تسمين سيمينتال ممتاز معتمدة',
          description: 'عجول تسمين صحية محصنة بجميع اللقاحات، وزن متوسط 350 كجم، جاهزة للتربية أو الذبح.',
          categorySlug: 'livestock',
          categoryId: livestockCat.id,
          price: 45000,
          priceUnit: 'ج.م / رأس',
          governorate: 'البحيرة',
          city: 'النوبارية',
          quantity: 10,
          condition: 'ممتاز',
          images: ['https://images.unsplash.com/photo-1546445317-29f4545f9d52?w=600&auto=format&fit=crop'],
          status: ProductStatus.ACTIVE,
        },
        {
          sellerId: farmerUser.id,
          title: 'شتلات مانجو كيت إسباني معتمدة',
          description: 'شتلات طعم على أصل سكري، خالية من النيماتودا ومفحوصة بواسطة الحجر الزراعي.',
          categorySlug: 'trees',
          categoryId: treesCat.id,
          price: 65,
          priceUnit: 'ج.م / شتلة',
          governorate: 'الإسماعيلية',
          city: 'أبو صوير',
          quantity: 500,
          condition: 'جديد',
          images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop'],
          status: ProductStatus.ACTIVE,
        },
        {
          sellerId: farmerUser.id,
          title: 'طلمبة ري اعماق غاطسة 10 حصان',
          description: 'طلمبة غاطسة استعمال خفيف بحالة الفابريكة مع اللوحة الكهربائية والحماية.',
          categorySlug: 'spare_parts',
          categoryId: sparePartsCat.id,
          price: 18000,
          priceUnit: 'ج.م',
          governorate: 'الشرقية',
          city: 'الزقازيق',
          quantity: 1,
          condition: 'مستعمل بحالة ممتازة',
          images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'],
          status: ProductStatus.ACTIVE,
        },
        {
          sellerId: farmerUser.id,
          title: 'طماطم اورجانيك نخب أول جامبو',
          description: 'محصول طماطم حقل مكشوف عالي الجودة خالي من المتبقيات الكيماوية.',
          categorySlug: 'crops',
          categoryId: cropsCat.id,
          price: 12000,
          priceUnit: 'ج.م / طن',
          governorate: 'بني سويف',
          city: 'الواسطى',
          quantity: 15,
          condition: 'طازج',
          images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop'],
          status: ProductStatus.ACTIVE,
        },
      ],
    });
  }

  // 6. Transport Offers
  await prisma.transportOffer.create({
    data: {
      driverId: driverUser.id,
      vehicleType: 'جامبو 7 متر مجهزة للمواشي والمحاصيل',
      originGov: 'بني سويف',
      destGov: 'القاهرة والجيزة',
      capacityTons: 5.5,
      tripDate: 'يومياً',
      contactPhone: '01234567890',
    },
  });

  // 7. Demo Jobs
  await prisma.job.createMany({
    data: [
      {
        publisherId: farmerUser.id,
        type: JobType.HIRING,
        title: 'مطلوب مهندس زراعي خبرة شبكات ري حديثة',
        description: 'مطلوب مهندس زراعي متخصص لإدارة شبكات الري بالتنقيط ومتابعة برامج التسميد لـ 25 فدان.',
        roleCategory: 'مهندس زراعي',
        governorate: 'البحيرة',
        salaryRange: '8,000 - 10,000 ج.م',
        experienceYears: '3 - 5 سنوات',
        contactPhone: '01122334455',
      },
      {
        publisherId: farmerUser.id,
        type: JobType.SEEKING,
        title: 'فني تشغيل طلمبات وطاقة شمسية يبحث عن عمل',
        description: 'فني صيانة وتشغيل محطات الطاقة الشمسية وطلمبات الأعماق يبحث عن فرصة عمل بمزارع وجه بحري.',
        roleCategory: 'فني تشغيل',
        governorate: 'الفيوم',
        salaryRange: 'حسب الاتفاق',
        experienceYears: '7 سنوات',
        contactPhone: '01099887766',
      },
    ],
  });

  // 8. Demo News Articles
  await prisma.article.createMany({
    data: [
      {
        title: 'توصيات رسمية لرفع كفاءة التحويل الغذائي في عجول التسمين صيفاً',
        category: 'تسمين المواشي',
        summary: 'إرشادات زراعية وبيطرية لتقليل تأثير الإجهاد الحراري وزيادة النمو اليومي بمعدل 200 جرام.',
        content: 'نشرت وزارة الزراعة إرشادات جديدة تتضمن إضافة مضادات الأكسدة وفيتامين C لمياه الشرب لتقليل الإجهاد الحراري وزيادة معدل النمو بمقدار 200 جرام يومياً وتعديل مواعيد التغذية للساعات الباردة.',
        imageUrl: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&auto=format&fit=crop',
      },
      {
        title: 'أهمية زراعة مصدات الرياح من أشجار الكافور والكازوارينا حول المزارع',
        category: 'فوائد الأشجار',
        summary: 'كيف تساهم مصدات الرياح في تنقية الهواء وتقليل تبخر المياه وحماية الأزهار.',
        content: 'تساعد مصدات الرياح في تنقية الهواء وتقليل تبخر المياه من التربة بنسبة تصل إلى 25%، مما يساهم في حماية الأزهار والمحاصيل من السقوط المباشر وزيادة إنتاجية الفدان.',
        imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop',
      },
    ],
  });

  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
