/**
 * Boshlang'ich ma'lumotlar.
 *
 * Ishga tushirish:  pnpm db:seed
 *
 * Skript IDEMPOTENT — bir necha marta ishga tushirsa ham nusxa yaratmaydi.
 */
import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

const ARGON_OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

/** ECWT faoliyati uchun asosiy kategoriyalar */
const CATEGORIES = [
  { slug: 'tekstil', nameUz: 'Tekstil va kiyim', nameRu: 'Текстиль и одежда', nameEn: 'Textile & Apparel' },
  { slug: 'gilam', nameUz: 'Gilam va to‘qimachilik', nameRu: 'Ковры', nameEn: 'Carpets & Rugs' },
  { slug: 'hunarmandchilik', nameUz: 'Hunarmandchilik', nameRu: 'Ремесленные изделия', nameEn: 'Handicrafts' },
  { slug: 'oziq-ovqat', nameUz: 'Oziq-ovqat', nameRu: 'Продукты питания', nameEn: 'Food Products' },
  { slug: 'quruq-meva', nameUz: 'Quruq meva va yong‘oq', nameRu: 'Сухофрукты и орехи', nameEn: 'Dried Fruits & Nuts' },
  { slug: 'kosmetika', nameUz: 'Kosmetika va parvarish', nameRu: 'Косметика', nameEn: 'Cosmetics & Personal Care' },
  { slug: 'charm', nameUz: 'Charm mahsulotlari', nameRu: 'Кожаные изделия', nameEn: 'Leather Goods' },
  { slug: 'seramika', nameUz: 'Keramika va idish', nameRu: 'Керамика', nameEn: 'Ceramics & Tableware' },
  { slug: 'mebel', nameUz: 'Mebel va uy jihozlari', nameRu: 'Мебель', nameEn: 'Furniture & Home Decor' },
  { slug: 'boshqa', nameUz: 'Boshqa', nameRu: 'Другое', nameEn: 'Other' },
];

async function main(): Promise<void> {
  // Emoji ishlatilmaydi — Windows konsolida buzilib chiqadi
  console.log('[SEED] Boshlang‘ich ma’lumotlar yuklanmoqda...\n');

  // --- Kategoriyalar -------------------------------------------------------
  for (const [index, category] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { nameUz: category.nameUz, nameRu: category.nameRu, nameEn: category.nameEn },
      create: { ...category, sortOrder: index },
    });
  }
  console.log(`[OK] ${CATEGORIES.length} ta kategoriya tayyor`);

  // --- Admin ---------------------------------------------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@ecwt.uz';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminPassword) {
    console.log(
      '\n[DIQQAT] SEED_ADMIN_PASSWORD berilmagan — admin yaratilmadi.\n' +
        '   Admin yaratish uchun:\n' +
        '   $env:SEED_ADMIN_PASSWORD="kuchli-parol-123"; pnpm db:seed\n',
    );
  } else {
    if (adminPassword.length < 12) {
      throw new Error('SEED_ADMIN_PASSWORD kamida 12 ta belgidan iborat bo‘lsin');
    }

    const passwordHash = await hash(adminPassword, ARGON_OPTIONS);

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: 'ADMIN', status: 'ACTIVE', passwordHash },
      create: {
        email: adminEmail,
        fullName: 'ECWT Administrator',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        locale: 'uz',
        emailVerifiedAt: new Date(),
      },
    });

    console.log(`[OK] Admin tayyor: ${adminEmail}`);
  }

  // --- Namuna hamkor (faqat development) -----------------------------------
  if (process.env.NODE_ENV !== 'production' && process.env.SEED_DEMO === '1') {
    await seedDemoSupplier();
  }

  console.log('\n[TAYYOR] Boshlang‘ich ma’lumotlar yuklandi.\n');
}

async function seedDemoSupplier(): Promise<void> {
  const demoEmail = 'demo@ecwt.uz';
  const passwordHash = await hash('demo12345', ARGON_OPTIONS);

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      phone: '+998901234567',
      fullName: 'Demo Hamkor',
      passwordHash,
      role: 'SUPPLIER',
      status: 'ACTIVE',
      locale: 'uz',
      supplier: {
        create: {
          companyName: 'Demo Textile MChJ',
          legalName: '"DEMO TEXTILE" MAS’ULIYATI CHEKLANGAN JAMIYATI',
          stir: '123456789',
          region: 'TOSHKENT_SHAHRI',
          district: 'Yunusobod',
          address: 'Toshkent sh., Yunusobod t., Amir Temur ko‘chasi 1',
          contactPhone: '+998901234567',
          contactEmail: demoEmail,
          bankName: 'Ipoteka Bank',
          bankAccount: '20208000000000000001',
          mfo: '00443',
          monthlyCapacity: 5000,
          status: 'VERIFIED',
          verifiedAt: new Date(),
        },
      },
    },
    include: { supplier: true },
  });

  const supplierId = user.supplier?.id;
  if (!supplierId) return;

  const category = await prisma.category.findUnique({ where: { slug: 'tekstil' } });

  await prisma.product.upsert({
    where: { supplierId_sku: { supplierId, sku: 'DEMO-TS-001' } },
    update: {},
    create: {
      supplierId,
      categoryId: category?.id ?? null,
      sku: 'DEMO-TS-001',
      nameUz: 'Paxta futbolka, oq',
      nameRu: 'Хлопковая футболка, белая',
      nameEn: '100% Cotton T-Shirt, White',
      descriptionUz: 'O‘zbekiston paxtasidan tikilgan, 180 g/m² zichlikdagi futbolka.',
      descriptionEn:
        'Premium t-shirt made from 100% Uzbek cotton, 180 gsm. Pre-shrunk, OEKO-TEX certified.',
      brand: 'Demo Textile',
      hsCode: '610910',
      basePriceUzs: 45000,
      suggestedPriceUsd: 12.99,
      moq: 100,
      stock: 5000,
      weightGrams: 180,
      status: 'APPROVED',
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
            sortOrder: 0,
            isPrimary: true,
          },
        ],
      },
    },
  });

  console.log(`[OK] Demo hamkor tayyor: ${demoEmail} / demo12345`);
}

main()
  .catch((error: unknown) => {
    console.error('\n[XATO] Seed bajarilmadi:', error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
