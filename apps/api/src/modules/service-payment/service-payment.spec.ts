import { ServicePaymentService } from './service-payment.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { NotificationsService } from '../notifications/notifications.service';
import type { AuditService } from '../../common/audit/audit.service';

/**
 * Darvozaning ikki qoidasi:
 *  1. bo'limlar FAQAT `CONFIRMED` holatida ochiladi;
 *  2. `CONFIRMED` ga o'tish faqat yuborilgan hujjat ustidan bo'ladi —
 *     "hujjat yo'q" holatida operator ham tasdiqlay olmaydi.
 */

const makeService = (payment: Record<string, unknown>) => {
  const prisma = {
    servicePayment: payment,
    document: { findFirst: jest.fn().mockResolvedValue({ id: 'doc1' }) },
    companyInfo: { findUnique: jest.fn().mockResolvedValue(null) },
  } as unknown as PrismaService;

  const notifications = { create: jest.fn().mockResolvedValue(undefined) } as unknown as NotificationsService;
  const audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;

  return new ServicePaymentService(prisma, notifications, audit);
};

const row = (over: Record<string, unknown> = {}) => ({
  id: 'p1',
  status: 'AWAITING_TRANSFER',
  declaredAmount: null,
  note: null,
  reviewerNote: null,
  submittedAt: null,
  confirmedAt: null,
  receiptDocumentId: null,
  events: [],
  ...over,
});

describe('ServicePaymentService', () => {
  it('bo‘limlar faqat CONFIRMED holatida ochiq', async () => {
    for (const [status, expected] of [
      ['AWAITING_SUBSIDY', false],
      ['AWAITING_TRANSFER', false],
      ['PROOF_SUBMITTED', false],
      ['REJECTED', false],
      ['CONFIRMED', true],
    ] as const) {
      const service = makeService({ findUnique: jest.fn().mockResolvedValue({ status }) });
      await expect(service.isUnlocked('u1')).resolves.toBe(expected);
    }
  });

  it('yozuv umuman bo‘lmasa ham yopiq', async () => {
    const service = makeService({ findUnique: jest.fn().mockResolvedValue(null) });
    await expect(service.isUnlocked('u1')).resolves.toBe(false);
  });

  it('hujjat yuborilmagan bo‘lsa operator tasdiqlay olmaydi', async () => {
    const service = makeService({
      findUnique: jest.fn().mockResolvedValue(row({ status: 'AWAITING_TRANSFER' })),
      update: jest.fn(),
    });

    await expect(service.decide('u1', 'CONFIRMED', null, 'admin1')).rejects.toThrow();
  });

  it('tasdiqlangandan keyin qayta hujjat yuborilmaydi', async () => {
    const service = makeService({
      findUnique: jest.fn().mockResolvedValue(row({ status: 'CONFIRMED' })),
      update: jest.fn(),
    });

    await expect(service.submitProof('u1', 'doc1', 5_000_000, null)).rejects.toThrow();
  });

  it('subsidiya kelgani "to‘landi" degani emas', async () => {
    const update = jest.fn().mockResolvedValue(row({ status: 'AWAITING_TRANSFER' }));
    const service = makeService({
      findUnique: jest.fn().mockResolvedValue(row({ status: 'AWAITING_SUBSIDY' })),
      update,
    });

    const dto = await service.markSubsidyArrived('u1', null);

    expect(dto.status).toBe('AWAITING_TRANSFER');
    expect(dto.unlocked).toBe(false);
  });
});
