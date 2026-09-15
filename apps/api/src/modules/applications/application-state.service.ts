import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  ALLOWED_TRANSITIONS,
  REASON_REQUIRED,
  STATUS_LABEL_UZ,
  canTransition,
  type ApplicationStatus,
} from '@ecwt/types';

import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../../common/audit/audit.service';

export interface TransitionActor {
  id: string | null;
  name: string;
}

export interface TransitionOptions {
  comment?: string;
  reason?: string;
  approvedAmount?: number;
}

/**
 * Ariza status mashinasi — yagona kirish nuqtasi.
 * Har qanday status o'zgarishi shu servis orqali o'tadi; noqonuniy o'tish
 * BadRequestException bilan rad etiladi.
 */
@Injectable()
export class ApplicationStateService {
  private readonly logger = new Logger(ApplicationStateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  assertCanTransition(from: ApplicationStatus, to: ApplicationStatus): void {
    if (!canTransition(from, to)) {
      const allowed = ALLOWED_TRANSITIONS[from];
      throw new BadRequestException(
        allowed.length
          ? `“${STATUS_LABEL_UZ[from]}” holatidan “${STATUS_LABEL_UZ[to]}” holatiga o‘tib bo‘lmaydi. ` +
            `Ruxsat etilgan: ${allowed.map((s) => STATUS_LABEL_UZ[s]).join(', ')}`
          : `“${STATUS_LABEL_UZ[from]}” yakuniy holat — o‘zgartirib bo‘lmaydi`,
      );
    }
  }

  async transition(
    applicationId: string,
    to: ApplicationStatus,
    actor: TransitionActor,
    options: TransitionOptions = {},
  ): Promise<void> {
    const app = await this.prisma.subsidyApplication.findUnique({
      where: { id: applicationId },
      include: { subsidy: { select: { title: true } } },
    });
    if (!app) throw new BadRequestException('Ariza topilmadi');

    const from = app.status;
    this.assertCanTransition(from, to);

    if (REASON_REQUIRED.includes(to) && !options.reason?.trim()) {
      throw new BadRequestException('Sabab ko‘rsatilishi shart');
    }

    const now = new Date();
    const data: Record<string, unknown> = { status: to };

    if (to === 'SUBMITTED') data.submittedAt = app.submittedAt ?? now;
    if (to === 'APPROVED') {
      data.decidedAt = now;
      if (options.approvedAmount !== undefined) data.approvedAmount = options.approvedAmount;
      else data.approvedAmount = app.requestedAmount;
    }
    if (to === 'REJECTED') {
      data.decidedAt = now;
      data.rejectionReason = options.reason ?? null;
    }
    if (to === 'NEEDS_CORRECTION') data.correctionNote = options.reason ?? null;
    if (to === 'PAID') data.paidAt = now;
    if (to === 'SUBMITTED' && from === 'NEEDS_CORRECTION') data.correctionNote = null;

    await this.prisma.$transaction([
      this.prisma.subsidyApplication.update({ where: { id: applicationId }, data: data as never }),
      this.prisma.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: from,
          toStatus: to,
          comment: options.comment ?? null,
          reasonCode: options.reason ? slugifyReason(options.reason) : null,
          actorId: actor.id,
          actorName: actor.name,
        },
      }),
    ]);

    await this.audit.record({
      actorId: actor.id,
      actorName: actor.name,
      action: 'application.status.change',
      entity: 'SubsidyApplication',
      entityId: applicationId,
      metadata: { from, to, reason: options.reason ?? null },
    });

    await this.notifyUser(app.userId, applicationId, app.subsidy.title, to, options);
  }

  private async notifyUser(
    userId: string,
    applicationId: string,
    subsidyTitle: string,
    to: ApplicationStatus,
    options: TransitionOptions,
  ): Promise<void> {
    const route = `/applications/${applicationId}`;
    const messages: Partial<
      Record<ApplicationStatus, { type: Parameters<NotificationsService['create']>[0]['type']; title: string; body: string }>
    > = {
      SUBMITTED: {
        type: 'APPLICATION_SUBMITTED',
        title: 'Arizangiz qabul qilindi',
        body: `${subsidyTitle} bo‘yicha arizangiz ro‘yxatga olindi.`,
      },
      UNDER_REVIEW: {
        type: 'APPLICATION_STATUS',
        title: 'Ariza tekshirilmoqda',
        body: 'Ma’lumotlaringiz va hujjatlaringiz ko‘rib chiqilmoqda.',
      },
      SCORING: {
        type: 'APPLICATION_STATUS',
        title: 'Ariza baholanmoqda',
        body: 'Arizangiz skoring bosqichiga o‘tdi.',
      },
      LOCAL_REVIEW: {
        type: 'APPLICATION_STATUS',
        title: 'Mahalliy ko‘rib chiqish',
        body: 'Arizangiz mahalliy komissiyaga yuborildi.',
      },
      NEEDS_CORRECTION: {
        type: 'CORRECTION_REQUIRED',
        title: 'Arizada tuzatish kerak',
        body: options.reason ?? 'Arizangizda kamchilik topildi.',
      },
      APPROVED: {
        type: 'APPROVED',
        title: 'Arizangiz tasdiqlandi',
        body: `${subsidyTitle} bo‘yicha ijobiy qaror qabul qilindi.`,
      },
      PAYMENT_PROCESSING: {
        type: 'PAYMENT',
        title: 'To‘lovga yuborildi',
        body: 'Mablag‘ o‘tkazish jarayoni boshlandi.',
      },
      PAID: {
        type: 'PAYMENT',
        title: 'Subsidiya hisobingizga o‘tkazildi',
        body: 'To‘lov amalga oshirildi. Tafsilotlarni arizada ko‘ring.',
      },
      REJECTED: {
        type: 'REJECTED',
        title: 'Ariza rad etildi',
        body: options.reason ?? 'Ariza rad etildi.',
      },
    };

    const msg = messages[to];
    if (!msg) return;
    await this.notifications.create({ userId, type: msg.type, title: msg.title, body: msg.body, route });
  }
}

function slugifyReason(reason: string): string {
  return reason
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .slice(0, 40);
}
