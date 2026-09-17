import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ServicePaymentDto, ServicePaymentStatus } from '@ecwt/types';

import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../../common/audit/audit.service';

/**
 * ECWT xizmat to'lovi.
 *
 * Yo'l: subsidiya bank hisobiga tushadi → hunarmand kelishilgan summani
 * ECWT hisobiga o'tkazadi → o'tkazma hujjatini yuklaydi → operator
 * tekshiradi → savdo bo'limlari ochiladi.
 *
 * ENG MUHIM QOIDA: `CONFIRMED` holatini FAQAT operator qo'yadi va faqat
 * yuklangan hujjatni ko'rgandan keyin. Foydalanuvchi ham, ilova ham bu
 * holatga o'tkaza olmaydi — aks holda "to'landi" yozuvi hech narsani
 * anglatmaydi va pul kelmagan holda bo'limlar ochilib ketadi.
 */

const STATUS_TITLE: Record<ServicePaymentStatus, string> = {
  AWAITING_SUBSIDY: 'Subsidiya kutilmoqda',
  AWAITING_TRANSFER: 'O‘tkazma kutilmoqda',
  PROOF_SUBMITTED: 'To‘lov hujjati tekshirilmoqda',
  CONFIRMED: 'To‘lov tasdiqlandi',
  REJECTED: 'To‘lov hujjati qabul qilinmadi',
};

type PaymentRow = {
  id: string;
  status: ServicePaymentStatus;
  declaredAmount: number | null;
  note: string | null;
  reviewerNote: string | null;
  submittedAt: Date | null;
  confirmedAt: Date | null;
  receiptDocumentId: string | null;
  events?: { status: ServicePaymentStatus; note: string | null; createdAt: Date }[];
};

