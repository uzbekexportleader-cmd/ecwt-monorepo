import { ApplicationStatus } from './enums';

/**
 * Ariza status mashinasi.
 *
 * Yagona haqiqat manbai — backend. Mobil ilova va admin panel ham shu jadvalga
 * qarab tugmalarni ko'rsatadi, lekin yakuniy tekshiruv har doim serverda.
 */
export const ALLOWED_TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['SCORING', 'NEEDS_CORRECTION', 'REJECTED'],
  NEEDS_CORRECTION: ['SUBMITTED', 'CANCELLED'],
  SCORING: ['LOCAL_REVIEW', 'NEEDS_CORRECTION', 'REJECTED'],
  LOCAL_REVIEW: ['APPROVED', 'NEEDS_CORRECTION', 'REJECTED'],
  APPROVED: ['PAYMENT_PROCESSING', 'REJECTED'],
  PAYMENT_PROCESSING: ['PAID'],
  PAID: [],
  REJECTED: [],
  CANCELLED: [],
} as const;

export const TERMINAL_STATUSES: readonly ApplicationStatus[] = ['PAID', 'REJECTED', 'CANCELLED'];

/** Sabab majburiy bo'lgan o'tishlar. */
export const REASON_REQUIRED: readonly ApplicationStatus[] = ['REJECTED', 'NEEDS_CORRECTION'];

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function isTerminal(status: ApplicationStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Foydalanuvchiga ko'rsatiladigan timeline bosqichlari (chiziqli yo'l). */
export const TIMELINE_STEPS: readonly ApplicationStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'SCORING',
  'LOCAL_REVIEW',
  'APPROVED',
  'PAYMENT_PROCESSING',
  'PAID',
];

export const STATUS_LABEL_UZ: Record<ApplicationStatus, string> = {
  DRAFT: 'Tugallanmagan',
  SUBMITTED: 'Ariza yuborildi',
  UNDER_REVIEW: 'Dastlabki tekshiruv',
  NEEDS_CORRECTION: 'Tuzatish kerak',
  SCORING: 'Skoring jarayonida',
  LOCAL_REVIEW: 'Mahalliy ko‘rib chiqish',
  APPROVED: 'Tasdiqlandi',
  PAYMENT_PROCESSING: 'To‘lovga yuborildi',
  PAID: 'To‘landi',
  REJECTED: 'Rad etildi',
  CANCELLED: 'Bekor qilindi',
};

export const STATUS_DESCRIPTION_UZ: Record<ApplicationStatus, string> = {
  DRAFT: 'Ariza hali yuborilmagan. Istalgan vaqtda davom ettirishingiz mumkin.',
  SUBMITTED: 'Ariza ro‘yxatga olindi va navbatga qo‘yildi.',
  UNDER_REVIEW: 'Ma’lumotlaringiz va hujjatlaringiz tekshirilmoqda.',
  NEEDS_CORRECTION: 'Arizada kamchilik topildi. Tuzatib, qayta yuboring.',
  SCORING: 'Ariza avtomatik baholash bosqichida.',
  LOCAL_REVIEW: 'Mahalliy komissiya arizani ko‘rib chiqmoqda.',
  APPROVED: 'Ariza ma’qullandi. To‘lov jarayoni boshlanadi.',
  PAYMENT_PROCESSING: 'To‘lov topshirig‘i shakllantirildi.',
  PAID: 'Mablag‘ ko‘rsatilgan hisobingizga o‘tkazildi.',
  REJECTED: 'Ariza rad etildi. Sababini ko‘rib, qayta ariza berishingiz mumkin.',
  CANCELLED: 'Ariza bekor qilindi.',
};

/** Bu statusda foydalanuvchi harakati kutilyaptimi? */
export function needsUserAction(status: ApplicationStatus): boolean {
  return status === 'DRAFT' || status === 'NEEDS_CORRECTION';
}
