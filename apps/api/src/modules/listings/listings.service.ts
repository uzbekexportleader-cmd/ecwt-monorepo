import { Injectable, Logger } from '@nestjs/common';
import {
  canTransitionListing,
  type ChangeListingStatusInput,
  type CreateListingInput,
  type Listing as ListingDto,
  type ListingListQuery,
  type Paginated,
  type UpdateListingInput,
} from '@ecwt/contracts';
import type { Listing, Prisma, Product, ProductImage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppError } from '../../common/errors';
import { paginate, toSkipTake } from '../../common/pagination';
import { AuditService } from '../audit/audit.service';

type ListingWithProduct = Listing & {
  product?: (Product & { images: ProductImage[] }) | null;
};

/**
 * Listing = mahsulotning marketplace'dagi e'loni.
 *
 * Muhim: e'lonni HAMKOR emas, ECWT (admin) yaratadi va narxni belgilaydi.
 * Sabab — yakuniy narx marketplace komissiyasi, logistika, boj va soliqni
 * hisobga oladi; buni hamkor mustaqil hisoblay olmaydi.
 * Hamkor faqat o'z e'lonlarini ko'radi.
 */
@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    input: CreateListingInput,
    actor: { userId: string; ip?: string; requestId?: string },
  ): Promise<ListingDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, supplierId: true, status: true },
    });

    if (!product) throw AppError.notFound('Mahsulot topilmadi');

    if (product.status !== 'APPROVED') {
      throw AppError.conflict('Faqat tasdiqlangan mahsulotni marketplace’ga chiqarish mumkin');
    }

    const existing = await this.prisma.listing.findUnique({
      where: {
        productId_marketplace: { productId: input.productId, marketplace: input.marketplace },
      },
      select: { id: true },
    });
    if (existing) {
      throw AppError.conflict('Bu mahsulot ushbu marketplace’da allaqachon e’lon qilingan');
    }

    const listing = await this.prisma.listing.create({
      data: {
        productId: input.productId,
        supplierId: product.supplierId,
        marketplace: input.marketplace,
        priceUsd: input.priceUsd,
        commissionPercent: input.commissionPercent,
        notes: input.notes ?? null,
        status: 'DRAFT',
      },
      include: { product: { include: { images: true } } },
    });

    await this.audit.record({
      actorUserId: actor.userId,
      action: 'listing.created',
      entityType: 'Listing',
      entityId: listing.id,
      metadata: { marketplace: input.marketplace, priceUsd: input.priceUsd },
      ip: actor.ip,
      requestId: actor.requestId,
    });

    return toListingDto(listing);
  }

  async update(listingId: string, input: UpdateListingInput): Promise<ListingDto> {
    const existing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { status: true },
    });
    if (!existing) throw AppError.notFound('E’lon topilmadi');

    if (existing.status === 'ARCHIVED') {
      throw AppError.conflict('Arxivlangan e’lonni tahrirlab bo‘lmaydi');
    }

    const listing = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        ...(input.priceUsd !== undefined ? { priceUsd: input.priceUsd } : {}),
        ...(input.commissionPercent !== undefined
          ? { commissionPercent: input.commissionPercent }
          : {}),
        ...(input.externalId !== undefined ? { externalId: input.externalId } : {}),
        ...(input.externalUrl !== undefined ? { externalUrl: input.externalUrl } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
      include: { product: { include: { images: true } } },
    });

    return toListingDto(listing);
  }

  /**
   * Holatni o'zgartirish. Ruxsat etilgan o'tishlar @ecwt/contracts dagi
   * jadvalda belgilangan — klient ixtiyoriy holatga sakrab o'ta olmaydi.
   */
  async changeStatus(
    listingId: string,
    input: ChangeListingStatusInput,
    actor: { userId: string; ip?: string; requestId?: string },
  ): Promise<ListingDto> {
    const existing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { status: true, externalId: true },
    });
    if (!existing) throw AppError.notFound('E’lon topilmadi');

    if (existing.status === input.status) {
      throw AppError.conflict('E’lon allaqachon shu holatda');
    }

    if (!canTransitionListing(existing.status, input.status)) {
      throw AppError.conflict(
        `"${existing.status}" holatidan "${input.status}" holatiga o‘tib bo‘lmaydi`,
      );
    }

    // LIVE bo'lishi uchun marketplace'dagi ID kiritilgan bo'lishi kerak,
    // aks holda buyurtmalarni bu e'longa bog'lay olmaymiz.
    if (input.status === 'LIVE' && !existing.externalId) {
      throw AppError.validation('Avval marketplace’dagi e’lon ID sini kiriting', {
        externalId: ['LIVE holatiga o‘tkazish uchun shart'],
      });
    }

    const now = new Date();

    const listing = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: input.status,
        rejectionReason: input.status === 'REJECTED' ? (input.reason ?? null) : null,
        ...(input.status === 'SUBMITTED' ? { submittedAt: now } : {}),
        ...(input.status === 'LIVE' ? { liveAt: now } : {}),
      },
      include: { product: { include: { images: true } } },
    });

    await this.audit.record({
      actorUserId: actor.userId,
      action: `listing.${input.status.toLowerCase()}`,
      entityType: 'Listing',
      entityId: listingId,
      metadata: { from: existing.status, to: input.status, reason: input.reason ?? null },
      ip: actor.ip,
      requestId: actor.requestId,
    });

    this.logger.log(`E’lon holati: ${listingId} ${existing.status} -> ${input.status}`);

    return toListingDto(listing);
  }

  async getById(listingId: string, scopeSupplierId: string | undefined): Promise<ListingDto> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { product: { include: { images: true } } },
    });

    if (!listing) throw AppError.notFound('E’lon topilmadi');
    if (scopeSupplierId && listing.supplierId !== scopeSupplierId) {
      throw AppError.notFound('E’lon topilmadi');
    }

    return toListingDto(listing);
  }

  async list(
    query: ListingListQuery,
    scopeSupplierId: string | undefined,
  ): Promise<Paginated<ListingDto>> {
    const where: Prisma.ListingWhereInput = {};

    if (scopeSupplierId) {
      where.supplierId = scopeSupplierId;
    } else if (query.supplierId) {
      where.supplierId = query.supplierId;
    }

    if (query.marketplace) where.marketplace = query.marketplace;
    if (query.status) where.status = query.status;
    if (query.productId) where.productId = query.productId;

    const { skip, take } = toSkipTake(query);

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.order },
        include: { product: { include: { images: true } } },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return paginate(items.map(toListingDto), total, query);
  }
}

function toListingDto(listing: ListingWithProduct): ListingDto {
  const product = listing.product;

  return {
    id: listing.id,
    productId: listing.productId,
    supplierId: listing.supplierId,
    marketplace: listing.marketplace,
    status: listing.status,
    priceUsd: PrismaService.toNumber(listing.priceUsd),
    commissionPercent: PrismaService.toNumber(listing.commissionPercent),
    externalId: listing.externalId,
    externalUrl: listing.externalUrl,
    notes: listing.notes,
    rejectionReason: listing.rejectionReason,
    submittedAt: listing.submittedAt?.toISOString() ?? null,
    liveAt: listing.liveAt?.toISOString() ?? null,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    ...(product
      ? {
          product: {
            id: product.id,
            sku: product.sku,
            nameUz: product.nameUz,
            nameEn: product.nameEn,
            primaryImageUrl:
              product.images.find((img) => img.isPrimary)?.url ?? product.images[0]?.url ?? null,
          },
        }
      : {}),
  };
}
