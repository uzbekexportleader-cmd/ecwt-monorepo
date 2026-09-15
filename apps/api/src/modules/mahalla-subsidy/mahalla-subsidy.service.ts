import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  ExternalSubsidyDto,
  ExternalSubsidyStatus,
  MahallaFieldDto,
  MahallaPacketDto,
} from '@ecwt/types';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * online-mahalla.uz uchun subsidiya paketi.
 *
 * MUHIM CHEGARA: ECWT arizani foydalanuvchi o'rniga TOPSHIRMAYDI.
 * Davlat tizimiga kirish (OneID) va ommaviy oferta bilan rozilik —
 * shaxsning o'z harakati; uni bot bajarsa, arizadagi ma'lumot uchun
 * javobgarlik baribir hunarmandda qoladi, lekin u hujjatni ko'rmagan
 * bo'ladi. Shu sababli bu yerdagi vazifa aniq: profil ma'lumotidan
 * platformaning HAR BIR maydoniga tayyor qiymat hosil qilish, nima
 * yetishmayotganini aytish va topshirilgan arizani kuzatish.
 *
 * Hech bir qiymat to'qib chiqarilmaydi: profilda yo'q maydon `null`
 * bo'lib qaytadi va foydalanuvchi qayerda to'ldirishi ko'rsatiladi.
 */

/** Ariza topshiriladigan manzil */
const PLATFORM_URL = 'https://online-mahalla.uz/forms/subsidy_ssuda_one_id';

const PLATFORM = 'ONLINE_MAHALLA';

/**
 * Platformadagi subsidiya turi — ro'yxatdan AYNAN shu matn tanlanadi.
 *
 * Matn platformaning o'zidan olingan. Uni qisqartirib yozsak,
 * foydalanuvchi ro'yxatdan mos qatorni topa olmaydi.
 */
const SUBSIDY_TYPE =
  'усталарга интернет сайтларини ташкил этиш, ўз маҳсулотларини жаҳон электрон савдо майдончаларига чиқариш ва реклама харажатлари учун субсидия (25 БҲМгача)';

type ProfileRow = {
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  businessType: string;
  organizationName: string | null;
  stir: string | null;
  region: string | null;
  district: string | null;
  mahalla: string | null;
  street: string | null;
  houseNumber: string | null;
  contactPhone: string | null;
};

@Injectable()
export class MahallaSubsidyService {
  constructor(private readonly prisma: PrismaService) {}

