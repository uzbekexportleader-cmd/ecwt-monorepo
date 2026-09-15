/** ECWT — umumiy konstantalar (mobil, API va admin uchun bitta manba). */

/**
 * Bazaviy hisoblash miqdori.
 * DIQQAT: har yili o'zgaradi. Productionda backend konfiguratsiyasidan
 * (env yoki admin panel) olinadi — bu yerdagi qiymat faqat dev/demo uchun.
 */
export const BHM_DEFAULT = 412_000;

export const SUPPORTED_LOCALES = ['uz', 'ru', 'en'] as const;
export const DEFAULT_LOCALE = 'uz';

export const OTP_LENGTH = 6;
export const OTP_TTL_SECONDS = 120;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL_DAYS = 30;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_UPLOAD_MIME = ['application/pdf', 'image/jpeg', 'image/png'] as const;

/** ECWT xizmat ko'rsatadigan marketplace'lar. */
export const MARKETPLACES = [
  { code: 'AMAZON', name: 'Amazon', emoji: '📦' },
  { code: 'EBAY', name: 'eBay', emoji: '🛍️' },
  { code: 'WALMART', name: 'Walmart', emoji: '🏬' },
  { code: 'TIKTOK_SHOP', name: 'TikTok Shop', emoji: '🎵' },
  { code: 'POSHMARK', name: 'Poshmark', emoji: '👗' },
  { code: 'MERCARI', name: 'Mercari', emoji: '🧧' },
  { code: 'BONANZA', name: 'Bonanza', emoji: '🌿' },
  { code: 'FACEBOOK_MARKETPLACE', name: 'Facebook Marketplace', emoji: '👥' },
  { code: 'GOOGLE_MARKETPLACE', name: 'Google Marketplace', emoji: '🔍' },
] as const;

export type MarketplaceCode = (typeof MARKETPLACES)[number]['code'];

/** Profil to'ldirilganlik foizini hisoblashda ishlatiladigan og'irliklar. */
export const PROFILE_WEIGHTS = {
  phoneVerified: 10,
  personalInfo: 15,
  identityVerified: 15,
  craft: 10,
  address: 10,
  experience: 5,
  businessType: 10,
  membership: 10,
  bank: 15,
} as const;
