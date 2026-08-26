import type { Product as ProductDto } from '@ecwt/contracts';
import type { Product, ProductImage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type ProductWithImages = Product & { images: ProductImage[] };

export function toProductDto(product: ProductWithImages): ProductDto {
  return {
    id: product.id,
    supplierId: product.supplierId,
    sku: product.sku,
    nameUz: product.nameUz,
    nameRu: product.nameRu,
    nameEn: product.nameEn,
    descriptionUz: product.descriptionUz,
    descriptionRu: product.descriptionRu,
    descriptionEn: product.descriptionEn,
    categoryId: product.categoryId,
    brand: product.brand,
    hsCode: product.hsCode,
    status: product.status,
    basePriceUzs: PrismaService.toNumber(product.basePriceUzs),
    suggestedPriceUsd: PrismaService.toNumberOrNull(product.suggestedPriceUsd),
    moq: product.moq,
    stock: product.stock,
    weightGrams: product.weightGrams,
    lengthMm: product.lengthMm,
    widthMm: product.widthMm,
    heightMm: product.heightMm,
    countryOfOrigin: product.countryOfOrigin,
    rejectionReason: product.rejectionReason,
    images: product.images
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({
        id: img.id,
        url: img.url,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
      })),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