  async getPacket(userId: string): Promise<MahallaPacketDto> {
    const profile = await this.prisma.artisanProfile.findUnique({
      where: { userId },
      select: {
        firstName: true,
        lastName: true,
        middleName: true,
        businessType: true,
        organizationName: true,
        stir: true,
        region: true,
        district: true,
        mahalla: true,
        street: true,
        houseNumber: true,
        contactPhone: true,
      },
    });
    if (!profile) throw new NotFoundException('Profil topilmadi');

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { phone: true },
    });

    const fields = buildFields(profile as ProfileRow, formatPhone(user.phone));

    /*
     * "Yetishmayapti" — faqat ILOVA to'ldirishi kerak bo'lgan maydonlar.
     *
     * Summa kabi maydonlarni foydalanuvchining o'zi saytda yozadi
     * (`fixRoute` yo'q), ular ro'yxatga kirmaydi — aks holda paket hech
     * qachon "tayyor" bo'lmaydi va ogohlantirish ma'nosini yo'qotadi.
     */
    const missing = fields.filter((f) => !f.value && f.fixRoute).map((f) => f.label);

    const submission = await this.prisma.externalSubsidyApplication.findFirst({
      where: { userId, platform: PLATFORM, status: { not: 'CANCELLED' } },
      orderBy: { preparedAt: 'desc' },
    });

    return {
      ready: missing.length === 0,
      url: PLATFORM_URL,
      subsidyType: SUBSIDY_TYPE,
      fields,
      missing,
      submission: submission ? toDto(submission) : null,
    };
  }

  /**
   * Foydalanuvchi "saytga o'tdim" deganda yozuv ochiladi.
   *
   * Yozuv holati `PREPARED` — bu "topshirildi" degani EMAS. Topshirilgani
   * faqat foydalanuvchi platformadan olgan ariza raqamini kiritganda
   * qayd etiladi.
   */
  async startHandoff(userId: string): Promise<ExternalSubsidyDto> {
    const open = await this.prisma.externalSubsidyApplication.findFirst({
      where: { userId, platform: PLATFORM, status: 'PREPARED' },
      orderBy: { preparedAt: 'desc' },
    });
    if (open) return toDto(open);

    const created = await this.prisma.externalSubsidyApplication.create({
      data: { userId, platform: PLATFORM, subsidyType: SUBSIDY_TYPE, status: 'PREPARED' },
    });
    return toDto(created);
  }

  /** Platformadan olingan ariza raqamini qayd etish */
  async recordSubmission(
    userId: string,
    externalNumber: string,
    note: string | null,
  ): Promise<ExternalSubsidyDto> {
    const row = await this.prisma.externalSubsidyApplication.findFirst({
      where: { userId, platform: PLATFORM, status: { in: ['PREPARED', 'SUBMITTED'] } },
      orderBy: { preparedAt: 'desc' },
    });
    /*
     * Yozuv bo'lmasa — SHU YERDA ochamiz, xato qaytarmaymiz.
     *
     * Ilgari "Avval paketni oching" deb rad etilardi. Lekin arizani
     * kompyuterdan yoki mahalladan turib topshirgan odam ilovadagi
     * "saytni ochish" tugmasini bosmagan bo'ladi — u holda o'zining
     * haqiqiy ariza raqamini kirita olmay qolardi va yo'l shu yerda
     * to'xtab qolardi.
     */
    const target =
      row ??
      (await this.prisma.externalSubsidyApplication.create({
        data: { userId, platform: PLATFORM, subsidyType: SUBSIDY_TYPE, status: 'PREPARED' },
      }));

    const updated = await this.prisma.externalSubsidyApplication.update({
      where: { id: target.id },
      data: {
        externalNumber: externalNumber.trim(),
        note,
        status: 'SUBMITTED',
        submittedAt: target.submittedAt ?? new Date(),
      },
    });
    return toDto(updated);
  }

  /**
   * Holatni yangilash.
   *
   * Bu qiymat tashqi saytdan O'QILMAYDI (rasmiy integratsiya yo'q) —
   * uni foydalanuvchining o'zi yoki operator qo'yadi. Shu sababli
   * "tasdiqlandi" holati ham faqat shu yo'l bilan paydo bo'ladi.
   */
  async updateStatus(
    userId: string,
    status: ExternalSubsidyStatus,
    note: string | null,
  ): Promise<ExternalSubsidyDto> {
    const row = await this.prisma.externalSubsidyApplication.findFirst({
      where: { userId, platform: PLATFORM },
      orderBy: { preparedAt: 'desc' },
    });
    if (!row) throw new NotFoundException('Ariza yozuvi topilmadi');

    const updated = await this.prisma.externalSubsidyApplication.update({
      where: { id: row.id },
      data: { status, note: note ?? row.note },
    });
    return toDto(updated);
  }
}

/* --------------------------- maydonlar xaritasi ------------------------- */

/**
 * Kirish raqami bazada `998901234567` ko'rinishida turadi; platformadagi
 * maydon esa `+998 (90) 123-45-67` shaklini kutadi. Hech bo'lmasa `+`
 * belgisini qo'shib beramiz — foydalanuvchi nusxalab qo'yganda raqam
 * to'liq bo'lsin.
 */
function formatPhone(phone: string): string {
  return phone.startsWith('+') ? phone : `+${phone}`;
}

