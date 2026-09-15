import { Injectable } from '@nestjs/common';
import type { AnalyticsBatchInput } from '@ecwt/validation';
import type { FunnelStepDto } from '@ecwt/types';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * Anketa voronkasi — hisobot shu tartibda chiqadi.
 * Ro'yxat `(setup)` ekranlari ketma-ketligiga mos.
 */
const ONBOARDING_STEPS = [
  'personal',
  'address',
  'activity',
  'activity-details',
  'services',
  'bank',
  'payment',
  'contract',
  'status',
  'done',
] as const;

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Hodisalarni saqlaydi.
   *
   * `userId` ixtiyoriy: ilova ochilgani kabi hodisalar kirishdan oldin ham
   * yuboriladi. Shaxsiy ma'lumot saqlanmaydi — sxema buni cheklab turadi.
   */
  async record(userId: string | null, batch: AnalyticsBatchInput): Promise<void> {
    await this.prisma.analyticsEvent.createMany({
      data: batch.events.map((e) => ({
        userId,
        name: e.name,
        props: e.props ?? undefined,
        appVersion: batch.appVersion ?? null,
        platform: batch.platform ?? null,
        // Offline navbatdan kelgan hodisa: haqiqiy vaqti mijozda qayd etilgan
        createdAt: e.occurredAt ? new Date(e.occurredAt) : undefined,
      })),
    });
  }

  /**
   * Anketa voronkasi: har qadamga nechta foydalanuvchi yetib kelgan.
   *
   * Shu hisobot "odamlar qaysi qadamda chiqib ketyapti" degan savolga javob
   * beradi — mahsulotni yaxshilashda birinchi qaraladigan raqam.
   *
   * "Ko'rsatildi" hodisasi hisoblanadi: forma validatsiyadan o'tmaganda ham
   * tugma bosilaveradi, shuning uchun "tugatildi" ishonchsiz raqam bo'lardi.
   * Ketma-ket ikki qadam orasidagi farq — haqiqiy chiqib ketish.
   */
  async onboardingFunnel(days = 30): Promise<FunnelStepDto[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Qadam nomi `props.step` ichida (JSON), shuning uchun guruhlash SQL
    // darajasida emas, shu yerda bajariladi.
    const events = await this.prisma.analyticsEvent.findMany({
      where: { name: 'onboarding.step.viewed', createdAt: { gte: since } },
      select: { userId: true, props: true },
    });

    const byStep = new Map<string, { users: Set<string>; events: number }>();
    for (const e of events) {
      const step = (e.props as { step?: string } | null)?.step;
      if (!step) continue;
      const entry = byStep.get(step) ?? { users: new Set<string>(), events: 0 };
      if (e.userId) entry.users.add(e.userId);
      entry.events += 1;
      byStep.set(step, entry);
    }

    return ONBOARDING_STEPS.map((step) => ({
      name: step,
      users: byStep.get(step)?.users.size ?? 0,
      events: byStep.get(step)?.events ?? 0,
    }));
  }
}
