/**
 * Development seed.
 *
 * DIQQAT: subsidiya dasturlari ro'yxati bo'sh. Haqiqiy dasturlar rasmiy
 * hujjat asosida qo'shiladi — to'qib yozilgan ma'lumot bo'lmasin.
 * Ular real normativ hujjat sifatida qabul qilinmasligi kerak — mobil ilova
 * va admin panelda "DEMO" belgisi bilan ko'rsatiladi. Rasmiy shartlar
 * yuristlar tomonidan tasdiqlangach admin panel orqali almashtiriladi.
 */
import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { MARKETPLACES } from '@ecwt/config';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    // Lokal dev bazasi (PGlite) bir vaqtda bitta ulanishni qabul qiladi.
    max: Number(process.env.DATABASE_POOL_MAX ?? 1),
  }),
});

const CRAFTS = [
  { slug: 'kulolchilik', nameUz: 'Kulolchilik', nameRu: 'Гончарное дело', nameEn: 'Pottery', icon: '🏺' },
  { slug: 'zargarlik', nameUz: 'Zargarlik', nameRu: 'Ювелирное дело', nameEn: 'Jewelry', icon: '💍' },
  { slug: 'yogoch-oymakorligi', nameUz: "Yog'och o'ymakorligi", nameRu: 'Резьба по дереву', nameEn: 'Wood carving', icon: '🪵' },
  { slug: 'kashtachilik', nameUz: 'Kashtachilik', nameRu: 'Вышивка', nameEn: 'Embroidery', icon: '🧵' },
  { slug: 'toqimachilik', nameUz: "To'qimachilik", nameRu: 'Ткачество', nameEn: 'Weaving', icon: '🧶' },
  { slug: 'gilamchilik', nameUz: 'Gilamchilik', nameRu: 'Ковроткачество', nameEn: 'Carpet weaving', icon: '🪡' },
  { slug: 'pichoqchilik', nameUz: 'Pichoqchilik', nameRu: 'Ножевое дело', nameEn: 'Knife making', icon: '🔪' },
  { slug: 'misgarlik', nameUz: 'Misgarlik', nameRu: 'Чеканка по меди', nameEn: 'Coppersmithing', icon: '⚒️' },
  { slug: 'miniatyura', nameUz: 'Miniatyura', nameRu: 'Миниатюра', nameEn: 'Miniature', icon: '🖌️' },
  { slug: 'milliy-kiyim', nameUz: 'Milliy kiyim', nameRu: 'Национальная одежда', nameEn: 'National clothing', icon: '👘' },
  { slug: 'charm-mahsulotlari', nameUz: 'Charm mahsulotlari', nameRu: 'Изделия из кожи', nameEn: 'Leather goods', icon: '👜' },
  { slug: 'suvenirlar', nameUz: 'Suvenirlar', nameRu: 'Сувениры', nameEn: 'Souvenirs', icon: '🎁' },
  { slug: 'boshqa', nameUz: 'Boshqa hunar', nameRu: 'Другое', nameEn: 'Other', icon: '🎨' },
];

async function seedCrafts(): Promise<void> {
  for (const [i, c] of CRAFTS.entries()) {
    await prisma.craftCategory.upsert({
      where: { slug: c.slug },
      create: { ...c, order: i },
      update: { nameUz: c.nameUz, nameRu: c.nameRu, nameEn: c.nameEn, icon: c.icon, order: i },
    });
  }
  console.log(`✓ ${CRAFTS.length} ta hunar yo'nalishi`);
}

async function seedMarketplaces(): Promise<void> {
  for (const m of MARKETPLACES) {
    await prisma.marketplace.upsert({
      where: { code: m.code },
      create: { code: m.code, name: m.name, logoEmoji: m.emoji, isMock: true },
      update: { name: m.name, logoEmoji: m.emoji },
    });
  }
  console.log(`✓ ${MARKETPLACES.length} ta marketplace`);
}