function buildFields(p: ProfileRow, loginPhone: string): MahallaFieldDto[] {
  const isLegal = p.businessType !== 'NONE';
  const fullName = [p.lastName, p.firstName, p.middleName].filter(Boolean).join(' ') || null;

  return [
    {
      key: 'applicantRole',
      step: 'APPLICANT',
      label: 'Қандай ролда давом этмоқчисиз?',
      value: isLegal ? 'Юридик шахс' : 'Жисмоний шахс',
      hint: isLegal
        ? 'Profilda tadbirkorlik shakli ko‘rsatilgan — yuridik shaxs qatorini tanlang'
        : 'Profilda tadbirkorlik shakli ko‘rsatilmagan — jismoniy shaxs qatorini tanlang',
      fixRoute: '/profile/craft',
    },
    {
      key: 'applicantName',
      step: 'APPLICANT',
      label: 'Ф.И.Ш.',
      value: fullName,
      hint: null,
      fixRoute: '/profile/personal',
    },
    ...(isLegal
      ? [
          {
            key: 'organizationName',
            step: 'APPLICANT' as const,
            label: 'Ташкилот номи',
            value: p.organizationName,
            hint: 'Ustavdagi to‘liq nom',
            fixRoute: '/profile/craft',
          },
          {
            key: 'stir',
            step: 'APPLICANT' as const,
            label: 'СТИР',
            value: p.stir,
            hint: '9 ta raqam',
            fixRoute: '/profile/craft',
          },
        ]
      : []),
    {
      key: 'region',
      step: 'ADDRESS',
      label: 'viloyat',
      value: p.region,
      hint: null,
      fixRoute: '/profile/personal',
    },
    {
      key: 'district',
      step: 'ADDRESS',
      label: 'tuman',
      value: p.district,
      hint: null,
      fixRoute: '/profile/personal',
    },
    {
      key: 'mahalla',
      step: 'ADDRESS',
      label: 'mahalla',
      value: p.mahalla,
      hint: null,
      fixRoute: '/profile/personal',
    },
    {
      key: 'street',
      step: 'ADDRESS',
      label: 'ko‘cha/ko‘p qavatli uy',
      value: p.street,
      hint: 'Ro‘yxatdan tanlanadi — nomi to‘liq mos kelmasa eng yaqinini tanlang',
      fixRoute: '/profile/personal',
    },
    {
      key: 'houseNumber',
      step: 'ADDRESS',
      label: 'uy',
      value: p.houseNumber,
      hint: null,
      fixRoute: '/profile/personal',
    },
    {
      key: 'phone',
      step: 'ADDRESS',
      label: 'telefon raqami',
      value: p.contactPhone ?? loginPhone,
      hint: null,
      fixRoute: '/profile/personal',
    },
    {
      key: 'activityKind',
      step: 'REQUISITES',
      label: 'faoliyat turi',
      value: isLegal ? 'Юридик шахс сифатида' : 'Жисмоний шахс сифатида',
      hint: null,
      fixRoute: '/profile/craft',
    },
    {
      key: 'subsidyType',
      step: 'REQUISITES',
      label: 'turi',
      value: SUBSIDY_TYPE,
      hint: 'Ro‘yxatdan aynan shu qatorni tanlang',
      fixRoute: null,
    },
    {
      key: 'amount',
      step: 'REQUISITES',
      label: 'miqdori',
      /*
       * Summani ilova O'ZI YOZMAYDI.
       *
       * Bu — davlat mablag'i so'raladigan raqam; uni faqat hunarmandning
       * o'zi, haqiqiy xarajatiga qarab kiritishi kerak. Tayyor raqam
       * qo'ysak, u tekshirilmagan da'voga aylanadi.
       */
      value: null,
      hint: 'Haqiqiy xarajatingizga qarab o‘zingiz kiriting (tanlangan tur bo‘yicha yuqori chegara — 25 BHM)',
      fixRoute: null,
    },
  ];
}

function toDto(row: {
  id: string;
  platform: string;
  subsidyType: string;
  status: string;
  externalNumber: string | null;
  note: string | null;
  preparedAt: Date;
  submittedAt: Date | null;
}): ExternalSubsidyDto {
  return {
    id: row.id,
    platform: row.platform,
    subsidyType: row.subsidyType,
    status: row.status as ExternalSubsidyStatus,
    externalNumber: row.externalNumber,
    note: row.note,
    preparedAt: row.preparedAt.toISOString(),
    submittedAt: row.submittedAt?.toISOString() ?? null,
  };
}
