import { Injectable, Logger } from '@nestjs/common';
import {
  calculateOrderSplit,
  canTransitionOrder,
  type CreateOrderInput,
  type MarketplaceOrder as OrderDto,
  type OrderListQuery,
  type Paginated,
  type SalesSummary,
  type UpdateOrderStatusInput,
} from '@ecwt/contracts';
import type { MarketplaceOrder, Prisma, Product } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppError } from '../../common/errors';
import { paginate, toSkipTake } from '../../common/pagination';
import { AuditService } from '../audit/audit.service';

type OrderWithProduct = MarketplaceOrder & {
  listing?: { product: Pick<Product, 'id' | 'sku' | 'nameUz' | 'nameEn'> } | null;
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Marketplace'dan kelgan buyurtmani kiritish.
   *
   * Pul taqsimoti SERVERDA hisoblanadi — klient yuborgan `netToSupplierUsd`
   * qabul qilinmaydi. Takroriy import `(marketplace, externalOrderId)`
   * unique indeksi bilan bloklanadi.
   */
  async create(
    input: CreateOrderInput,
    actor: { userId: string; ip?: string; requestId?: string },
  ): Promise<OrderDto> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: input.listingId },
      select: { id: true, supplierId: true, marketplace: true, commissionPercent: true },
    });

    if (!listing) throw AppError.notFound('E’lon topilmadi');

    if (listing.marketplace !== input.marketplace) {
      throw AppError.validation('Buyurtma marketplace’i e’lon marketplace’iga mos kelmadi', {
        marketplace: [`E’lon ${listing.marketplace} da joylashgan`],
      });
    }

    const split = calculateOrderSplit({
      grossUsd: input.grossUsd,
      marketplaceFeeUsd: input.marketplaceFeeUsd,
      shippingUsd: input.shippingUsd,
      commissionPercent: PrismaService.toNumber(listing.commissionPercent),
      ecwtFeeUsdOverride: input.ecwtFeeUsd,
    });

    if (split.netToSupplierUsd < 0) {
      throw AppError.validation(
        'Hisob-kitob manfiy chiqdi: komissiya va yetkazib berish umumiy summadan oshib ketdi',
        { grossUsd: ['Summalarni tekshiring'] },
      );
    }

    const existing = await this.prisma.marketplaceOrder.findUnique({
      where: {
        marketplace_externalOrderId: {
          marketplace: input.marketplace,
          externalOrderId: input.externalOrderId,
        },
      },
      select: { id: true },
    });
    if (existing) {
      throw AppError.conflict('Bu buyurtma allaqachon kiritilgan');
    }

    const order = await this.prisma.marketplaceOrder.create({
      data: {
        listingId: listing.id,
        supplierId: listing.supplierId,
        marketplace: input.marketplace,
        externalOrderId: input.externalOrderId,
        quantity: input.quantity,
        grossUsd: input.grossUsd,
        marketplaceFeeUsd: input.marketplaceFeeUsd,
        shippingUsd: input.shippingUsd,
        ecwtFeeUsd: split.ecwtFeeUsd,
        netToSupplierUsd: split.netToSupplierUsd,
        buyerCountry: input.buyerCountry,
        placedAt: input.placedAt,
        status: 'PENDING',
      },
      include: { listing: { select: { product: { select: productSummarySelect } } } },
    });

    await this.audit.record({
      actorUserId: actor.userId,
      action: 'order.created',
      entityType: 'MarketplaceOrder',
      entityId: order.id,
      metadata: { externalOrderId: input.externalOrderId, grossUsd: input.grossUsd },
      ip: actor.ip,
      requestId: actor.requestId,
    });

    return toOrderDto(order);
  }

  /**
   * Holatni o'zgartirish. DELIVERED bo'lganda hamkor balansiga pul qo'shiladi,
   * REFUNDED bo'lganda qaytariladi — ikkalasi ham bitta tranzaksiya ichida,
   * atomik `increment`/`decrement` bilan (parallel so'rovlarda ham to'g'ri).
   */
  async updateStatus(
    orderId: string,
    input: UpdateOrderStatusInput,
    actor: { userId: string; ip?: string; requestId?: string },
  ): Promise<OrderDto> {
    const existing = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        supplierId: true,
        netToSupplierUsd: true,
        payoutId: true,
      },
    });

    if (!existing) throw AppError.notFound('Buyurtma topilmadi');

    if (existing.status === input.status) {
      throw AppError.conflict('Buyurtma allaqachon shu holatda');
    }

    if (!canTransitionOrder(existing.status, input.status)) {
      throw AppError.conflict(
        `"${existing.status}" holatidan "${input.status}" holatiga o‘tib bo‘lmaydi`,
      );
    }

    // To'lovga kiritilgan buyurtmani qaytarib bo'lmaydi — pul allaqachon
    // hamkorga jo'natilgan. Bunday holat qo'lda hal qilinadi.
    if (input.status === 'REFUNDED' && existing.payoutId) {
      throw AppError.conflict(
        'Bu buyurtma to‘lov paketiga kiritilgan. Avval to‘lovni bekor qiling.',
      );
    }

    const net = PrismaService.toNumber(existing.netToSupplierUsd);
    const now = new Date();

    const order = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.marketplaceOrder.update({
        where: { id: orderId },
        data: {
          status: input.status,
          ...(input.trackingNumber ? { trackingNumber: input.trackingNumber } : {}),
          ...(input.status === 'SHIPPED' ? { shippedAt: now } : {}),
          ...(input.status === 'DELIVERED' ? { deliveredAt: now } : {}),
          ...(input.status === 'CANCELLED' ? { cancelledAt: now } : {}),
        },
        include: { listing: { select: { product: { select: productSummarySelect } } } },
      });

      if (input.status === 'DELIVERED') {
        await tx.supplier.update({
          where: { id: existing.supplierId },
          data: { balanceUsd: { increment: net } },
        });
      }

      // Yetkazilgandan keyin qaytarilsa — balansdan yechamiz
      if (input.status === 'REFUNDED' && existing.status === 'DELIVERED') {
        await tx.supplier.update({
          where: { id: existing.supplierId },
          data: { balanceUsd: { decrement: net } },
        });
      }

      return updated;
    });

    await this.audit.record({
      actorUserId: actor.userId,
      action: `order.${input.status.toLowerCase()}`,
      entityType: 'MarketplaceOrder',
      entityId: orderId,
      metadata: { from: existing.status, to: input.status, note: input.note ?? null },
      ip: actor.ip,
      requestId: actor.requestId,
    });

    this.logger.log(`Buyurtma holati: ${orderId} ${existing.status} -> ${input.status}`);

    return toOrderDto(order);
  }

  async getById(orderId: string, scopeSupplierId: string | undefined): Promise<OrderDto> {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      include: { listing: { select: { product: { select: productSummarySelect } } } },
    });

    if (!order) throw AppError.notFound('Buyurtma topilmadi');
    if (scopeSupplierId && order.supplierId !== scopeSupplierId) {
      throw AppError.notFound('Buyurtma topilmadi');
    }

    return toOrderDto(order);
  }

  async list(
    query: OrderListQuery,
    scopeSupplierId: string | undefined,
  ): Promise<Paginated<OrderDto>> {
    const where = this.buildWhere(query, scopeSupplierId);
    const { skip, take } = toSkipTake(query);

    const [items, total] = await Promise.all([
      this.prisma.marketplaceOrder.findMany({
        where,
        skip,
        take,
        orderBy: { placedAt: query.order },
        include: { listing: { select: { product: { select: productSummarySelect } } } },
      }),
      this.prisma.marketplaceOrder.count({ where }),
    ]);

    return paginate(items.map(toOrderDto), total, query);
  }

  /** Kabinetdagi grafik va umumiy raqamlar */
  async summary(
    scopeSupplierId: string | undefined,
    range: { from?: Date; to?: Date },
  ): Promise<SalesSummary> {
    const to = range.to ?? new Date();
    const from = range.from ?? new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    const where: Prisma.MarketplaceOrderWhereInput = {
      placedAt: { gte: from, lte: to },
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
      ...(scopeSupplierId ? { supplierId: scopeSupplierId } : {}),
    };

    const [totals, byMarketplace, orders] = await Promise.all([
      this.prisma.marketplaceOrder.aggregate({
        where,
        _count: true,
        _sum: { grossUsd: true, netToSupplierUsd: true },
      }),
      this.prisma.marketplaceOrder.groupBy({
        by: ['marketplace'],
        where,
        _count: true,
        _sum: { grossUsd: true },
      }),
      this.prisma.marketplaceOrder.findMany({
        where,
        select: { placedAt: true, grossUsd: true },
        orderBy: { placedAt: 'asc' },
      }),
    ]);

    // Kunlik yig'indi. Buyurtmalar soni bir necha mingdan oshsa
    // buni SQL'ga (raw query) ko'chirish kerak bo'ladi.
    const dailyMap = new Map<string, { ordersCount: number; grossUsd: number }>();
    for (const order of orders) {
      const key = order.placedAt.toISOString().slice(0, 10);
      const bucket = dailyMap.get(key) ?? { ordersCount: 0, grossUsd: 0 };
      bucket.ordersCount += 1;
      bucket.grossUsd += PrismaService.toNumber(order.grossUsd);
      dailyMap.set(key, bucket);
    }

    return {
      periodStart: from.toISOString(),
      periodEnd: to.toISOString(),
      ordersCount: totals._count,
      grossUsd: PrismaService.toNumber(totals._sum.grossUsd),
      netToSupplierUsd: PrismaService.toNumber(totals._sum.netToSupplierUsd),
      byMarketplace: byMarketplace.map((row) => ({
        marketplace: row.marketplace,
        ordersCount: row._count,
        grossUsd: PrismaService.toNumber(row._sum.grossUsd),
      })),
      daily: [...dailyMap.entries()]
        .map(([date, value]) => ({
          date,
          ordersCount: value.ordersCount,
          grossUsd: Math.round(value.grossUsd * 100) / 100,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  private buildWhere(
    query: OrderListQuery,
    scopeSupplierId: string | undefined,
  ): Prisma.MarketplaceOrderWhereInput {
    const where: Prisma.MarketplaceOrderWhereInput = {};

    if (scopeSupplierId) {
      where.supplierId = scopeSupplierId;
    } else if (query.supplierId) {
      where.supplierId = query.supplierId;
    }

    if (query.status) where.status = query.status;
    if (query.marketplace) where.marketplace = query.marketplace;
    if (query.productId) where.listing = { productId: query.productId };
    if (query.from || query.to) {
      where.placedAt = {
        ...(query.from ? { gte: query.from } : {}),
        ...(query.to ? { lte: query.to } : {}),
      };
    }

    return where;
  }
}

const productSummarySelect = { id: true, sku: true, nameUz: true, nameEn: true } as const;

function toOrderDto(order: OrderWithProduct): OrderDto {
  const product = order.listing?.product;

  return {
    id: order.id,
    listingId: order.listingId,
    supplierId: order.supplierId,
    marketplace: order.marketplace,
    externalOrderId: order.externalOrderId,
    quantity: order.quantity,
    grossUsd: PrismaService.toNumber(order.grossUsd),
    marketplaceFeeUsd: PrismaService.toNumber(order.marketplaceFeeUsd),
    shippingUsd: PrismaService.toNumber(order.shippingUsd),
    ecwtFeeUsd: PrismaService.toNumber(order.ecwtFeeUsd),
    netToSupplierUsd: PrismaService.toNumber(order.netToSupplierUsd),
    status: order.status,
    buyerCountry: order.buyerCountry,
    trackingNumber: order.trackingNumber,
    payoutId: order.payoutId,
    placedAt: order.placedAt.toISOString(),
    shippedAt: order.shippedAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    ...(product ? { product } : {}),
  };
}
