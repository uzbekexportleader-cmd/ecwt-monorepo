/**
 * To'qib yozilgan DEMO subsidiya dasturlarini bazadan o'chiradi.
 *
 * Ular haqiqiy qonun hujjatidan olinmagan edi, shu sababli ilovada
 * ko'rinmasligi kerak. Shartlar, hujjat talablari va ularga berilgan
 * arizalar Prisma sxemasidagi `onDelete: Cascade` orqali birga ketadi.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DATABASE_POOL_MAX ?? 1),
});
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const demo = await prisma.subsidy.findMany({
    where: { isDemo: true },
    select: { id: true, title: true },
  });

  if (demo.length === 0) {
    console.log('Demo subsidiya topilmadi — baza allaqachon toza.');
    return;
  }

  for (const s of demo) console.log(`  o'chirilmoqda: ${s.title}`);

  const applications = await prisma.subsidyApplication.count({
    where: { subsidyId: { in: demo.map((s) => s.id) } },
  });
  const { count } = await prisma.subsidy.deleteMany({ where: { isDemo: true } });

  console.log(`\n✓ ${count} ta demo subsidiya o‘chirildi (${applications} ta bog‘liq ariza bilan)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
