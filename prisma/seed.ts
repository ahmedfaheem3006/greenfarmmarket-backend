import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding system categories and admin user...');

  // 1. Password Hash for Exclusive System Admin
  const passwordHash = await bcrypt.hash('ahmed.admin@gmail.com', 10);

  // 2. Exclusive System Admin User
  await prisma.user.upsert({
    where: { email: 'ahmed.admin@gmail.com' },
    update: {
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      name: 'Ahmed Admin',
      email: 'ahmed.admin@gmail.com',
      phone: '01099856661',
      passwordHash,
      role: Role.ADMIN,
      governorate: 'القاهرة',
      city: 'العاصمة الإدارية',
    },
  });

  // 3. Official Marketplace & Service Categories (Required for database relations)
  const categories = [
    { name: 'المواشي والإنتاج الحيواني', slug: 'livestock' },
    { name: 'الأشجار والشتلات', slug: 'trees' },
    { name: 'الخضروات والفاكهة', slug: 'crops' },
    { name: 'منتجات الألبان', slug: 'dairy' },
    { name: 'المعدات والجرارات', slug: 'equipment' },
    { name: 'أنظمة وطلمبات الري', slug: 'spare_parts' },
    { name: 'البذور والأسمدة والمبيدات', slug: 'fertilizers' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug, type: 'MARKETPLACE' },
    });
  }

  console.log('Clean system seeding completed successfully (0 mock items created).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
