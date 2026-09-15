import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { SellerApplicationDto, SellerApplicationStatus } from '@ecwt/types';

import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/** Ariza raqami: ECWT-2026-000123 */
const NUMBER_PREFIX = 'ECWT';

/**
 * Raqam band bo'lib qolsa shuncha marta qayta uriniladi.
 *
 * Ikki hunarmand bir vaqtda anketani tugatsa, ikkalasi ham bir xil tartib
 * raqamini hisoblab qolishi mumkin. Bazadagi unikal cheklov buni ushlaydi,
 * biz esa keyingi raqamni olamiz.
 */
const NUMBER_RETRIES = 5;

/** Foydalanuvchiga ko'rinadigan holat nomlari (bildirishnoma matni uchun) */
const STATUS_TITLE: Record<SellerApplicationStatus, string> = {
  UNDER_REVIEW: 'Arizangiz ko‘rib chiqilmoqda',
  MORE_INFO_NEEDED: 'Arizangiz uchun qo‘shimcha ma’lumot kerak',
  APPROVED: 'Arizangiz tasdiqlandi',
  REJECTED: 'Arizangiz rad etildi',
};

@Injectable()
export class SellerApplicationService {
  private readonly logger = new Logger(SellerApplicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Anketa tugaganda arizani yaratadi (yoki mavjudini qaytaradi).
   *
   * IDEMPOTENT: qayta chaqirilsa yangi ariza yaratmaydi. Anketa yakuni
   * bir necha marta chaqirilishi mumkin (tarmoq uzilishi, qayta urinish) —
   * har safar yangi ariza raqami berilsa foydalanuvchi chalkashib ketardi.
   */
  async createOnOnboardingCompleted(userId: string): Promise<SellerApplicationDto> {
    const existing = await this.prisma.sellerApplication.findUnique({
      where: { userId },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    if (existing) return this.toDto(existing);

    const created = await this.createWithNumber(userId);

    await this.notifications
      .create({
        userId,
        type: 'APPLICATION_SUBMITTED',
        title: STATUS_TITLE.UNDER_REVIEW,
        body: `Ariza raqami: ${created.number}. Holatini kabinetingizdan kuzating.`,
        route: '/application',
      })
      .catch((err: Error) => this.logger.warn(`Bildirishnoma: ${err.message}`));

    return this.toDto(created);
  }

  /** Raqam to'qnashuvida keyingisini oladi */
  private async createWithNumber(userId: string) {
    const year = new Date().getFullYear();

    for (let attempt = 0; attempt < NUMBER_RETRIES; attempt++) {
      const count = await this.prisma.sellerApplication.count();
      const number = `${NUMBER_PREFIX}-${year}-${String(count + 1 + attempt).padStart(6, '0')}`;

      try {
        return await this.prisma.sellerApplication.create({
          data: {
            userId,
            number,
            status: 'UNDER_REVIEW',
            events: { create: { status: 'UNDER_REVIEW', note: 'Ariza topshirildi' } },
          },
          include: { events: { orderBy: { createdAt: 'asc' } } },
        });
      } catch (err) {
        // Raqam band bo'lsa keyingisini sinaymiz; boshqa xato yuqoriga ketadi
        const isUniqueViolation =
          typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
        if (!isUniqueViolation || attempt === NUMBER_RETRIES - 1) throw err;
      }
    }

    // Bu yerga yetib bo'lmaydi — tsikl yo qaytaradi, yo otadi
    throw new Error('Ariza raqamini yaratib bo‘lmadi');
  }

  /** Hunarmandning o'z arizasi. Anketa tugamagan bo'lsa `null`. */
  async findMine(userId: string): Promise<SellerApplicationDto | null> {
    const application = await this.prisma.sellerApplication.findUnique({
      where: { userId },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    return application ? this.toDto(application) : null;
  }

  /**
   * Operator qarori.
   *
   * `decidedAt` faqat YAKUNIY holatlarda to'ldiriladi: "qo'shimcha ma'lumot
   * kerak" — bu qaror emas, jarayonning davomi.
   */
  async decide(
    applicationId: string,
    status: SellerApplicationStatus,
    note: string | null,
    actorId: string,
  ): Promise<SellerApplicationDto> {
    const application = await this.prisma.sellerApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) throw new NotFoundException('Ariza topilmadi');

    const isFinal = status === 'APPROVED' || status === 'REJECTED';

    const updated = await this.prisma.sellerApplication.update({
      where: { id: applicationId },
      data: {
        status,
        reviewerNote: note,
        decidedAt: isFinal ? new Date() : null,
        events: { create: { status, note, actorId } },
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });

    await this.notifications
      .create({
        userId: application.userId,
        type: status === 'APPROVED' ? 'APPROVED' : status === 'REJECTED' ? 'REJECTED' : 'CORRECTION_REQUIRED',
        title: STATUS_TITLE[status],
        body: note ?? `Ariza ${updated.number} holati yangilandi.`,
        route: '/application',
      })
      .catch((err: Error) => this.logger.warn(`Bildirishnoma: ${err.message}`));

    return this.toDto(updated);
  }

  /** Operator ro'yxati */
  async list(status?: SellerApplicationStatus) {
    const rows = await this.prisma.sellerApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { submittedAt: 'desc' },
      take: 200,
      include: {
        events: { orderBy: { createdAt: 'asc' } },
        user: { select: { phone: true, fullName: true } },
      },
    });
    return rows.map((r) => ({
      ...this.toDto(r),
      phone: r.user.phone,
      fullName: r.user.fullName,
    }));
  }

  private toDto(row: {
    id: string;
    number: string;
    status: SellerApplicationStatus;
    reviewerNote: string | null;
    submittedAt: Date;
    decidedAt: Date | null;
    events: { status: SellerApplicationStatus; note: string | null; createdAt: Date }[];
  }): SellerApplicationDto {
    return {
      id: row.id,
      number: row.number,
      status: row.status,
      reviewerNote: row.reviewerNote,
      submittedAt: row.submittedAt.toISOString(),
      decidedAt: row.decidedAt?.toISOString() ?? null,
      history: row.events.map((e) => ({
        status: e.status,
        note: e.note,
        createdAt: e.createdAt.toISOString(),
      })),
      /*
       * Sotuvga chiqarish va pul olish huquqi FAQAT tasdiqlangandan keyin.
       * Qoidani backend hisoblaydi — mobil ilova holatdan o'zi xulosa
       * chiqarsa, qoida ikki joyda takrorlanadi va vaqt o'tib farq qiladi.
       */
      canSell: row.status === 'APPROVED',
    };
  }
}
