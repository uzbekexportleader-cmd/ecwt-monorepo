import { Injectable, Logger } from '@nestjs/common';
import {
  canTransitionPayout,
  type CreatePayoutInput,
  type FailPayoutInput,
  type MarkPayoutPaidInput,
  type Paginated,
  type Payout as PayoutDto,
  type PayoutListQuery,
} from '@ecwt/contracts';
import type { Payout, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppError } from '../../common/errors';
import { paginate, toSkipTake } from '../../common/pagination';
import { AuditService } from '../audit/audit.service';

/**
 * Payout = ECWT'dan hamkorga pul o'tkazish.
 *
 * Faqat DELIVERED holatidagi va hali hech qaysi to'lovga kiritilmagan
 * buyurtmalar bo'yicha yig'iladi.
 */
@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    input: CreatePayoutInput,
    actor: { userId: string; ip?: string; requestId?: string },
  ): Promise<PayoutDto> {
    const payout = await this.prisma.$transaction(async (tx) => {
      // Buyurtmalarni tranzaksiya ichida qulflab olamiz: bir vaqtda
      // ikkita to'lov paketi bir xil buyurtmani olib qo'ymasligi kerak.
      const orders = await tx.marketplaceOrder.findMany({
        where: {
          id: { in: input.orderIds },
          supplierId: input.supplierId,
          status: 'DELIVERED',
          payoutId: null,
        },
        select: { id: true, netToSupplierUsd: true, placedAt: true },
      });

      if (orders.length === 0) {
        throw AppError.validation(
          'To‘lovga yaroqli buyurtma topilmadi (faqat yetkazilgan va hali to‘lanmagan buyurtmalar)',
          { orderIds: ['Yaroqli buyurtma yo‘q'] },
        );
      }

      if (orders.length !== input.orderIds.length) {
        throw AppError.conflict(
          'Ba’zi buyurtmalar to‘lovga yaroqsiz yoki boshqa to‘lovga kiritilgan. Ro‘yxatni yangilang.',
        );
      }

      const amountUsd =
        Math.round(
          orders.reduce((sum, o) => sum + PrismaService.toNumber(o.netToSupplierUsd), 0) * 100,
        ) / 100;

      const dates = orders.map((o) => o.placedAt.getTime());
      const amountUzs = input.exchangeRate
        ? Math.round(amountUsd * input.exchangeRate * 100) / 100
        : null;

      const created = await tx.payout.create({
        data: {
          supplierId: input.supplierId,
          amountUsd,
          amountUzs,
          exchangeRate: input.exchangeRate ?? null,
          ordersCount: orders.length,
          periodStart: new Date(Math.min(...dates)),
          periodEnd: new Date(Math.max(...dates)),
          note: input.note ?? null,
          status: 'PENDING',
        },
      });

      // `payoutId: null` sharti — parallel so'rovda buyurtma allaqachon
      // band bo'lib qolgan bo'lsa, bu yerda 0 ta yozuv yangilanadi.
      const claimed = await tx.marketplaceOrder.updateMany({
        where: { id: { in: orders.map((o) => o.id) }, payoutId: null },
        data: { payoutId: created.id },
      });

      if (claimed.count !== orders.length) {
        throw AppError.conflict('Buyurtmalar boshqa to‘lovga kiritildi. Qaytadan urinib ko‘ring.');
      }

      return created;
    });

    await this.audit.record({
      actorUserId: actor.userId,
      action: 'payout.created',
      entityType: 'Payout',
      entityId: payout.id,
      metadata: {
        supplierId: input.supplierId,
        amountUsd: PrismaService.toNumber(payout.amountUsd),
        ordersCount: payout.ordersCount,
      },
      ip: actor.ip,
      requestId: actor.requestId,
    });

    this.logger.log(`To‘lov paketi yaratildi: ${payout.id} (${payout.ordersCount} ta buyurtma)`);

    return toPayoutDto(payout);
  }

  async startProcessing(payoutId: string): Promise<PayoutDto> {
    return this.transition(payoutId, 'PROCESSING', {});
  }

  /**
   * To'lov amalga oshdi: hamkor balansidan summa yechiladi.
   * Balans va to'lov holati bitta tranzaksiyada o'zgaradi.
   */
  async markPaid(
    payoutId: string,
    input: MarkPayoutPaidInput,
    actor: { userId: string; ip?: string; requestId?: string },
  ): Promise<PayoutDto> {
    const existing = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      select: { status: true, supplierId: true, amountUsd: true },
    });
    if (!existing) throw AppError.notFound('To‘lov topilmadi');

    if (!canTransitionPayout(existing.status, 'PAID')) {
      throw AppError.conflict(`"${existing.status}" holatidan "PAID" holatiga o‘tib bo‘lmaydi`);
    }

    const amount = PrismaService.toNumber(existing.amountUsd);

    const payout = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: 'PAID',
          reference: input.reference,
          paidAt: input.paidAt ?? new Date(),
          failureReason: null,
        },
      });

      await tx.supplier.update({
        where: { id: existing.supplierId },
        data: { balanceUsd: { decrement: amount } },
      });

      return updated;
    });

    await this.audit.record({
      actorUserId: actor.userId,
      action: 'payout.paid',
      entityType: 'Payout',
      entityId: payoutId,
      metadata: { amountUsd: amount, reference: input.reference },
      ip: actor.ip,
      requestId: actor.requestId,
    });

    this.logger.log(`To‘lov bajarildi: ${payoutId} — ${amount} USD`);

    return toPayoutDto(payout);
  }

  async markFailed(
    payoutId: string,
    input: FailPayoutInput,
    actor: { userId: string; ip?: string; requestId?: string },
  ): Promise<PayoutDto> {
    const payout = await this.transition(payoutId, 'FAILED', {
      failureReason: input.reason,
    });

    await this.audit.record({
      actorUserId: actor.userId,
      action: 'payout.failed',
      entityType: 'Payout',
      entityId: payoutId,
      metadata: { reason: input.reason },
      ip: actor.ip,
      requestId: actor.requestId,
    });

    return payout;
  }

  /**
   * Bekor qilish: buyurtmalar to'lovdan ajratiladi va qayta
   * to'lovga kiritish mumkin bo'ladi.
   */
  async cancel(
    payoutId: string,
    actor: { userId: string; ip?: string; requestId?: string },
  ): Promise<PayoutDto> {
    const existing = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      select: { status: true },
    });
    if (!existing) throw AppError.notFound('To‘lov topilmadi');

    if (!canTransitionPayout(existing.status, 'CANCELLED')) {
      throw AppError.conflict('To‘langan to‘lovni bekor qilib bo‘lmaydi');
    }

    const payout = await this.prisma.$transaction(async (tx) => {
      await tx.marketplaceOrder.updateMany({
        where: { payoutId },
        data: { payoutId: null },
      });

      return tx.payout.update({
        where: { id: payoutId },
        data: { status: 'CANCELLED', ordersCount: 0 },
      });
    });

    await this.audit.record({
      actorUserId: actor.userId,
      action: 'payout.cancelled',
      entityType: 'Payout',
      entityId: payoutId,
      ip: actor.ip,
      requestId: actor.requestId,
    });

    return toPayoutDto(payout);
  }

  async getById(payoutId: string, scopeSupplierId: string | undefined): Promise<PayoutDto> {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });

    if (!payout) throw AppError.notFound('To‘lov topilmadi');
    if (scopeSupplierId && payout.supplierId !== scopeSupplierId) {
      throw AppError.notFound('To‘lov topilmadi');
    }

    return toPayoutDto(payout);
  }

  async list(
    query: PayoutListQuery,
    scopeSupplierId: string | undefined,
  ): Promise<Paginated<PayoutDto>> {
    const where: Prisma.PayoutWhereInput = {};

    if (scopeSupplierId) {
      where.supplierId = scopeSupplierId;
    } else if (query.supplierId) {
      where.supplierId = query.supplierId;
    }
    if (query.status) where.status = query.status;

    const { skip, take } = toSkipTake(query);

    const [items, total] = await Promise.all([
      this.prisma.payout.findMany({ where, skip, take, orderBy: { createdAt: query.order } }),
      this.prisma.payout.count({ where }),
    ]);

    return paginate(items.map(toPayoutDto), total, query);
  }

  /** To'lovga tayyor buyurtmalar — admin to'lov paketi yig'ayotganda */
  async payableOrders(supplierId: string) {
    const orders = await this.prisma.marketplaceOrder.findMany({
      where: { supplierId, status: 'DELIVERED', payoutId: null },
      orderBy: { placedAt: 'asc' },
      select: {
        id: true,
        externalOrderId: true,
        marketplace: true,
        netToSupplierUsd: true,
        placedAt: true,
        deliveredAt: true,
      },
    });

    const totalUsd =
      Math.round(
        orders.reduce((sum, o) => sum + PrismaService.toNumber(o.netToSupplierUsd), 0) * 100,
      ) / 100;

    return {
      orders: orders.map((o) => ({
        ...o,
        netToSupplierUsd: PrismaService.toNumber(o.netToSupplierUsd),
        placedAt: o.placedAt.toISOString(),
        deliveredAt: o.deliveredAt?.toISOString() ?? null,
      })),
      totalUsd,
    };
  }

  private async transition(
    payoutId: string,
    to: 'PROCESSING' | 'FAILED',
    extra: Prisma.PayoutUpdateInput,
  ): Promise<PayoutDto> {
    const existing = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      select: { status: true },
    });
    if (!existing) throw AppError.notFound('To‘lov topilmadi');

    if (!canTransitionPayout(existing.status, to)) {
      throw AppError.conflict(`"${existing.status}" holatidan "${to}" holatiga o‘tib bo‘lmaydi`);
    }

    const payout = await this.prisma.payout.update({
      where: { id: payoutId },
      data: { status: to, ...extra },
    });

    return toPayoutDto(payout);
  }
}

function toPayoutDto(payout: Payout): PayoutDto {
  return {
    id: payout.id,
    supplierId: payout.supplierId,
    reference: payout.reference,
    amountUsd: PrismaService.toNumber(payout.amountUsd),
    amountUzs: PrismaService.toNumberOrNull(payout.amountUzs),
    exchangeRate: PrismaService.toNumberOrNull(payout.exchangeRate),
    status: payout.status,
    ordersCount: payout.ordersCount,
    periodStart: payout.periodStart?.toISOString() ?? null,
    periodEnd: payout.periodEnd?.toISOString() ?? null,
    note: payout.note,
    failureReason: payout.failureReason,
    paidAt: payout.paidAt?.toISOString() ?? null,
    createdAt: payout.createdAt.toISOString(),
  };
}
