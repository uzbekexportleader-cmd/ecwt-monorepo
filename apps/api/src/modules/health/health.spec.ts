import { ServiceUnavailableException } from '@nestjs/common';

import { HealthController } from './health.controller';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * Health-check ikkala holatda ham to'g'ri javob berishi kerak.
 *
 * Doim `ok` qaytaradigan tekshiruv umuman yo'qidan ham yomon: baza uzilgan
 * bo'lsa ham server tashqaridan sog'lom ko'rinadi va kuzatuv tizimi
 * ogohlantirmaydi — aslida esa hech bir hunarmand tizimga kira olmaydi.
 */
describe('Health-check', () => {
  it('baza javob bersa — ok qaytaradi', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    const controller = new HealthController(prisma as unknown as PrismaService);

    const result = await controller.check();

    expect(result.ok).toBe(true);
    expect(result.database).toBe('up');
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('baza javob bermasa — 503 bilan to‘xtaydi', async () => {
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error('connection refused')) };
    const controller = new HealthController(prisma as unknown as PrismaService);

    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('xato tafsiloti tashqariga chiqarilmaydi', async () => {
    const secret = 'postgresql://admin:PAROL123@10.0.0.5:5432/prod';
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error(secret)) };
    const controller = new HealthController(prisma as unknown as PrismaService);

    await expect(controller.check()).rejects.not.toThrow(new RegExp('PAROL123'));
  });
});
