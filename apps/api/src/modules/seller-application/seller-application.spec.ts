import { SellerApplicationService } from './seller-application.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { NotificationsService } from '../notifications/notifications.service';

/**
 * Arizaning ikki muhim qoidasi tekshiriladi:
 *  1. anketa yakuni takror chaqirilsa yangi ariza YARATILMAYDI;
 *  2. sotuvga chiqish (`canSell`) faqat APPROVED holatida ochiladi.
 */

const row = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'a1',
  number: 'ECWT-2026-000001',
  status: 'UNDER_REVIEW',
  reviewerNote: null,
  submittedAt: new Date('2026-01-01T00:00:00Z'),
  decidedAt: null,
  events: [],
  ...over,
});

const makeService = (prismaOver: Record<string, unknown>) => {
  const prisma = { sellerApplication: prismaOver } as unknown as PrismaService;
  const notifications = { create: jest.fn().mockResolvedValue(undefined) } as unknown as NotificationsService;
  return { service: new SellerApplicationService(prisma, notifications), notifications };
};

describe('SellerApplicationService', () => {
  it('ariza mavjud bo‘lsa yangisini yaratmaydi', async () => {
    const create = jest.fn();
    const { service, notifications } = makeService({
      findUnique: jest.fn().mockResolvedValue(row()),
      create,
    });

    const dto = await service.createOnOnboardingCompleted('u1');

    expect(create).not.toHaveBeenCalled();
    expect(dto.number).toBe('ECWT-2026-000001');
    // Takroriy bildirishnoma ham yubormaymiz
    expect((notifications.create as jest.Mock)).not.toHaveBeenCalled();
  });

  it('ariza yo‘q bo‘lsa yaratadi va bildirishnoma yuboradi', async () => {
    const { service, notifications } = makeService({
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(row()),
    });

    const dto = await service.createOnOnboardingCompleted('u1');

    expect(dto.status).toBe('UNDER_REVIEW');
    expect((notifications.create as jest.Mock)).toHaveBeenCalledTimes(1);
  });

  it('bildirishnoma yiqilsa ham ariza qaytariladi', async () => {
    const prisma = {
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(row()),
    };
    const notifications = {
      create: jest.fn().mockRejectedValue(new Error('push o‘chiq')),
    } as unknown as NotificationsService;
    const service = new SellerApplicationService(
      { sellerApplication: prisma } as unknown as PrismaService,
      notifications,
    );

    await expect(service.createOnOnboardingCompleted('u1')).resolves.toMatchObject({
      number: 'ECWT-2026-000001',
    });
  });

  it('canSell faqat APPROVED holatida ochiq', async () => {
    for (const [status, expected] of [
      ['UNDER_REVIEW', false],
      ['MORE_INFO_NEEDED', false],
      ['REJECTED', false],
      ['APPROVED', true],
    ] as const) {
      const { service } = makeService({
        findUnique: jest.fn().mockResolvedValue(row({ status })),
      });
      const dto = await service.findMine('u1');
      expect(dto?.canSell).toBe(expected);
    }
  });

  it('MORE_INFO_NEEDED yakuniy qaror emas — decidedAt to‘ldirilmaydi', async () => {
    const update = jest.fn().mockResolvedValue(row({ status: 'MORE_INFO_NEEDED' }));
    const { service } = makeService({
      findUnique: jest.fn().mockResolvedValue({ userId: 'u1' }),
      update,
    });

    await service.decide('a1', 'MORE_INFO_NEEDED', 'Pasport rasmi aniq emas', 'op1');

    expect(update.mock.calls[0][0].data.decidedAt).toBeNull();
  });
});
