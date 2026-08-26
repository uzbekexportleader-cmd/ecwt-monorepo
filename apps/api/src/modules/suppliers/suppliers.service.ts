import { Injectable, Logger } from '@nestjs/common';
import {
  SUPPLIER_REQUIRED_FOR_REVIEW,
  type Paginated,
  type ReviewSupplierInput,
  type Supplier as SupplierDto,
  type SupplierListQuery,
  type SupplierStats,
  type UpdateSupplierInput,
} from '@ecwt/contracts';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppError } from '../../common/errors';
import { paginate, toSkipTake } from '../../common/pagination';
import { AuditService } from '../audit/audit.service';
import { toSupplierDto } from './suppliers.mapper';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getById(supplierId: string, includePrivate: boolean): Promise<SupplierDto> {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) throw AppError.notFound('Hamkor topilmadi');
    return toSupplierDto(supplier, includePrivate);
  }

  async update(supplierId: string, input: UpdateSupplierInput): Promise<SupplierDto> {
    const current = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { status: true },
    });
    if (!current) throw AppError.notFound('Hamkor topilmadi');

    // Tekshiruvdagi profil o'zgartirilsa, admin ko'rgan ma'lumot bilan
    // yakuniy ma'lumot mos kelmay qoladi.
    if (current.status === 'PENDING_REVIEW') {
      throw AppError.conflict(
        'Profil tekshiruvda. Tahrirlash uchun tekshiruv yakunlanishini kuting.',
      );
    }

    if (current.status === 'SUSPENDED') {
      throw AppError.forbidden('Profil to‘xtatilgan, tahrirlash mumkin emas');
    }

    // Bo'sh satr -> null (formada maydon tozalanganda)
    const data = normalizeEmptyStrings(input);

    const updated = await this.prisma.supplier.update({
      where: { id: supplierId },
      data,
    });

    return toSupplierDto(updated, true);
  }

  /**
   * Tekshiruvga yuborish. Majburiy maydonlar SERVERDA tekshiriladi —
   * klientdagi tekshiruv faqat qulaylik uchun.
   */
  async submitForReview(supplierId: string): Promise<SupplierDto> {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) throw AppError.notFound('Hamkor topilmadi');

    if (supplier.status === 'PENDING_REVIEW') {
      throw AppError.conflict('Profil allaqachon tekshiruvda');
    }
    if (supplier.status === 'VERIFIED') {
      throw AppError.conflict('Profil allaqachon tasdiqlangan');
    }
    if (supplier.status === 'SUSPENDED') {
      throw AppError.forbidden('Profil to‘xtatilgan');
    }

    const missing: Record<string, string[]> = {};
    for (const field of SUPPLIER_REQUIRED_FOR_REVIEW) {
      const value = supplier[field];
      if (value === null || value === undefined || value === '') {
        missing[field] = ['Bu maydonni to‘ldirish shart'];
      }
    }

    if (Object.keys(missing).length > 0) {
      throw AppError.validation('Profilni to‘liq to‘ldiring', missing);
    }

    const updated = await this.prisma.supplier.update({
      where: { id: supplierId },
      data: {
        status: 'PENDING_REVIEW',
        submittedAt: new Date(),
        rejectionReason: null,
      },
    });

    this.logger.log(`Hamkor tekshiruvga yubordi: ${supplierId}`);

    return toSupplierDto(updated, true);
  }

  async getStats(supplierId: string): Promise<SupplierStats> {
    const [products, approved, liveListings, orderAgg, pendingPayout] = await Promise.all([
      this.prisma.product.count({ where: { supplierId } }),
      this.prisma.product.count({ where: { supplierId, status: 'APPROVED' } }),
      this.prisma.listing.count({ where: { supplierId, status: 'LIVE' } }),
      this.prisma.marketplaceOrder.aggregate({
        where: { supplierId, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
        _count: true,
        _sum: { grossUsd: true },
      }),
      this.prisma.marketplaceOrder.aggregate({
        where: { supplierId, status: 'DELIVERED', payoutId: null },
        _sum: { netToSupplierUsd: true },
      }),
    ]);

    return {
      productsTotal: products,
      productsApproved: approved,
      listingsLive: liveListings,
      ordersTotal: orderAgg._count,
      revenueUsd: PrismaService.toNumber(orderAgg._sum.grossUsd),
      pendingPayoutUsd: PrismaService.toNumber(pendingPayout._sum.netToSupplierUsd),
    };
  }

  // --------------------------------------------------------------------- admin

  async list(query: SupplierListQuery): Promise<Paginated<SupplierDto>> {
    const where: Prisma.SupplierWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.region) where.region = query.region;
    if (query.search) {
      where.OR = [
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { legalName: { contains: query.search, mode: 'insensitive' } },
        { stir: { contains: query.search } },
      ];
    }

    const { skip, take } = toSkipTake(query);

    const [items, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.order },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return paginate(
      items.map((s) => toSupplierDto(s, true)),
      total,
      query,
    );
  }

  /**
   * Admin hamkorni tasdiqlaydi / rad etadi / to'xtatadi.
   * Har bir qaror audit log'ga yoziladi — keyinchalik "kim tasdiqladi?"
   * degan savolga javob bo'lishi kerak.
   */
  async review(
    supplierId: string,
    input: ReviewSupplierInput,
    actor: { userId: string; ip?: string; requestId?: string },
  ): Promise<SupplierDto> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, status: true },
    });
    if (!supplier) throw AppError.notFound('Hamkor topilmadi');

    if (supplier.status === input.status) {
      throw AppError.conflict('Hamkor allaqachon shu holatda');
    }

    const updated = await this.prisma.supplier.update({
      where: { id: supplierId },
      data: {
        status: input.status,
        verifiedAt: input.status === 'VERIFIED' ? new Date() : null,
        rejectionReason: input.status === 'VERIFIED' ? null : (input.reason ?? null),
      },
    });

    await this.audit.record({
      actorUserId: actor.userId,
      action: `supplier.${input.status.toLowerCase()}`,
      entityType: 'Supplier',
      entityId: supplierId,
      metadata: { from: supplier.status, to: input.status, reason: input.reason ?? null },
      ip: actor.ip,
      requestId: actor.requestId,
    });

    this.logger.log(`Hamkor holati o‘zgardi: ${supplierId} ${supplier.status} -> ${input.status}`);

    return toSupplierDto(updated, true);
  }
}

/**
 * Formada tozalangan maydon bo'sh satr bo'lib keladi.
 * Uni bazaga bo'sh satr emas, `null` qilib yozamiz — shunda
 * "to'ldirilmagan" tekshiruvi to'g'ri ishlaydi.
 */
function normalizeEmptyStrings(input: UpdateSupplierInput): Prisma.SupplierUpdateInput {
  const data: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    data[key] = value === '' ? null : value;
  }

  return data as Prisma.SupplierUpdateInput;
}