async function seedUsers(): Promise<{ demoUserId: string }> {
  const adminPhone = process.env.SEED_ADMIN_PHONE ?? '998900000001';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin12345!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { phone: adminPhone },
    create: { phone: adminPhone, role: 'SUPER_ADMIN', fullName: 'ECWT Administrator', passwordHash },
    update: { role: 'SUPER_ADMIN', passwordHash },
  });

  const reviewerPhone = '998900000002';
  await prisma.user.upsert({
    where: { phone: reviewerPhone },
    create: {
      phone: reviewerPhone,
      role: 'REVIEWER',
      fullName: 'ECWT Ko‘rib chiquvchi',
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
    update: { role: 'REVIEWER' },
  });

  // Demo hunarmand
  const demoPhone = process.env.SEED_DEMO_USER_PHONE ?? '998901234567';
  const demoUser = await prisma.user.upsert({
    where: { phone: demoPhone },
    create: { phone: demoPhone, fullName: 'Asror Test User', role: 'USER' },
    update: { fullName: 'Asror Test User' },
  });

  const kulol = await prisma.craftCategory.findUniqueOrThrow({ where: { slug: 'kulolchilik' } });

  await prisma.artisanProfile.upsert({
    where: { userId: demoUser.id },
    create: {
      userId: demoUser.id,
      firstName: 'Asror',
      lastName: 'Test',
      middleName: 'User',
      birthDate: new Date('1990-05-14'),
      pinfl: '31405900012345',
      region: 'Samarqand',
      district: 'Urgut',
      address: 'Urgut tumani, Hunarmandlar ko‘chasi 12',
      businessType: 'YATT',
      stir: '123456789',
      craftCategoryId: kulol.id,
      yearsOfExperience: 12,
      hasWorkshop: true,
      workshopAddress: 'Urgut, ustaxona 4',
      description: 'An’anaviy Urgut kulolchiligi: idish-tovoq va bezak buyumlari.',
      membershipStatus: 'ACTIVE',
      membershipNumber: 'HUN-2024-00412',
      bankAccount: '20208000900001234567',
      bankMfo: '00491',
      bankHolderName: 'Test Asror User',
      hasApprentice: true,
      apprenticeCount: 2,
      completionPercent: 85,
    },
    update: {},
  });

  console.log(`✓ Foydalanuvchilar: admin(${adminPhone}), reviewer(${reviewerPhone}), demo(${demoPhone})`);
  return { demoUserId: demoUser.id };
}

interface SeedSubsidy {
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  organization: string;
  amountType: 'FIXED' | 'RANGE' | 'PERCENT_OF_EXPENSE' | 'BHM_MULTIPLE';
  minAmount?: number;
  maxAmount?: number;
  amountFactor?: number;
  amountPerApprentice?: boolean;
  processingDays: number;
  requirements: {
    type: string;
    condition: Record<string, unknown>;
    humanReadableText: string;
    fixRoute?: string;
    fixLabel?: string;
  }[];
  documents: { documentType: string; title: string; hint?: string; isOptional?: boolean }[];
}

/**
 * Subsidiya dasturlari ro'yxati.
 *
 * BO'SH — ataylab. Avval bu yerda men to'qib yozgan namunaviy dasturlar
 * turgan edi; ular haqiqiy qonun hujjatidan olinmagani uchun o'chirildi.
 *
 * Haqiqiy dasturlar qo'shilganda ular rasmiy hujjat asosida to'ldiriladi:
 * har bir shart va hujjat talabi manba hujjatga mos kelishi shart.
 */
const SUBSIDIES: SeedSubsidy[] = [];