@Injectable()
export class ServicePaymentService {
  private readonly logger = new Logger(ServicePaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Savdo bo'limlari ochiqmi.
   *
   * Boshqa modullar shu metoddan foydalanadi — qoida bitta joyda tursin.
   */
  async isUnlocked(userId: string): Promise<boolean> {
    const row = await this.prisma.servicePayment.findUnique({
      where: { userId },
      select: { status: true },
    });
    return row?.status === 'CONFIRMED';
  }

  /** Yozuv bo'lmasa yaratiladi */
  private async ensure(userId: string) {
    const existing = await this.prisma.servicePayment.findUnique({
      where: { userId },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    if (existing) return existing;

    /*
     * Boshlang'ich holat TO'LOV YO'LIGA bog'liq.
     *
     * "O'zim to'layman" degan tadbirkor subsidiya OLMAYDI — unga
     * "Subsidiya kutilmoqda" deb yozish va "Subsidiya keldi" tugmasini
     * ko'rsatish xato bo'lardi: u kutadigan hech narsa yo'q. Unga
     * rekvizitlar darhol ko'rsatiladi.
     */
    const profile = await this.prisma.artisanProfile.findUnique({
      where: { userId },
      select: { paymentMethod: true },
    });
    const selfPaid = profile?.paymentMethod === 'SELF';

    await this.prisma.servicePayment.create({
      data: {
        userId,
        status: selfPaid ? 'AWAITING_TRANSFER' : 'AWAITING_SUBSIDY',
        events: {
          create: {
            status: selfPaid ? 'AWAITING_TRANSFER' : 'AWAITING_SUBSIDY',
            note: selfPaid ? 'Xizmat haqini o‘zi to‘laydi' : 'Subsidiya kutilmoqda',
          },
        },
      },
    });
    return this.prisma.servicePayment.findUniqueOrThrow({
      where: { userId },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async getMine(userId: string): Promise<ServicePaymentDto> {
    const row = await this.ensure(userId);
    return this.toDto(row);
  }

  /**
   * Hunarmand subsidiya kelganini bildiradi.
   *
   * Bu "to'landi" degani EMAS — shundan keyin o'tkazma kutiladi va
   * rekvizitlar ko'rsatiladi.
   */
  async markSubsidyArrived(userId: string, note: string | null): Promise<ServicePaymentDto> {
    const row = await this.ensure(userId);
    if (row.status === 'CONFIRMED') return this.toDto(row);

    const updated = await this.prisma.servicePayment.update({
      where: { userId },
      data: {
        status: 'AWAITING_TRANSFER',
        note,
        events: { create: { status: 'AWAITING_TRANSFER', note: note ?? 'Subsidiya keldi' } },
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    return this.toDto(updated);
  }

  /** O'tkazma hujjatini yuborish */
  async submitProof(
    userId: string,
    documentId: string,
    amount: number,
    note: string | null,
  ): Promise<ServicePaymentDto> {
    const row = await this.ensure(userId);
    if (row.status === 'CONFIRMED') {
      throw new BadRequestException('To‘lov allaqachon tasdiqlangan');
    }

    // Hujjat shu foydalanuvchiga tegishli bo'lishi shart
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
      select: { id: true },
    });
    if (!document) throw new NotFoundException('Hujjat topilmadi');

    const updated = await this.prisma.servicePayment.update({
      where: { userId },
      data: {
        status: 'PROOF_SUBMITTED',
        receiptDocumentId: documentId,
        declaredAmount: amount,
        note,
        submittedAt: new Date(),
        reviewerNote: null,
        events: { create: { status: 'PROOF_SUBMITTED', note: note ?? 'Hujjat yuborildi' } },
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });

    await this.audit.record({
      actorId: userId,
      action: 'service-payment.proof',
      entity: 'ServicePayment',
      entityId: row.id,
      metadata: { amount },
    });

    return this.toDto(updated);
  }

  /**
   * Operator qarori — yagona joy, bu yerdan boshqa `CONFIRMED` bo'lmaydi.
   */
  async decide(
    userId: string,
    decision: 'CONFIRMED' | 'REJECTED',
    note: string | null,
    actorId: string,
  ): Promise<ServicePaymentDto> {
    const row = await this.prisma.servicePayment.findUnique({ where: { userId } });
    if (!row) throw new NotFoundException('To‘lov yozuvi topilmadi');
    if (row.status !== 'PROOF_SUBMITTED') {
      throw new BadRequestException('Tekshiriladigan hujjat yo‘q');
    }

    const updated = await this.prisma.servicePayment.update({
      where: { userId },
      data: {
        status: decision,
        reviewerNote: note,
        confirmedById: decision === 'CONFIRMED' ? actorId : null,
        confirmedAt: decision === 'CONFIRMED' ? new Date() : null,
        events: { create: { status: decision, note, actorId } },
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });

    await this.notifications
      .create({
        userId,
        type: decision === 'CONFIRMED' ? 'APPROVED' : 'CORRECTION_REQUIRED',
        title: STATUS_TITLE[decision],
        body:
          decision === 'CONFIRMED'
            ? 'Xizmat to‘lovi tasdiqlandi. Savdo bo‘limlari ochildi.'
            : (note ?? 'Hujjat qabul qilinmadi'),
        route: '/payment',
      })
      .catch((err: Error) => this.logger.warn(`Bildirishnoma: ${err.message}`));

    await this.audit.record({
      actorId,
      action: 'service-payment.decide',
      entity: 'ServicePayment',
      entityId: row.id,
      metadata: { decision },
    });

    return this.toDto(updated);
  }

  /** Operator navbati: tekshirilishi kerak bo'lgan hujjatlar */
  async queue() {
    const rows = await this.prisma.servicePayment.findMany({
      where: { status: 'PROOF_SUBMITTED' },
      orderBy: { submittedAt: 'asc' },
      take: 200,
      include: { user: { select: { id: true, phone: true, fullName: true } } },
    });

    return rows.map((r) => ({
      userId: r.user.id,
      phone: r.user.phone,
      fullName: r.user.fullName,
      declaredAmount: r.declaredAmount,
      note: r.note,
      receiptUrl: documentUrl(r.receiptDocumentId),
      submittedAt: r.submittedAt?.toISOString() ?? null,
    }));
  }

  private async payee() {
    const company = await this.prisma.companyInfo.findUnique({ where: { id: 'default' } });
    if (!company) return null;
    return {
      name: company.payeeName,
      account: company.payeeAccount,
      mfo: company.payeeMfo,
      bank: company.payeeBank,
      note: company.payeeNote,
    };
  }

  private async toDto(row: PaymentRow): Promise<ServicePaymentDto> {
    /*
     * Rekvizitlar faqat kerak bo'lganda beriladi: to'lov tasdiqlangandan
     * keyin ularni ko'rsatish foydalanuvchini yana to'lashga undaydi.
     */
    const needsPayee = row.status === 'AWAITING_TRANSFER' || row.status === 'REJECTED';

    return {
      status: row.status,
      declaredAmount: row.declaredAmount,
      note: row.note,
      reviewerNote: row.reviewerNote,
      receiptUrl: documentUrl(row.receiptDocumentId),
      submittedAt: row.submittedAt?.toISOString() ?? null,
      confirmedAt: row.confirmedAt?.toISOString() ?? null,
      history: (row.events ?? []).map((e) => ({
        status: e.status,
        note: e.note,
        createdAt: e.createdAt.toISOString(),
      })),
      unlocked: row.status === 'CONFIRMED',
      payee: needsPayee ? await this.payee() : null,
    };
  }
}

/**
 * Hujjat havolasi identifikatordan hosil qilinadi.
 *
 * Bazada faqat fayl kaliti saqlanadi; havola `documents` moduli bergan
 * manzil bilan bir xil bo'lishi shart.
 */
function documentUrl(documentId: string | null): string | null {
  return documentId ? `/api/documents/${documentId}/file` : null;
}
