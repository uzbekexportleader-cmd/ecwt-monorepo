import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ProductDto } from '@ecwt/types';
import type { UpsertProductInput } from '@ecwt/validation';

import { PrismaService } from '../../prisma/prisma.service';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../../common/audit/audit.service';
import { ServicePaymentService } from '../service-payment/service-payment.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketplaces: MarketplacesService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly payments: ServicePaymentService,
  ) {}

  async list(userId: string): Promise<ProductDto[]> {
    const rows = await this.prisma.product.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        images: { orderBy: { order: 'asc' } },
        listings: { include: { marketplace: true } },
        reviews: { orderBy: { createdAt: 'asc' } },
      },
    });
    return rows.map((r) => this.toDto(r));
  }

  async get(userId: string, id: string): Promise<ProductDto> {
    const product = await this.prisma.product.findFirst({
      where: { id, userId },
      include: {
        images: { orderBy: { order: 'asc' } },
        listings: { include: { marketplace: true } },
        reviews: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    return this.toDto(product);
  }

  async create(userId: string, input: UpsertProductInput): Promise<ProductDto> {
    await this.assertUnlocked(userId);

    const { imageUrls, ...data } = input;
    const product = await this.prisma.product.create({
      data: {
        ...data,
        userId,
        status: 'DRAFT',
        images: imageUrls?.length
          ? { create: imageUrls.map((url, order) => ({ url, order })) }
          : undefined,
      },
    });
    await this.audit.record({
      actorId: userId,
      action: 'product.create',
      entity: 'Product',
      entityId: product.id,
    });
    return this.get(userId, product.id);
  }

  async update(userId: string, id: string, input: Partial<UpsertProductInput>): Promise<ProductDto> {
    await this.assertUnlocked(userId);
    await this.assertOwned(userId, id);
    const { imageUrls, ...data } = input;

    await this.prisma.product.update({ where: { id }, data: data as never });

    if (imageUrls) {
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
      if (imageUrls.length) {
        await this.prisma.productImage.createMany({
          data: imageUrls.map((url, order) => ({ productId: id, url, order })),
        });
      }
    }
    return this.get(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.assertOwned(userId, id);
    await this.prisma.product.delete({ where: { id } });
    await this.audit.record({ actorId: userId, action: 'product.delete', entity: 'Product', entityId: id });
  }

  /**
   * Savdo bo'limlari ochiqmi.
   *
   * ECWT xizmat to'lovi tasdiqlanmaguncha mahsulot tekshiruvga ham
   * ketmaydi, sotuvga ham chiqmaydi. Qoida SERVERDA turadi: ilovadagi
   * qulf faqat ko'rinish, uni chetlab o'tish mumkin.
   */
  private async assertUnlocked(userId: string): Promise<void> {
    if (await this.payments.isUnlocked(userId)) return;
    throw new BadRequestException(
      'Bu bo‘lim ECWT xizmat to‘lovi tasdiqlangandan keyin ochiladi',
    );
  }

  /* ---------------------------- marketplace ----------------------------- */

  async publish(userId: string, id: string, marketplaceIds: string[]): Promise<ProductDto> {
    await this.assertUnlocked(userId);

    const product = await this.prisma.product.findFirst({
      where: { id, userId },
      include: { images: true },
    });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    /*
     * Faqat tekshiruvdan o'tgan mahsulot savdo kanaliga chiqadi.
     *
     * Tashqi platformada rad etilgan yoki noto'g'ri e'lon — butun
     * do'kon uchun jarima bo'lishi mumkin, shu sababli filtr ECWT
     * tomonida turadi.
     */
    if (product.status !== 'READY' && product.status !== 'PUBLISHED') {
      throw new BadRequestException(
        'Avval mahsulotni tekshiruvga yuboring — tasdiqlangandan keyin sotuvga chiqariladi',
      );
    }
    if (!product.title || !product.price) {
      throw new BadRequestException('Mahsulot nomi va narxi to‘ldirilishi kerak');
    }
    if (product.images.length === 0) {
      throw new BadRequestException('Kamida bitta mahsulot fotosi kerak');
    }

    const targets = await this.prisma.marketplace.findMany({ where: { id: { in: marketplaceIds } } });
    if (targets.length !== marketplaceIds.length) {
      throw new BadRequestException('Ba’zi marketplace‘lar topilmadi');
    }

    let anyListed = false;

    for (const target of targets) {
      const provider = this.marketplaces.provider(target.code);

      /*
       * Avtomatik joylashtirish hali yoqilmagan bo'lsa — bu XATO EMAS.
       *
       * Mahsulot qo'lda joylashtirish navbatiga tushadi: uni ECWT
       * jamoasi platformaga o'zi chiqaradi va e'lon havolasini shu
       * yerga yozadi. Foydalanuvchi bir xil holatlarni ko'radi, ya'ni
       * integratsiya yoqilganda ilovada hech narsa o'zgarmaydi.
       */
      if (!provider?.isConfigured) {
        await this.queuePlacement(id, target.id);
        continue;
      }

      const result = await provider.publish({
        productId: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency,
        images: product.images.map((i) => i.url),
        weightGram: product.weightGram,
        material: product.material,
        stock: product.stock,
      });

      const status: 'LISTED' | 'PENDING' | 'FAILED' =
        result.status === 'LISTED' ? 'LISTED' : result.status === 'PENDING' ? 'PENDING' : 'FAILED';
      if (status === 'LISTED') anyListed = true;

      const data = {
        status,
        externalId: result.externalId,
        errorMessage: result.errorMessage,
        isMock: result.isMock,
        placement: 'AUTO' as const,
      };

      await this.prisma.marketplaceListing.upsert({
        where: { productId_marketplaceId: { productId: id, marketplaceId: target.id } },
        create: { productId: id, marketplaceId: target.id, ...data },
        update: data,
      });
    }

    /*
     * "Sotuvda" holati faqat platforma haqiqatan qabul qilgandan keyin.
     *
     * Ilgari bu yerda holat shartsiz PUBLISHED qilinardi — barcha
     * urinishlar muvaffaqiyatsiz bo'lganda ham mahsulot "chiqarilgan"
     * bo'lib ko'rinardi.
     */
    if (anyListed) {
      await this.prisma.product.update({ where: { id }, data: { status: 'PUBLISHED' } });
    }

    await this.notifications.create({
      userId,
      type: 'MARKETPLACE',
      title: 'Mahsulot sotuvga chiqarishga yuborildi',
      body: `${product.title} — ${targets.length} ta kanalga so‘rov yuborildi. Holatni mahsulot sahifasida kuzating.`,
      route: `/products/${id}`,
    });

    await this.audit.record({
      actorId: userId,
      action: 'product.publish',
      entity: 'Product',
      entityId: id,
      metadata: { marketplaces: targets.map((t) => t.code) },
    });

    return this.get(userId, id);
  }



  /* ---------------------- qo'lda joylashtirish navbati ------------------ */

  /**
   * Kanalga chiqarish so'rovini navbatga qo'yadi.
   *
   * Holat PENDING: "yuborildi, hali joylanmagan". FAILED emas — chunki
   * hech narsa xato ketmadi, ish shunchaki odam tomonidan bajariladi.
   */
  private async queuePlacement(productId: string, marketplaceId: string): Promise<void> {
    const data = {
      status: 'PENDING' as const,
      placement: 'MANUAL' as const,
      errorMessage: null,
      externalId: null,
      isMock: false,
    };

    await this.prisma.marketplaceListing.upsert({
      where: { productId_marketplaceId: { productId, marketplaceId } },
      create: { productId, marketplaceId, ...data },
      update: data,
    });
  }

  /** Qo'lda joylashtirish navbati (operator) */
  async placementQueue() {
    const rows = await this.prisma.marketplaceListing.findMany({
      where: { status: 'PENDING', placement: 'MANUAL' },
      orderBy: { updatedAt: 'asc' },
      take: 200,
      include: {
        marketplace: true,
        product: { include: { images: { orderBy: { order: 'asc' } }, user: { select: { phone: true, fullName: true } } } },
      },
    });

    return rows.map((r) => ({
      listingId: r.id,
      marketplace: r.marketplace.name,
      productId: r.productId,
      title: r.product.title,
      price: r.product.price,
      currency: r.product.currency,
      stock: r.product.stock,
      images: r.product.images.map((i) => i.url),
      sellerName: r.product.user.fullName,
      sellerPhone: r.product.user.phone,
      requestedAt: r.updatedAt.toISOString(),
    }));
  }

  /**
   * Operator mahsulotni platformaga qo'lda joylashtirgach belgilaydi.
   *
   * Havola MAJBURIY: "joylandi" degan so'z emas, tekshirib bo'ladigan
   * dalil bo'lishi kerak.
   */
  async markPlaced(listingId: string, listingUrl: string, externalId: string | null, actorId: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: { product: true, marketplace: true },
    });
    if (!listing) throw new NotFoundException('E‘lon topilmadi');

    await this.prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        status: 'LISTED',
        listingUrl,
        externalId,
        placedById: actorId,
        placedAt: new Date(),
        errorMessage: null,
      },
    });

    await this.prisma.product.update({
      where: { id: listing.productId },
      data: { status: 'PUBLISHED' },
    });

    await this.notifications
      .create({
        userId: listing.product.userId,
        type: 'MARKETPLACE',
        title: 'Mahsulotingiz sotuvda',
        body: `${listing.product.title} — ${listing.marketplace.name} da joylandi.`,
        route: `/products/${listing.productId}`,
      })
      .catch(() => undefined);

    await this.audit.record({
      actorId,
      action: 'listing.placed',
      entity: 'MarketplaceListing',
      entityId: listingId,
    });

    return this.get(listing.product.userId, listing.productId);
  }

  /* --------------------------- tekshiruv oqimi -------------------------- */

  /**
   * Hunarmand mahsulotni tekshiruvga yuboradi.
   *
   * Shart: sotuvchi arizasi tasdiqlangan bo'lishi kerak. Aks holda
   * mahsulot tekshiruvdan o'tsa ham sotuvga chiqara olmaydi — odamni
   * kutdirib, keyin "mumkin emas" deyishdan ko'ra darhol aytgan yaxshi.
   */
  async submitForReview(userId: string, id: string): Promise<ProductDto> {
    await this.assertUnlocked(userId);

    const product = await this.findOwned(userId, id);

    const application = await this.prisma.sellerApplication.findUnique({ where: { userId } });
    if (!application || application.status !== 'APPROVED') {
      throw new BadRequestException(
        'Avval sotuvchi arizangiz tasdiqlanishi kerak. Holatini kabinetdan ko\u2018ring.',
      );
    }

    if (product.status === 'IN_REVIEW') {
      throw new BadRequestException('Mahsulot allaqachon tekshiruvda');
    }
    if (product.status !== 'DRAFT' && product.status !== 'CHANGES_REQUESTED') {
      throw new BadRequestException('Bu mahsulot tekshiruvdan o\u2018tgan');
    }

    const missing = missingForReview(product);
    if (missing.length) {
      throw new BadRequestException(`Quyidagilar to\u2018ldirilmagan: ${missing.join(', ')}`);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        status: 'IN_REVIEW',
        submittedAt: new Date(),
        reviewNote: null,
        reviews: { create: { status: 'IN_REVIEW', note: 'Tekshiruvga yuborildi' } },
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        listings: { include: { marketplace: true } },
        reviews: { orderBy: { createdAt: 'asc' } },
      },
    });

    await this.audit.record({
      action: 'product.review.submit',
      entity: 'Product',
      entityId: id,
      actorId: userId,
    });

    return this.toDto(updated);
  }

  /**
   * Operator qarori.
   *
   * `APPROVED` → mahsulot `READY` bo'ladi: endi savdo kanallariga
   * chiqarish mumkin. `CHANGES_REQUESTED` da izoh MAJBURIY — hunarmand
   * nimani tuzatishini bilishi kerak.
   */
  async review(
    productId: string,
    decision: 'APPROVED' | 'CHANGES_REQUESTED',
    note: string | null,
    actorId: string,
  ): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    if (product.status !== 'IN_REVIEW') {
      throw new BadRequestException('Bu mahsulot tekshiruvda emas');
    }

    const status = decision === 'APPROVED' ? 'READY' : 'CHANGES_REQUESTED';

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        status,
        reviewNote: note,
        reviewedAt: new Date(),
        reviews: { create: { status, note, actorId } },
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        listings: { include: { marketplace: true } },
        reviews: { orderBy: { createdAt: 'asc' } },
      },
    });

    await this.notifications
      .create({
        userId: product.userId,
        type: decision === 'APPROVED' ? 'APPROVED' : 'CORRECTION_REQUIRED',
        title:
          decision === 'APPROVED'
            ? 'Mahsulot tekshiruvdan o\u2018tdi'
            : 'Mahsulotga tuzatish kerak',
        body: note ?? `${product.title} holati yangilandi`,
        route: `/products/${productId}`,
      })
      .catch(() => undefined);

    await this.audit.record({
      action: 'product.review.decide',
      entity: 'Product',
      entityId: productId,
      actorId,
      metadata: { decision },
    });

    return this.toDto(updated);
  }

  /** Operator navbati */
  async reviewQueue(): Promise<ProductDto[]> {
    const rows = await this.prisma.product.findMany({
      where: { status: 'IN_REVIEW' },
      orderBy: { submittedAt: 'asc' },
      take: 200,
      include: {
        images: { orderBy: { order: 'asc' } },
        listings: { include: { marketplace: true } },
        reviews: { orderBy: { createdAt: 'asc' } },
      },
    });
    return rows.map((r) => this.toDto(r));
  }

  /**
   * Qoldiqni o'zgartirish.
   *
   * Qoldiq tekshiruvdan qat'i nazar o'zgaradi: mahsulot sotilib ketsa
   * yoki yangi partiya tayyor bo'lsa, hunarmand buni darhol ko'rsata
   * olishi kerak.
   */
  async setStock(userId: string, id: string, stock: number): Promise<ProductDto> {
    await this.findOwned(userId, id);

    const updated = await this.prisma.product.update({
      where: { id },
      data: { stock },
      include: {
        images: { orderBy: { order: 'asc' } },
        listings: { include: { marketplace: true } },
        reviews: { orderBy: { createdAt: 'asc' } },
      },
    });
    return this.toDto(updated);
  }

  private async findOwned(userId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, userId },
      include: { images: true },
    });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    return product;
  }

  private async assertOwned(userId: string, id: string): Promise<void> {
    const count = await this.prisma.product.count({ where: { id, userId } });
    if (!count) throw new NotFoundException('Mahsulot topilmadi');
  }

  toDto(p: {
    id: string;
    title: string;
    description: string | null;
    categoryId: string | null;
    price: number | null;
    currency: string;
    weightGram: number | null;
    lengthMm: number | null;
    widthMm: number | null;
    heightMm: number | null;
    material: string | null;
    productionDays: number | null;
    stock: number;
    status: ProductDto['status'];
    reviewNote?: string | null;
    submittedAt?: Date | null;
    reviewedAt?: Date | null;
    reviews?: { status: ProductDto['status']; note: string | null; createdAt: Date }[];
    createdAt: Date;
    updatedAt: Date;
    images?: { id: string; url: string; order: number }[];
    listings?: {
      id: string;
      marketplaceId: string;
      status: ProductDto['listings'][number]['status'];
      listingUrl?: string | null;
      placedAt?: Date | null;
      externalId: string | null;
      errorMessage: string | null;
      isMock: boolean;
      updatedAt: Date;
      marketplace?: {
        id: string;
        code: string;
        name: string;
        logoEmoji: string | null;
        isActive: boolean;
        isMock: boolean;
      };
    }[];
  }): ProductDto {
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      categoryId: p.categoryId,
      price: p.price,
      currency: p.currency,
      weightGram: p.weightGram,
      lengthMm: p.lengthMm,
      widthMm: p.widthMm,
      heightMm: p.heightMm,
      material: p.material,
      productionDays: p.productionDays,
      stock: p.stock,
      status: p.status,
      reviewNote: p.reviewNote ?? null,
      submittedAt: p.submittedAt?.toISOString() ?? null,
      reviewedAt: p.reviewedAt?.toISOString() ?? null,
      missingForReview: missingForReview(p),
      /*
       * Tekshiruvga faqat qoralama yoki tuzatish so'ralgan mahsulot
       * yuboriladi: allaqachon navbatda turgani qayta yuborilsa,
       * operator bir xil ishni ikki marta ko'rardi.
       */
      canSubmitForReview:
        (p.status === 'DRAFT' || p.status === 'CHANGES_REQUESTED') &&
        missingForReview(p).length === 0,
      reviewHistory: (p.reviews ?? []).map((r) => ({
        status: r.status,
        note: r.note,
        createdAt: r.createdAt.toISOString(),
      })),
      images: (p.images ?? []).map((i) => ({ id: i.id, url: i.url, order: i.order })),
      listings: (p.listings ?? []).map((l) => ({
        id: l.id,
        marketplaceId: l.marketplaceId,
        marketplace: l.marketplace,
        status: l.status,
        listingUrl: l.listingUrl ?? null,
        placedAt: l.placedAt?.toISOString() ?? null,
        externalId: l.externalId,
        errorMessage: l.errorMessage,
        isMock: l.isMock,
        updatedAt: l.updatedAt.toISOString(),
      })),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}

/**
 * Tekshiruvga yuborish uchun nima yetishmayapti.
 *
 * Og'irlik va o'lchamlar MAJBURIY: xalqaro yetkazish narxi shularsiz
 * hisoblanmaydi, ya'ni mahsulot sotuvga chiqsa ham buyurtma kelganda
 * jo'natib bo'lmaydi.
 */
function missingForReview(p: {
  title: string;
  description: string | null;
  price: number | null;
  weightGram: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  productionDays: number | null;
  images?: { id: string }[];
}): string[] {
  const missing: string[] = [];
  if (!p.title || p.title.trim().length < 3) missing.push('mahsulot nomi');
  if (!p.description || p.description.trim().length < 20) missing.push('tavsif (kamida 20 belgi)');
  if (!p.price) missing.push('narx');
  if (!p.images || p.images.length === 0) missing.push('kamida bitta foto');
  if (!p.weightGram) missing.push('og\u2018irlik');
  if (!p.lengthMm || !p.widthMm || !p.heightMm) missing.push('o\u2018lchamlar');
  if (!p.productionDays) missing.push('tayyorlash muddati');
  return missing;
}