async function seedSubsidies(): Promise<void> {
  for (const s of SUBSIDIES) {
    const subsidy = await prisma.subsidy.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug,
        title: s.title,
        shortDescription: s.shortDescription,
        fullDescription: s.fullDescription,
        category: s.category,
        organization: s.organization,
        amountType: s.amountType,
        minAmount: s.minAmount ?? null,
        maxAmount: s.maxAmount ?? null,
        amountFactor: s.amountFactor ?? null,
        amountPerApprentice: s.amountPerApprentice ?? false,
        processingDays: s.processingDays,
        status: 'ACTIVE',
        isDemo: true,
        activeFrom: new Date('2026-01-01'),
      },
      update: {
        title: s.title,
        shortDescription: s.shortDescription,
        fullDescription: s.fullDescription,
        status: 'ACTIVE',
        isDemo: true,
      },
    });

    await prisma.subsidyRequirement.deleteMany({ where: { subsidyId: subsidy.id } });
    await prisma.subsidyDocumentRequirement.deleteMany({ where: { subsidyId: subsidy.id } });

    await prisma.subsidyRequirement.createMany({
      data: s.requirements.map((r, i) => ({
        subsidyId: subsidy.id,
        type: r.type as never,
        condition: r.condition as never,
        humanReadableText: r.humanReadableText,
        fixRoute: r.fixRoute ?? null,
        fixLabel: r.fixLabel ?? null,
        order: i,
      })),
    });

    await prisma.subsidyDocumentRequirement.createMany({
      data: s.documents.map((d) => ({
        subsidyId: subsidy.id,
        documentType: d.documentType as never,
        title: d.title,
        hint: d.hint ?? null,
        isOptional: d.isOptional ?? false,
      })),
    });
  }
  if (SUBSIDIES.length === 0) {
    console.log('✓ Subsidiya dasturlari qo‘shilmadi (ro‘yxat bo‘sh)');
    return;
  }
  console.log(`✓ ${SUBSIDIES.length} ta subsidiya dasturi`);
}

/**
 * Productionda parolsiz (standart "Admin12345!" bilan) SUPER_ADMIN
 * yaratilishining oldini oladi. `.env` orqali SEED_ADMIN_PASSWORD
 * o'rnatilmasa — seed butunlay to'xtaydi, standart parol bilan davom etmaydi.
 */
function assertSafeToSeed(): void {
  if (process.env.NODE_ENV !== 'production') return;
  if (!process.env.SEED_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD === 'Admin12345!') {
    throw new Error(
      'Xavfsizlik: productionda SEED_ADMIN_PASSWORD .env orqali (standart bo‘lmagan qiymat bilan) ' +
        'o‘rnatilishi shart. Seed to‘xtatildi.',
    );
  }
  if (!process.env.SEED_DEMO_USER_PHONE) {
    throw new Error(
      'Xavfsizlik: productionda demo hunarmand (sinov ma’lumotlari) yaratilmasligi uchun ' +
        'SEED_DEMO_USER_PHONE ni real qiymat bilan o‘rnating yoki seed skriptini ishlatmang.',
    );
  }
}

async function main(): Promise<void> {
  assertSafeToSeed();
  console.log('ECWT seed boshlandi...\n');
  await seedCrafts();
  await seedMarketplaces();
  const { demoUserId } = await seedUsers();
  await seedSubsidies();

  await prisma.notification.deleteMany({ where: { userId: demoUserId } });
  await prisma.notification.create({
    data: {
      userId: demoUserId,
      type: 'SYSTEM',
      title: 'ECWT ga xush kelibsiz',
      body: 'Profilingizni to‘ldiring va sizga mos davlat yordamlarini ko‘ring.',
      route: '/profile',
    },
  });

  console.log('\nSeed tugadi.');
  console.log(`Admin:  ${process.env.SEED_ADMIN_PHONE ?? '998900000001'} / ${process.env.SEED_ADMIN_PASSWORD ?? 'Admin12345!'}`);
  console.log(`Demo hunarmand: ${process.env.SEED_DEMO_USER_PHONE ?? '998901234567'} (OTP orqali kiradi)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
