/**
 * FAQAT DEMO UCHUN: to'lovni tasdiqlangan holatga o'tkazadi.
 * Haqiqiy jarayonda buni administrator chekni ko'rib chiqib bajaradi.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.findFirst({ where: { phone: { contains: '911112233' } } });
  if (!user) throw new Error('Foydalanuvchi topilmadi');

  const updated = await prisma.servicePayment.update({
    where: { userId: user.id },
    data: { status: 'CONFIRMED', confirmedAt: new Date() },
  });
  console.log('tolov holati:', updated.status);
  await prisma.$disconnect();
}

void main();
