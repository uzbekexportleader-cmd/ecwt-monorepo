import type { Supplier as SupplierDto } from '@ecwt/contracts';
import type { Supplier } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Prisma yozuvini API javobiga aylantiradi.
 *
 * `includePrivate` — bank rekvizitlari faqat egasi va adminga ko'rinadi.
 * Boshqa hamkorlar yoki ochiq katalog uchun `false`.
 */
export function toSupplierDto(supplier: Supplier, includePrivate: boolean): SupplierDto {
  const dto: SupplierDto = {
    id: supplier.id,
    companyName: supplier.companyName,
    legalName: supplier.legalName,
    stir: includePrivate ? supplier.stir : null,
    region: supplier.region,
    district: supplier.district,
    address: includePrivate ? supplier.address : null,
    website: supplier.website,
    descriptionUz: supplier.descriptionUz,
    descriptionRu: supplier.descriptionRu,
    descriptionEn: supplier.descriptionEn,
    logoUrl: supplier.logoUrl,
    contactPhone: includePrivate ? supplier.contactPhone : null,
    contactEmail: includePrivate ? supplier.contactEmail : null,
    monthlyCapacity: supplier.monthlyCapacity,
    status: supplier.status,
    verifiedAt: supplier.verifiedAt?.toISOString() ?? null,
    rejectionReason: supplier.rejectionReason,
    balanceUsd: PrismaService.toNumber(supplier.balanceUsd),
    createdAt: supplier.createdAt.toISOString(),
  };

  if (includePrivate) {
    dto.bankName = supplier.bankName;
    dto.bankAccount = supplier.bankAccount;
    dto.mfo = supplier.mfo;
  }

  return dto;
}
