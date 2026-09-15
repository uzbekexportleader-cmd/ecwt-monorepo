import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PROFILE_WEIGHTS } from '@ecwt/config';
import type {
  ArtisanProfileDto,
  ProfileChecklistItem,
  ProfileCompletionDto,
} from '@ecwt/types';
import type { UpdateProfileInput } from '@ecwt/validation';

import { PrismaService } from '../../prisma/prisma.service';
import { IDENTITY_PROVIDER, type IdentityProvider } from '../identity/identity.provider';
import { REGISTRY_PROVIDER, type GovernmentRegistryProvider, type RegistryStatus } from '../registry/registry.provider';
import { AuditService } from '../../common/audit/audit.service';
import { OnboardingAlertService } from './onboarding-alert.service';
import { SellerApplicationService } from '../seller-application/seller-application.service';

type VerificationKind = 'identity' | 'face' | 'business' | 'membership' | 'bank';

@Injectable()
export class ArtisanProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(IDENTITY_PROVIDER) private readonly identity: IdentityProvider,
    @Inject(REGISTRY_PROVIDER) private readonly registry: GovernmentRegistryProvider,
    private readonly alerts: OnboardingAlertService,
    private readonly sellerApplications: SellerApplicationService,
  ) {}

  async getOrCreate(userId: string): Promise<ArtisanProfileDto> {
    let profile = await this.prisma.artisanProfile.findUnique({
      where: { userId },
      include: { craftCategory: true },
    });
    if (!profile) {
      await this.prisma.artisanProfile.create({ data: { userId } });
      profile = await this.prisma.artisanProfile.findUniqueOrThrow({
        where: { userId },
        include: { craftCategory: true },
      });
    }
    return this.toDto(profile);
  }

  async update(userId: string, input: UpdateProfileInput): Promise<ArtisanProfileDto> {
    const existing = await this.prisma.artisanProfile.findUnique({ where: { userId } });
    if (!existing) throw new NotFoundException('Profil topilmadi');

    const { bankCard, birthDate, ...rest } = input;

    // Karta raqami hech qachon to'liq saqlanmaydi — faqat maska
    const bankCardMasked =
      bankCard === undefined ? undefined : bankCard === null ? null : maskCard(bankCard);

    const data: Record<string, unknown> = { ...rest };
    if (bankCardMasked !== undefined) data.bankCardMasked = bankCardMasked;
    if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null;

    // Bank ma'lumoti o'zgarsa tasdiq bekor bo'ladi
    if (bankCard !== undefined || input.bankAccount !== undefined || input.bankHolderName !== undefined) {
      data.bankVerification = 'NOT_STARTED';
    }
    if (input.businessType !== undefined || input.stir !== undefined) {
      data.businessVerification = 'NOT_STARTED';
    }
    if (input.membershipStatus !== undefined || input.membershipNumber !== undefined) {
      data.membershipVerification = 'NOT_STARTED';
    }

    // Tekshiruvlar birlashtirilgan holat ustida: so'rovda kelgan maydonlar
    // bazadagi mavjud qiymatlar ustiga qo'yiladi. Shu sababli qisman
    // (bitta maydonli) so'rov ham to'g'ri baholanadi.
    const merged = { ...existing, ...data } as ProfileFieldsSnapshot;

    // Marketplace va qo'shimcha xizmat — bir-birini istisno qiladi.
    // Mobil ilovada bu faqat UI cheklovi edi; API'ga to'g'ridan-to'g'ri
    // so'rov yuborib ikkalasini birga tanlash mumkin edi.
    if (
      input.selectedMarketplaces !== undefined ||
      input.wantsBrandSite !== undefined ||
      input.wantsDropshipping !== undefined ||
      input.wantsChinaImport !== undefined
    ) {
      assertServiceChoiceValid(merged);
    }

    // Bosqichni oldinga siljitishdan oldin — shu bosqichgacha bo'lgan
    // majburiy maydonlar chindan to'ldirilganini tekshiramiz. Aks holda
    // API'ga to'g'ridan-to'g'ri so'rov yuborib, bo'sh profilni "DONE" deb
    // belgilash mumkin edi (mobil ilovadagi tekshiruv faqat UI darajasida edi).
    if (input.onboardingStage !== undefined) {
      assertStageReachable(input.onboardingStage, merged);
    }

    await this.prisma.artisanProfile.update({ where: { userId }, data: data as never });

    // Foydalanuvchi ismini User jadvalida ham yangilab qo'yamiz (ko'rsatish uchun)
    if (input.firstName || input.lastName || input.middleName) {
      const p = await this.prisma.artisanProfile.findUniqueOrThrow({ where: { userId } });
      const fullName = [p.lastName, p.firstName, p.middleName].filter(Boolean).join(' ');
      if (fullName) await this.prisma.user.update({ where: { id: userId }, data: { fullName } });
    }

    await this.recalculateCompletion(userId);

    // Ro'yxatdan o'tish shu so'rovda tugagan bo'lsa — ECWT tomonini
    // xabardor qilamiz. Faqat O'TISH paytida: keyingi yangilanishlarda
    // takroriy xabar ketmasin.
    const justFinished =
      input.onboardingStage === 'DONE' && existing.onboardingStage !== 'DONE';
    if (justFinished) {
      /*
       * Ariza BIRINCHI bo'lib bazada yaratiladi: foydalanuvchi kabinetda
       * ko'radigan raqam va holat shu yozuvdan keladi. Telegram xabari —
       * xabardor qilish vositasi, u yiqilsa ham ariza yo'qolmaydi.
       */
      await this.sellerApplications.createOnOnboardingCompleted(userId);
      await this.alerts.onOnboardingCompleted(userId);
    }

    return this.getOrCreate(userId);
  }

  /* ---------------------------- tasdiqlashlar --------------------------- */

  async verify(userId: string, kind: VerificationKind): Promise<ArtisanProfileDto> {
    const profile = await this.prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profil topilmadi');

    const notes = (profile.verificationNotes as Record<string, string> | null) ?? {};

    switch (kind) {
      case 'identity': {
        if (!profile.pinfl) throw new BadRequestException('Avval JShShIR ni kiriting');
        const fullName = [profile.lastName, profile.firstName].filter(Boolean).join(' ');
        const result = await this.identity.verifyByPinfl(profile.pinfl, fullName);
        const status =
          result.status === 'VERIFIED' ? 'VERIFIED' : result.status === 'FAILED' ? 'FAILED' : 'PENDING';
        notes.identity = result.status === 'VERIFIED' ? 'Shaxs tasdiqlandi' : result.reason;
        await this.prisma.artisanProfile.update({
          where: { userId },
          data: { identityVerification: status, verificationNotes: notes as never },
        });
        break;
      }

      case 'face': {
        // Eng oxirgi yuklangan selfi olinadi
        const selfie = await this.prisma.document.findFirst({
          where: { userId, type: 'SELFIE' },
          orderBy: { createdAt: 'desc' },
        });
        if (!selfie) throw new BadRequestException('Avval yuzingiz suratini yuboring');

        const result = await this.identity.verifyFace({
          pinfl: profile.pinfl,
          photoUrl: selfie.storageKey,
        });
        const status =
          result.status === 'VERIFIED' ? 'VERIFIED' : result.status === 'FAILED' ? 'FAILED' : 'PENDING';
        notes.face = result.status === 'VERIFIED' ? 'Yuz tasdiqlandi' : result.reason;
        await this.prisma.artisanProfile.update({
          where: { userId },
          data: { faceVerification: status, verificationNotes: notes as never },
        });
        break;
      }

      case 'business': {
        if (profile.businessType === 'NONE') {
          throw new BadRequestException('Avval tadbirkorlik shaklini tanlang');
        }
        if (!profile.stir) throw new BadRequestException('STIR kiritilmagan');
        const check = await this.registry.checkBusinessRegistration(profile.stir);
        notes.business = check.note;
        await this.prisma.artisanProfile.update({
          where: { userId },
          data: { businessVerification: mapRegistry(check.status), verificationNotes: notes as never },
        });
        break;
      }

      case 'membership': {
        if (!profile.pinfl) throw new BadRequestException('Avval JShShIR ni kiriting');
        const check = await this.registry.checkCraftsmanMembership(
          profile.pinfl,
          profile.membershipNumber ?? undefined,
        );
        notes.membership = check.note;
        await this.prisma.artisanProfile.update({
          where: { userId },
          data: { membershipVerification: mapRegistry(check.status), verificationNotes: notes as never },
        });
        break;
      }

      case 'bank': {
        if (!profile.bankAccount && !profile.bankCardMasked) {
          throw new BadRequestException('Bank rekviziti kiritilmagan');
        }
        if (!profile.bankHolderName) {
          throw new BadRequestException('Hisob egasining ismini kiriting');
        }
        // Bank verifikatsiya API'si ulanmagan — moderator tasdiqlaydi
        notes.bank = 'Bank rekviziti moderator tomonidan tekshiriladi (bank API ulanmagan).';
        await this.prisma.artisanProfile.update({
          where: { userId },
          data: { bankVerification: 'PENDING', verificationNotes: notes as never },
        });
        break;
      }
    }

    await this.audit.record({
      actorId: userId,
      action: `profile.verify.${kind}`,
      entity: 'ArtisanProfile',
      entityId: profile.id,
    });

    await this.recalculateCompletion(userId);
    return this.getOrCreate(userId);
  }

  /* --------------------------- to'ldirilganlik -------------------------- */

  async completion(userId: string): Promise<ProfileCompletionDto> {
    const profile = await this.prisma.artisanProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!profile) throw new NotFoundException('Profil topilmadi');

    const items: ProfileChecklistItem[] = [
      {
        key: 'phone',
        label: 'Telefon tasdiqlangan',
        status: 'DONE',
      },
      {
        key: 'personal',
        label: 'Shaxsiy ma’lumotlar',
        status: profile.firstName && profile.lastName && profile.birthDate ? 'DONE' : 'MISSING',
        hint: 'Ism, familiya va tug‘ilgan sana',
        route: '/profile/personal',
      },
      {
        key: 'identity',
        label: 'Shaxs tasdiqlangan',
        status:
          profile.identityVerification === 'VERIFIED'
            ? 'DONE'
            : profile.identityVerification === 'NOT_STARTED'
              ? 'MISSING'
              : 'WARN',
        hint: 'JShShIR va pasport ma’lumoti',
        route: '/profile/verification',
      },
      {
        key: 'craft',
        label: 'Hunar yo‘nalishi',
        status: profile.craftCategoryId ? 'DONE' : 'MISSING',
        route: '/profile/craft',
      },
      {
        key: 'address',
        label: 'Manzil',
        status: profile.region && profile.district ? 'DONE' : 'MISSING',
        route: '/profile/personal',
      },
      {
        key: 'experience',
        label: 'Tajriba',
        status: profile.yearsOfExperience !== null ? 'DONE' : 'MISSING',
        route: '/profile/craft',
      },
      {
        key: 'business',
        label: 'Tadbirkorlik holati',
        status:
          profile.businessType === 'NONE'
            ? 'MISSING'
            : profile.businessVerification === 'VERIFIED'
              ? 'DONE'
              : 'WARN',
        hint: profile.businessType === 'NONE' ? 'YaTT yoki MChJ sifatida ro‘yxatdan o‘ting' : undefined,
        route: '/profile/business',
      },
      {
        key: 'membership',
        label: 'Hunarmand uyushmasi a’zoligi',
        status:
          profile.membershipStatus === 'NONE'
            ? 'MISSING'
            : profile.membershipVerification === 'VERIFIED'
              ? 'DONE'
              : 'WARN',
        route: '/profile/business',
      },
      {
        key: 'bank',
        label: 'Bank rekviziti',
        status:
          !profile.bankAccount && !profile.bankCardMasked
            ? 'MISSING'
            : profile.bankVerification === 'VERIFIED'
              ? 'DONE'
              : 'WARN',
        route: '/profile/bank',
      },
    ];

    const percent = this.computePercent(profile);
    return { percent, items };
  }

  private computePercent(profile: {
    firstName: string | null;
    lastName: string | null;
    birthDate: Date | null;
    identityVerification: string;
    craftCategoryId: string | null;
    region: string | null;
    district: string | null;
    yearsOfExperience: number | null;
    businessType: string;
    membershipStatus: string;
    bankAccount: string | null;
    bankCardMasked: string | null;
  }): number {
    let score = PROFILE_WEIGHTS.phoneVerified;
    if (profile.firstName && profile.lastName && profile.birthDate) score += PROFILE_WEIGHTS.personalInfo;
    if (profile.identityVerification === 'VERIFIED') score += PROFILE_WEIGHTS.identityVerified;
    else if (profile.identityVerification === 'PENDING') score += PROFILE_WEIGHTS.identityVerified / 2;
    if (profile.craftCategoryId) score += PROFILE_WEIGHTS.craft;
    if (profile.region && profile.district) score += PROFILE_WEIGHTS.address;
    if (profile.yearsOfExperience !== null) score += PROFILE_WEIGHTS.experience;
    if (profile.businessType !== 'NONE') score += PROFILE_WEIGHTS.businessType;
    if (profile.membershipStatus !== 'NONE') score += PROFILE_WEIGHTS.membership;
    if (profile.bankAccount || profile.bankCardMasked) score += PROFILE_WEIGHTS.bank;
    return Math.min(100, Math.round(score));
  }

  async recalculateCompletion(userId: string): Promise<number> {
    const profile = await this.prisma.artisanProfile.findUniqueOrThrow({ where: { userId } });
    const percent = this.computePercent(profile);
    await this.prisma.artisanProfile.update({
      where: { userId },
      data: { completionPercent: percent },
    });
    return percent;
  }

  /* -------------------------------- DTO --------------------------------- */

  toDto(profile: Record<string, unknown>): ArtisanProfileDto {
    const p = profile as never as {
      id: string;
      userId: string;
      firstName: string | null;
      lastName: string | null;
      middleName: string | null;
      birthDate: Date | null;
      gender: ArtisanProfileDto['gender'];
      pinfl: string | null;
      passportSeries: string | null;
      passportNumber: string | null;
      region: string | null;
      district: string | null;
      mahalla: string | null;
      street: string | null;
      houseNumber: string | null;
      address: string | null;
      latitude: number | null;
      longitude: number | null;
      contactPhone: string | null;
      activityType: ArtisanProfileDto['activityType'];
      selectedMarketplaces: string[];
      wantsBrandSite: boolean;
      wantsDropshipping: boolean;
      wantsChinaImport: boolean;
      paymentMethod: ArtisanProfileDto['paymentMethod'];
      onboardingStage: ArtisanProfileDto['onboardingStage'];
      contractSignedAt: Date | null;
      bankName: string | null;
      bankSwift: string | null;
      businessType: ArtisanProfileDto['businessType'];
      stir: string | null;
      organizationName: string | null;
      craftCategoryId: string | null;
      craftCategory: ArtisanProfileDto['craftCategory'];
      craftSubcategoryId: string | null;
      yearsOfExperience: number | null;
      workshopAddress: string | null;
      hasWorkshop: boolean;
      description: string | null;
      membershipStatus: ArtisanProfileDto['membershipStatus'];
      membershipNumber: string | null;
      bankAccount: string | null;
      bankMfo: string | null;
      bankCardMasked: string | null;
      bankHolderName: string | null;
      identityVerification: ArtisanProfileDto['identityVerification'];
      faceVerification: ArtisanProfileDto['faceVerification'];
      businessVerification: ArtisanProfileDto['businessVerification'];
      membershipVerification: ArtisanProfileDto['membershipVerification'];
      bankVerification: ArtisanProfileDto['bankVerification'];
      profilePhotoUrl: string | null;
      hasApprentice: boolean;
      apprenticeCount: number;
      hasDisability: boolean;
      completionPercent: number;
      createdAt: Date;
      updatedAt: Date;
    };

    return {
      id: p.id,
      userId: p.userId,
      firstName: p.firstName,
      lastName: p.lastName,
      middleName: p.middleName,
      birthDate: p.birthDate ? p.birthDate.toISOString().slice(0, 10) : null,
      gender: p.gender,
      pinfl: p.pinfl ? maskPinfl(p.pinfl) : null,
      passportSeries: p.passportSeries,
      passportNumber: p.passportNumber,
      region: p.region,
      district: p.district,
      mahalla: p.mahalla,
      street: p.street,
      houseNumber: p.houseNumber,
      address: p.address,
      latitude: p.latitude,
      longitude: p.longitude,
      contactPhone: p.contactPhone,
      activityType: p.activityType,
      selectedMarketplaces: p.selectedMarketplaces ?? [],
      wantsBrandSite: p.wantsBrandSite,
      wantsDropshipping: p.wantsDropshipping,
      wantsChinaImport: p.wantsChinaImport,
      paymentMethod: p.paymentMethod,
      onboardingStage: p.onboardingStage,
      contractSignedAt: p.contractSignedAt ? p.contractSignedAt.toISOString() : null,
      bankName: p.bankName,
      bankSwift: p.bankSwift,
      businessType: p.businessType,
      stir: p.stir,
      organizationName: p.organizationName,
      craftCategoryId: p.craftCategoryId,
      craftCategory: p.craftCategory ?? null,
      craftSubcategoryId: p.craftSubcategoryId,
      yearsOfExperience: p.yearsOfExperience,
      workshopAddress: p.workshopAddress,
      hasWorkshop: p.hasWorkshop,
      description: p.description,
      membershipStatus: p.membershipStatus,
      membershipNumber: p.membershipNumber,
      bankAccount: p.bankAccount ? maskAccount(p.bankAccount) : null,
      bankMfo: p.bankMfo,
      bankCardMasked: p.bankCardMasked,
      bankHolderName: p.bankHolderName,
      identityVerification: p.identityVerification,
      faceVerification: p.faceVerification,
      businessVerification: p.businessVerification,
      membershipVerification: p.membershipVerification,
      bankVerification: p.bankVerification,
      profilePhotoUrl: p.profilePhotoUrl,
      hasApprentice: p.hasApprentice,
      apprenticeCount: p.apprenticeCount,
      hasDisability: p.hasDisability,
      completionPercent: p.completionPercent,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}

/* --------------------- bosqich ketma-ketligini tekshirish --------------------- */

/** `OnboardingStage` bilan bir xil tartibda — mobil ilovadagi 9 ta qadamga mos */
export const STAGE_ORDER = [
  'PERSONAL',
  'ADDRESS',
  'ACTIVITY_TYPE',
  'ACTIVITY_DETAILS',
  'SERVICES',
  'BANK',
  'PAYMENT',
  'CONTRACT',
  'DONE',
] as const;

export type Stage = (typeof STAGE_ORDER)[number];

/** Foydalanuvchi ekranda ko'radigan bosqich nomlari */
const STAGE_LABEL: Record<Stage, string> = {
  PERSONAL: 'Shaxsiy ma’lumotlar',
  ADDRESS: 'Manzil',
  ACTIVITY_TYPE: 'Faoliyat turi',
  ACTIVITY_DETAILS: 'Faoliyat tafsilotlari',
  SERVICES: 'Xizmat tanlash',
  BANK: 'Bank rekvizitlari',
  PAYMENT: 'To‘lov usuli',
  CONTRACT: 'Shartnoma',
  DONE: 'Yakun',
};

/** Tekshiruv uchun kerakli maydonlarning minimal ko'rinishi */
export interface ProfileFieldsSnapshot {
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  birthDate: Date | null;
  gender: string | null;
  region: string | null;
  district: string | null;
  mahalla: string | null;
  street: string | null;
  houseNumber: string | null;
  activityType: string | null;
  /** Reyestrdagi hunar kategoriyasi (UUID) — profil tahrirlashda tanlanadi */
  craftCategoryId: string | null;
  /** Ro'yxatdan o'tishda tanlanadigan hunar turi (slug: "kulolchilik") */
  craftSubcategoryId: string | null;
  yearsOfExperience: number | null;
  selectedMarketplaces: string[];
  wantsBrandSite: boolean;
  wantsDropshipping: boolean;
  wantsChinaImport: boolean;
  bankAccount: string | null;
  bankMfo: string | null;
  bankName: string | null;
  paymentMethod: string | null;
}

/**
 * Har bir bosqichda mobil ilova (`app/(setup)/*.tsx`) majburiy deb talab
 * qiladigan maydonlar. Faqat shu qadamning o'zida to'ldiriladigan
 * maydonlar tekshiriladi — oldingi bosqichlar o'z navbatida alohida
 * tekshiriladi (`assertStageReachable` ketma-ket yuradi).
 */
function stageRequirementError(stage: Stage, p: ProfileFieldsSnapshot): string | null {
  switch (stage) {
    case 'PERSONAL':
      if (!p.firstName || !p.lastName || !p.middleName || !p.birthDate || !p.gender) {
        return 'ism, familiya, otasining ismi, tug‘ilgan sana va jinsni to‘ldiring';
      }
      return null;
    case 'ADDRESS':
      if (!p.region || !p.district || !p.mahalla || !p.street || !p.houseNumber) {
        return 'viloyat, tuman, mahalla, ko‘cha va uy raqamini to‘ldiring';
      }
      return null;
    case 'ACTIVITY_TYPE':
      if (!p.activityType) return 'faoliyat turini tanlang';
      return null;
    case 'ACTIVITY_DETAILS':
      if (p.yearsOfExperience === null) return 'tajribangizni ko‘rsating';
      // Ro'yxatdan o'tishda hunar turi slug sifatida `craftSubcategoryId`ga
      // yoziladi (`craftCategoryId` — reyestr jadvaliga tashqi kalit, u
      // faqat profil tahrirlashda to'ldiriladi). Ikkalasidan biri yetarli.
      if (p.activityType === 'HUNARMAND' && !p.craftSubcategoryId && !p.craftCategoryId) {
        return 'hunar yo‘nalishini tanlang';
      }
      return null;
    case 'SERVICES':
      if (
        p.selectedMarketplaces.length === 0 &&
        !p.wantsBrandSite &&
        !p.wantsDropshipping &&
        !p.wantsChinaImport
      ) {
        return 'marketplace yoki xizmat turini tanlang';
      }
      return null;
    case 'BANK':
      if (!p.bankAccount || !p.bankMfo || !p.bankName) {
        return 'hisob raqami, MFO va bank nomini to‘ldiring';
      }
      return null;
    case 'PAYMENT':
      if (!p.paymentMethod) return 'to‘lov usulini tanlang';
      return null;
    case 'CONTRACT':
    case 'DONE':
      // Shartnoma yuklash ixtiyoriy (keyinroq Profil > Hujjatlarim orqali
      // yuklash mumkin) — shu sabab bu ikki bosqich uchun qo'shimcha
      // maydon talab qilinmaydi, faqat oldingi bosqichlar tekshiriladi.
      return null;
  }
}

/**
 * Marketplace va qo'shimcha xizmatlar bir-birini istisno qilishini tekshiradi.
 *
 * Biznes qoidasi: hunarmand YO marketplace'da sotadi, YO qo'shimcha
 * xizmatlardan (brend sayt / dropshipping / Xitoy importi) BITTASINI
 * oladi — ikkalasi birga bo'lmaydi ("1 tada 2 ta xizmat turi yo'q").
 */
export function assertServiceChoiceValid(p: ProfileFieldsSnapshot): void {
  const services = [p.wantsBrandSite, p.wantsDropshipping, p.wantsChinaImport].filter(Boolean).length;
  const marketplaces = p.selectedMarketplaces.length;

  if (marketplaces > 0 && services > 0) {
    throw new BadRequestException(
      'Marketplace va qo‘shimcha xizmat birga tanlanmaydi — bittasini tanlang',
    );
  }
  if (marketplaces > 1) {
    throw new BadRequestException('Faqat bitta marketplace tanlanadi');
  }
  if (services > 1) {
    throw new BadRequestException('Faqat bitta xizmat turi tanlanadi');
  }
}

/**
 * Foydalanuvchi `targetStage`ga o'tishga urinayotganda, undan OLDINGI
 * barcha bosqichlarning majburiy maydonlari to'ldirilganini tekshiradi.
 *
 * Nega kerak: mobil ilovada bosqichlar ketma-ket ekrandan ekranga
 * o'tkaziladi, lekin bu faqat UI cheklovi — API'ga to'g'ridan-to'g'ri
 * so'rov yuborib, oraliq bosqichlarni to'ldirmasdan `onboardingStage`ni
 * "DONE" qilib qo'yish mumkin edi. Orqaga qaytish (targetStage joriy
 * bosqichdan oldin bo'lsa) har doim ruxsat etiladi — tekshiruv faqat
 * OLDINGA siljishda ishlaydi.
 */
export function assertStageReachable(targetStage: Stage, profile: ProfileFieldsSnapshot): void {
  const targetIndex = STAGE_ORDER.indexOf(targetStage);
  if (targetIndex <= 0) return;

  for (let i = 0; i < targetIndex; i++) {
    const error = stageRequirementError(STAGE_ORDER[i], profile);
    if (error) {
      /*
       * Foydalanuvchiga bosqichning ichki nomi (ACTIVITY_DETAILS) emas,
       * o'zi ko'rgan ekran nomi va aniq nima qilish kerakligi ko'rsatiladi.
       * Masalan: «"Faoliyat tafsilotlari" qadamiga qayting: hunar
       * yo'nalishini tanlang».
       */
      throw new BadRequestException(
        `“${STAGE_LABEL[STAGE_ORDER[i]]}” qadamiga qayting: ${error}`,
      );
    }
  }
}

function mapRegistry(status: RegistryStatus): 'VERIFIED' | 'FAILED' | 'PENDING' {
  switch (status) {
    case 'CONFIRMED':
      return 'VERIFIED';
    case 'NOT_FOUND':
      return 'FAILED';
    default:
      return 'PENDING';
  }
}

function maskCard(raw: string): string {
  const d = raw.replace(/\D/g, '');
  return `•••• •••• •••• ${d.slice(-4)}`;
}

function maskAccount(raw: string): string {
  return `••••••••••••${raw.slice(-4)}`;
}

function maskPinfl(raw: string): string {
  return `${raw.slice(0, 4)}••••••${raw.slice(-2)}`;
}
