import { Injectable } from '@nestjs/common';
import type { CompanyInfoDto, Role } from '@ecwt/types';
import type { CompanyInfoInput, CompanyLocationInput } from '@ecwt/validation';

import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

/**
 * Kompaniya va asoschi haqidagi ma'lumot.
 *
 * Yagona yozuv. Ma'lumot kodga emas, bazaga yoziladi: telefon raqami yoki
 * manzil o'zgarganda ilovani qayta chiqarish kerak bo'lmasin.
 */

const SINGLETON_ID = 'default';

/**
 * Boshlang'ich qiymatlar — hujjat bilan tasdiqlangan ma'lumot.
 *
 * Bu yerga faqat ANIQ bilinadigan narsa yoziladi. Masalan manzil
 * yozilmagan: uni asoschining o'zi ilovadan GPS orqali belgilaydi.
 */
const DEFAULTS = {
  name: 'ECWT',
  legalName: '"E-COMMERCE WORLD TRADE" mas’uliyati cheklangan jamiyat',
  stir: '306843537',
  founderName: 'Asror Shakirov Abidovich',
  founderTitle: 'Asoschi va direktor',
  founderBio:
    'ECWT — O‘zbekiston elektron tijorat kompaniyasi. Kompaniya hunarmandlar va ishlab chiqaruvchilarni xalqaro onlayn savdo maydonchalariga chiqaradi: mahsulotni tayyorlashdan tortib, xorijiy xaridorga yetkazish va pulni O‘zbekistonda olishgacha bo‘lgan yo‘lni bitta ilovada birlashtiradi.',
  supportPhone: '+998 97 711-51-77',
} as const;

const ADMIN_ROLES: Role[] = ['ADMIN', 'SUPER_ADMIN'];

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Yozuv bo'lmasa boshlang'ich qiymatlar bilan yaratiladi */
  private async ensure() {
    const existing = await this.prisma.companyInfo.findUnique({ where: { id: SINGLETON_ID } });
    if (existing) return existing;
    return this.prisma.companyInfo.create({ data: { id: SINGLETON_ID, ...DEFAULTS } });
  }

  async get(role: Role | undefined): Promise<CompanyInfoDto> {
    const row = await this.ensure();
    return {
      name: row.name,
      legalName: row.legalName,
      stir: row.stir,
      founderName: row.founderName,
      founderTitle: row.founderTitle,
      founderBio: row.founderBio,
      founderPhone: row.founderPhone,
      supportPhone: row.supportPhone,
      supportTelegram: row.supportTelegram,
      supportEmail: row.supportEmail,
      latitude: row.latitude,
      longitude: row.longitude,
      addressLine: row.addressLine,
      locationSetAt: row.locationSetAt?.toISOString() ?? null,
      /*
       * Tahrirlash huquqini SERVER hisoblaydi — ilova rolni o'zi
       * talqin qilsa, qoida ikki joyda takrorlanadi.
       */
      canEdit: Boolean(role && ADMIN_ROLES.includes(role)),
    };
  }

  async update(input: CompanyInfoInput, actorId: string, role: Role): Promise<CompanyInfoDto> {
    await this.ensure();
    await this.prisma.companyInfo.update({ where: { id: SINGLETON_ID }, data: input });
    await this.audit.record({
      actorId,
      action: 'company.update',
      entity: 'CompanyInfo',
      entityId: SINGLETON_ID,
    });
    return this.get(role);
  }

  /**
   * Joylashuvni GPS orqali belgilash.
   *
   * Koordinata qurilmadan keladi, qo'lda yozilmaydi: yozilgan manzil
   * xaritada boshqa nuqtaga tushishi mumkin.
   */
  async setLocation(
    input: CompanyLocationInput,
    actorId: string,
    role: Role,
  ): Promise<CompanyInfoDto> {
    await this.ensure();
    await this.prisma.companyInfo.update({
      where: { id: SINGLETON_ID },
      data: {
        latitude: input.latitude,
        longitude: input.longitude,
        addressLine: input.addressLine ?? undefined,
        locationSetById: actorId,
        locationSetAt: new Date(),
      },
    });
    await this.audit.record({
      actorId,
      action: 'company.location.set',
      entity: 'CompanyInfo',
      entityId: SINGLETON_ID,
      metadata: { latitude: input.latitude, longitude: input.longitude },
    });
    return this.get(role);
  }
}
