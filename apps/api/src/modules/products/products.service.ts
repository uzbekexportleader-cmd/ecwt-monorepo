import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateProductInput,
  type Paginated,
  type Product as ProductDto,
  type ProductListQuery,
  type ReviewProductInput,
  type UpdateProductInput,
} from '@ecwt/contracts';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppError } from '../../common/errors';
import { paginate, toSkipTake } from '../../common/pagination';
import { AuditService } from '../audit/audit.service';
import { toProductDto, type ProductWithImages } from './products.mapper';

/**
 * Bu maydonlar o'zgarsa mahsulot qayta tekshiruvga tushadi —
 * chunki ular marketplace e'lonining mazmunini o'zgartiradi.
 *
 * Narx, ombor qoldig'i va o'lchamlar bundan tashqarida: ularni
 * hamkor istalgan vaqtda yangilay olishi kerak.
 */
const FIELDS_REQUIRING_REREVIEW = [
  'nameUz',
  'nameRu',
  'nameEn',
  'descriptionUz',
  'descriptionRu',
  'descriptionEn',
  'brand',
  'hsCode',
  'categoryId',
  'countryOfOrigin',
  'images',
] as const;

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(supplierId: string, input: CreateProductInput): Promise<ProductDto> {
    await this.assertSupplierCanSell(supplierId);

    const duplicate = await this.prisma.product.findUnique({
      where: { supplierId_sku: { supplierId, sku: input.sku } },
      select: { id: true },
    });
    if (duplicate) throw AppError.conflict(`"${input.sku}" SKU allaqachon ishlatilgan`);

    const product = await this.prisma.product.create({
      data: {
        supplierId,
        sku: input.sku,
        nameUz: input.nameUz,
        nameRu: input.nameRu ?? null,
        nameEn: input.nameEn,
        descriptionUz: input.descriptionUz ?? null,
        descriptionRu: input.descriptionRu ?? null,
        descriptionEn: input.descriptionEn ?? null,
        categoryId: input.categoryId ?? null,
        brand: input.brand ?? null,
        hsCode: input.hsCode ?? null,
        basePriceUzs: input.basePriceUzs,
        suggestedPriceUsd: input.suggestedPriceUsd ?? null,
        moq: input.moq,
        stock: input.stock,
        weightGrams: input.weightGrams ?? null,
        lengthMm: input.lengthMm ?? null,
        widthMm: input.widthMm ?? null,
        heightMm: input.heightMm ?? null,
        countryOfOrigin: input.countryOfOrigin,
        status: 'DRAFT',
        images: { create: normalizeImages(input.images) },
      },
      include: { images: true },
    });

    return toProductDto(product);
  }

  async getById(productId: string, scopeSupplierId: string | undefined): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) throw AppError.notFound('Mahsulot topilmadi');

    // Hamkor faqat o'z mahsulotini ko'radi
    if (scopeSupplierId && product.supplierId !== scopeSupplierId) {
      throw AppError.notFound('Mahsulot topilmadi');
    }

    return toProductDto(product);
  }

  async update(
    productId: string,
    supplierId: string,
    input: UpdateProductInput,
  ): Promise<ProductDto> {
    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, supplierId: true, status: true },
    });

    if (!existing || existing.supplierId !== supplierId) {
      throw AppError.notFound('Mahsulot topilmadi');
    }

    if (existing.status === 'ARCHIVED') {
      throw AppError.conflict('Arxivlangan mahsulotni tahrirlab bo‘lmaydi');
    }

    const touchesReviewedContent = FIELDS_REQUIRING_REREVIEW.some(
      (field) => input[field] !== undefined,
    );

    // Tasdiqlangan mahsulotning mazmuni o'zgarsa — qayta tekshiruv.
    // Faqat narx/qoldiq o'zgarsa holat saqlanadi.
    const nextStatus =
      existing.status === 'APPROVED' && touchesReviewedContent
        ? ('PENDING_REVIEW' as const)
        : undefined;

    const { images, ...scalars } = input;

    const product = await this.prisma.$transaction(async (tx) => {
      if (images !== undefined) {
        // Rasmlar to'liq almashtiriladi — klient yakuniy ro'yxatni yuboradi
        await tx.productImage.deleteMany({ where: { productId } });
      }

      return tx.product.update({
        where: { id: productId },
        data: {
          ...toPrismaScalars(scalars),
          ...(nextStatus ? { status: nextStatus, rejectionReason: null } : {}),
          ...(images !== undefined ? { images: { create: normalizeImages(images) } } : {}),
        },
        include: { images: true },
      });
    });

    if (nextStatus) {
      this.logger.log(`Mahsulot qayta tekshiruvga tushdi: ${productId}`);
    }

    return toProductDto(product);
  }

  /** Tekshiruvga yuborish */
  async submitForReview(productId: string, supplierId: string): Promise<ProductDto> {
    await this.assertSupplierCanSell(supplierId);

    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { supplierId: true, status: true, nameEn: true, images: { select: { id: true } } },
    });

    if (!existing || existing.supplierId !== supplierId) {
      throw AppError.notFound('Mahsulot topilmadi');
    }

    if (existing.status !== 'DRAFT' && existing.status !== 'REJECTED') {
      throw AppError.conflict('Bu mahsulotni tekshiruvga yuborib bo‘lmaydi');
    }

    // Rasmsiz mahsulotni marketplace'ga chiqarib bo'lmaydi
    if (existing.images.length === 0) {
      throw AppError.validation('Kamida bitta mahsulot rasmini yuklang', {
        images: ['Kamida bitta rasm kerak'],
      });
    }

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'PENDING_REVIEW', rejectionReason: null },
      include: { images: true },
    });

    return toProductDto(product);
  }

  async remove(productId: string, supplierId: string): Promise<void> {
    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        supplierId: true,
        status: true,
        _count: { select: { listings: true } },
      },
    });

    if (!existing || existing.supplierId !== supplierId) {
      throw AppError.notFound('Mahsulot topilmadi');
    }

    // Marketplace'da e'loni bor mahsulot o'chirilmaydi — buyurtmalar tarixi
    // unga bog'langan. O'rniga arxivlanadi.
    if (existing._count.listings > 0) {
      await this.prisma.product.update({
        where: { id: productId },
        data: { status: 'ARCHIVED' },
      });
      return;
    }

    await this.prisma.product.delete({ where: { id: productId } });
  }

  async list(
    query: ProductListQuery,
    scopeSupplierId: string | undefined,
  ): Promise<Paginated<ProductDto>> {
    const where: Prisma.ProductWhereInput = {};

    // Hamkor uchun majburiy filtr — o'z mahsulotlari
    if (scopeSupplierId) {
      where.supplierId = scopeSupplierId;
    } else if (query.supplierId) {
      where.supplierId = query.supplierId;
    }

    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.search) {
      where.OR = [
        { nameUz: { contains: query.search, mode: 'insensitive' } },
        { nameEn: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = toSkipTake(query);

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy]: query.order },
        include: { images: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(items.map(toProductDto), total, query);
  }

  // --------------------------------------------------------------------- admin

  async review(
    productId: string,
    input: ReviewProductInput,
    actor: { userId: string; ip?: string; requestId?: string },
  ): Promise<ProductDto> {
    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { status: true },
    });
    if (!existing) throw AppError.notFound('Mahsulot topilmadi');

    if (existing.status !== 'PENDING_REVIEW') {
      throw AppError.conflict('Faqat tekshiruvdagi mahsulotni ko‘rib chiqish mumkin');
    }

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        status: input.status,
        rejectionReason: input.status === 'REJECTED' ? (input.reason ?? null) : null,
      },
      include: { images: true },
    });

    await this.audit.record({
      actorUserId: actor.userId,
      action: `product.${input.status.toLowerCase()}`,
      entityType: 'Product',
      entityId: productId,
      metadata: { reason: input.reason ?? null },
      ip: actor.ip,
      requestId: actor.requestId,
    });

    return toProductDto(product);
  }

  // ---------------------------------------------------------------------------

  /** Faqat tasdiqlangan hamkor mahsulot qo'sha oladi */
  private async assertSupplierCanSell(supplierId: string): Promise<void> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { status: true },
    });

    if (!supplier) throw AppError.notFound('Hamkor topilmadi');

    if (supplier.status === 'SUSPENDED') {
      throw AppError.forbidden('Akkauntingiz to‘xtatilgan');
    }

    if (supplier.status !== 'VERIFIED') {
      throw AppError.forbidden(
        'Avval kompaniya profilini to‘ldirib, tasdiqdan o‘tkazing. Shundan keyin mahsulot qo‘sha olasiz.',
      );
    }
  }
}

function normalizeImages(
  images: Array<{ url: string; sortOrder: number; isPrimary: boolean }>,
): Array<{ url: string; sortOrder: number; isPrimary: boolean }> {
  if (images.length === 0) return [];

  // Aynan bitta asosiy rasm bo'lishi kerak. Klient hech birini
  // belgilamagan bo'lsa — birinchisi asosiy bo'ladi.
  const primaryIndex = Math.max(
    0,
    images.findIndex((img) => img.isPrimary),
  );

  return images.map((img, index) => ({
    url: img.url,
    sortOrder: img.sortOrder ?? index,
    isPrimary: index === primaryIndex,
  }));
}

/** `undefined` maydonlar Prisma'ga yuborilmaydi (o'zgarmaydi) */
function toPrismaScalars(input: Record<string, unknown>): Prisma.ProductUpdateInput {
  const data: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    data[key] = value === '' ? null : value;
  }

  return data as Prisma.ProductUpdateInput;
}
