import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  canTransitionPayment,
  isTerminalPaymentStatus,
  PROVIDER_CURRENCY,
  type CreatePaymentInput,
  type CreatePaymentResult,
  type Paginated,
  type Payment as PaymentDto,
  type PaymentListQuery,
  type PaymentProvider,
} from '@ecwt/contracts';
import type { Payment, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AppError } from '../../common/errors';
import { paginate, toSkipTake } from '../../common/pagination';
import { AuditService } from '../audit/audit.service';
import { PAYMENT_PROVIDERS_TOKEN } from './payments.tokens';
import type { PaymentProviderAdapter, RawWebhook } from './providers/payment-provider.interface';

/** Provayder xabar qilgan summa bizdagidan shuncha farq qilsa — rad etamiz */
const AMOUNT_TOLERANCE = 0.01;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly adapters: Map<string, PaymentProviderAdapter>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(PAYMENT_PROVIDERS_TOKEN) adapters: PaymentProviderAdapter[],
  ) {
    this.adapters = new Map(adapters.map((a) => [a.name, a]));
  }

  /** Sozlangan to'lov tizimlari — klient shu ro'yxatdan tanlaydi */
  availableProviders(): Array<{ provider: PaymentProvider; currency: string }> {
    const result: Array<{ provider: PaymentProvider; currency: string }> = [];

    for (const [name, adapter] of this.adapters) {
      if (adapter.isConfigured()) {
        result.push({
          provider: name as PaymentProvider,
          currency: PROVIDER_CURRENCY[name as PaymentProvider],
        });
      }
    }

    return result;
  }

  /**
   * To'lov yaratish.
   *
   * `idempotencyKey` — klient takroran yuborsa (tarmoq uzilib, qayta bosilsa)
   * ikkita to'lov yaratilmasligi uchun. Kalit bir xil bo'lsa, avval
   * yaratilgan to'lov qaytariladi.
   */
  async create(
    supplierId: string,
    input: CreatePaymentInput,
    idempotencyKey: string | undefined,
  ): Promise<CreatePaymentResult> {
    const adapter = this.adapters.get(input.provider);

    if (!adapter || !adapter.isConfigured()) {
      throw AppError.validation(`${input.provider} to‘lov tizimi hozircha ulanmagan`, {
        provider: ['Bu to‘lov tizimi mavjud emas'],
      });
    }

    const key = idempotencyKey ?? randomUUID();

    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: key },
    });

    if (existing) {
      this.logger.log(`Takroriy to‘lov so‘rovi, mavjudi qaytarildi: ${existing.id}`);
      return {
        paymentId: existing.id,
        provider: existing.provider,
        status: existing.status,
        redirectUrl: readMetadataString(existing.metadata, 'redirectUrl'),
        clientSecret: null, // clientSecret saqlanmaydi — faqat bir marta beriladi
        amount: PrismaService.toNumber(existing.amount),
        currency: existing.currency,
        expiresAt: existing.expiresAt?.toISOString() ?? null,
      };
    }

    // Avval yozuv yaratamiz: provayder javob bermay qolsa ham
    // to'lov izsiz yo'qolmaydi va keyin solishtirish mumkin bo'ladi.
    const payment = await this.prisma.payment.create({
      data: {
        supplierId,
        provider: input.provider,
        purpose: input.purpose,
        amount: input.amount,
        currency: input.currency,
        description: input.description ?? null,
        idempotencyKey: key,
        status: 'PENDING',
      },
    });

    let charge;
    try {
      charge = await adapter.createCharge({
        paymentId: payment.id,
        amount: input.amount,
        currency: input.currency,
        description: input.description ?? `ECWT xizmat haqi (${input.purpose})`,
        returnUrl: input.returnUrl,
      });
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: 'To‘lov tizimi javob bermadi' },
      });

      this.logger.error(
        `To‘lov yaratilmadi (${input.provider}, payment=${payment.id})`,
        error instanceof Error ? error.stack : String(error),
      );

      throw AppError.dependencyFailure('To‘lov tizimiga ulanib bo‘lmadi, birozdan keyin urinib ko‘ring');
    }

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: charge.providerPaymentId,
        expiresAt: charge.expiresAt,
        metadata: charge.redirectUrl ? { redirectUrl: charge.redirectUrl } : undefined,
      },
    });

    return {
      paymentId: updated.id,
      provider: updated.provider,
      status: updated.status,
      redirectUrl: charge.redirectUrl,
      clientSecret: charge.clientSecret,
      amount: PrismaService.toNumber(updated.amount),
      currency: updated.currency,
      expiresAt: updated.expiresAt?.toISOString() ?? null,
    };
  }

  /**
   * Webhook qayta ishlash. Uch bosqichli himoya:
   *   1. Imzo tekshiruvi — soxta so'rovni bloklaydi
   *   2. Takrorlanish tekshiruvi — bitta hodisa ikki marta hisoblanmaydi
   *   3. Summa tekshiruvi — provayder aytgan summa bizdagiga mos kelishi shart
   */
  async handleWebhook(
    provider: PaymentProvider,
    raw: RawWebhook,
  ): Promise<{ ok: boolean; paymentId: string | null; message: string }> {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw AppError.notFound('Noma’lum to‘lov tizimi');

    const verification = adapter.verifyWebhook(raw);

    if (!verification.valid) {
      await this.prisma.webhookEvent.create({
        data: {
          provider,
          externalEventId: verification.externalEventId || `invalid:${randomUUID()}`,
          signatureValid: false,
          payload: toJsonValue(raw.parsedBody),
          error: 'Imzo tekshiruvidan o‘tmadi',
        },
      });

      throw AppError.unauthorized('Imzo noto‘g‘ri');
    }

    // Takroriy hodisa: unique indeks (provider, externalEventId) bloklaydi
    try {
      await this.prisma.webhookEvent.create({
        data: {
          provider,
          externalEventId: verification.externalEventId,
          signatureValid: true,
          payload: toJsonValue(raw.parsedBody),
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        this.logger.log(`Takroriy webhook e’tiborsiz qoldirildi: ${verification.externalEventId}`);
        return { ok: true, paymentId: verification.paymentId, message: 'Allaqachon qayta ishlangan' };
      }
      throw error;
    }

    if (!verification.paymentId) {
      await this.markWebhookProcessed(provider, verification.externalEventId, 'To‘lov ID topilmadi');
      return { ok: false, paymentId: null, message: 'To‘lov ID topilmadi' };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: verification.paymentId },
    });

    if (!payment) {
      await this.markWebhookProcessed(provider, verification.externalEventId, 'To‘lov topilmadi');
      return { ok: false, paymentId: verification.paymentId, message: 'To‘lov topilmadi' };
    }

    // Summa mos kelmasa — bu jiddiy holat, qo'lda tekshirish kerak
    const ourAmount = PrismaService.toNumber(payment.amount);
    if (
      verification.amount !== null &&
      Math.abs(verification.amount - ourAmount) > AMOUNT_TOLERANCE
    ) {
      this.logger.error(
        `Summa mos kelmadi: payment=${payment.id} bizda=${ourAmount} provayderda=${verification.amount}`,
      );
      await this.markWebhookProcessed(
        provider,
        verification.externalEventId,
        `Summa mos kelmadi: ${verification.amount} != ${ourAmount}`,
      );
      return { ok: false, paymentId: payment.id, message: 'Summa mos kelmadi' };
    }

    // Yakuniy holatdagi to'lovni webhook o'zgartira olmaydi
    if (isTerminalPaymentStatus(payment.status)) {
      await this.markWebhookProcessed(provider, verification.externalEventId, null);
      return { ok: true, paymentId: payment.id, message: 'To‘lov yakuniy holatda' };
    }

    if (!canTransitionPayment(payment.status, verification.status)) {
      await this.markWebhookProcessed(
        provider,
        verification.externalEventId,
        `Holat o‘tishi mumkin emas: ${payment.status} -> ${verification.status}`,
      );
      return { ok: true, paymentId: payment.id, message: 'Holat o‘zgarmadi' };
    }

    if (payment.status !== verification.status) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: verification.status,
          providerPaymentId: verification.providerPaymentId ?? payment.providerPaymentId,
          paidAt: verification.status === 'SUCCEEDED' ? new Date() : payment.paidAt,
          failureReason: verification.failureReason ?? null,
        },
      });

      await this.audit.record({
        action: `payment.${verification.status.toLowerCase()}`,
        entityType: 'Payment',
        entityId: payment.id,
        metadata: {
          provider,
          from: payment.status,
          to: verification.status,
          externalEventId: verification.externalEventId,
        },
      });

      this.logger.log(
        `To‘lov holati: ${payment.id} ${payment.status} -> ${verification.status} (${provider})`,
      );
    }

    await this.markWebhookProcessed(provider, verification.externalEventId, null);

    return { ok: true, paymentId: payment.id, message: 'Qabul qilindi' };
  }

  async getById(paymentId: string, scopeSupplierId: string | undefined): Promise<PaymentDto> {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });

    if (!payment) throw AppError.notFound('To‘lov topilmadi');
    if (scopeSupplierId && payment.supplierId !== scopeSupplierId) {
      throw AppError.notFound('To‘lov topilmadi');
    }

    return toPaymentDto(payment);
  }

  async list(
    query: PaymentListQuery,
    scopeSupplierId: string | undefined,
  ): Promise<Paginated<PaymentDto>> {
    const where: Prisma.PaymentWhereInput = {};

    if (scopeSupplierId) {
      where.supplierId = scopeSupplierId;
    } else if (query.supplierId) {
      where.supplierId = query.supplierId;
    }
    if (query.status) where.status = query.status;
    if (query.provider) where.provider = query.provider;

    const { skip, take } = toSkipTake(query);

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({ where, skip, take, orderBy: { createdAt: query.order } }),
      this.prisma.payment.count({ where }),
    ]);

    return paginate(items.map(toPaymentDto), total, query);
  }

  private async markWebhookProcessed(
    provider: PaymentProvider,
    externalEventId: string,
    error: string | null,
  ): Promise<void> {
    await this.prisma.webhookEvent.updateMany({
      where: { provider, externalEventId },
      data: { processedAt: new Date(), error },
    });
  }
}

function toPaymentDto(payment: Payment): PaymentDto {
  return {
    id: payment.id,
    supplierId: payment.supplierId,
    provider: payment.provider,
    providerPaymentId: payment.providerPaymentId,
    purpose: payment.purpose,
    amount: PrismaService.toNumber(payment.amount),
    currency: payment.currency,
    status: payment.status,
    description: payment.description,
    failureReason: payment.failureReason,
    paidAt: payment.paidAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
  };
}

function readMetadataString(metadata: Prisma.JsonValue | null, key: string): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : null;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  // Webhook tanasi har xil bo'lishi mumkin — JSON'ga aylantirib saqlaymiz
  try {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  } catch {
    return { unparsable: true };
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  );
}
