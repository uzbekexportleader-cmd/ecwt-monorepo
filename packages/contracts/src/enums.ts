/**
 * Barcha domen enum'lari. Prisma sxemasi bilan bir xil bo'lishi SHART.
 * Bu yerda o'zgartirsangiz, apps/api/prisma/schema.prisma da ham o'zgartiring.
 */

export const USER_ROLES = ['SUPPLIER', 'ADMIN', 'STAFF'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const SUPPLIER_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED',
] as const;
export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];

/** ECWT ishlayotgan / rejalashtirayotgan marketplace'lar */
export const MARKETPLACES = [
  'AMAZON_US',
  'ETSY',
  'EBAY',
  'WALMART',
  'SHOPIFY',
  'TIKTOK_SHOP',
] as const;
export type Marketplace = (typeof MARKETPLACES)[number];

export const MARKETPLACE_LABELS: Record<Marketplace, string> = {
  AMAZON_US: 'Amazon US',
  ETSY: 'Etsy',
  EBAY: 'eBay',
  WALMART: 'Walmart',
  SHOPIFY: 'Shopify',
  TIKTOK_SHOP: 'TikTok Shop',
};

export const PRODUCT_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'ARCHIVED',
] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const LISTING_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'IN_REVIEW',
  'LIVE',
  'REJECTED',
  'PAUSED',
  'ARCHIVED',
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYOUT_STATUSES = [
  'PENDING',
  'PROCESSING',
  'PAID',
  'FAILED',
  'CANCELLED',
] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export const PAYMENT_PROVIDERS = ['PAYME', 'CLICK', 'UZUM', 'STRIPE', 'PAYPAL'] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  PAYME: 'Payme',
  CLICK: 'Click',
  UZUM: 'Uzum Bank',
  STRIPE: 'Stripe',
  PAYPAL: 'PayPal',
};

/** Qaysi provayder qaysi valyutada ishlaydi */
export const PROVIDER_CURRENCY: Record<PaymentProvider, Currency> = {
  PAYME: 'UZS',
  CLICK: 'UZS',
  UZUM: 'UZS',
  STRIPE: 'USD',
  PAYPAL: 'USD',
};

export const PAYMENT_STATUSES = [
  'PENDING',
  'AUTHORIZED',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'CANCELLED',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const CURRENCIES = ['UZS', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DOCUMENT_TYPES = [
  'CERTIFICATE',
  'CONTRACT',
  'INVOICE',
  'EXPORT_DECLARATION',
  'PASSPORT',
  'OTHER',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Ilova tillari */
export const LOCALES = ['uz', 'ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'uz';

export const LOCALE_LABELS: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
  en: 'English',
};

/** O'zbekiston viloyatlari — hamkor profilidagi manzil uchun */
export const UZ_REGIONS = [
  'TOSHKENT_SHAHRI',
  'TOSHKENT',
  'ANDIJON',
  'BUXORO',
  'FARGONA',
  'JIZZAX',
  'XORAZM',
  'NAMANGAN',
  'NAVOIY',
  'QASHQADARYO',
  'QORAQALPOGISTON',
  'SAMARQAND',
  'SIRDARYO',
  'SURXONDARYO',
] as const;
export type UzRegion = (typeof UZ_REGIONS)[number];

export const UZ_REGION_LABELS: Record<UzRegion, string> = {
  TOSHKENT_SHAHRI: 'Toshkent shahri',
  TOSHKENT: 'Toshkent viloyati',
  ANDIJON: 'Andijon',
  BUXORO: 'Buxoro',
  FARGONA: "Farg'ona",
  JIZZAX: 'Jizzax',
  XORAZM: 'Xorazm',
  NAMANGAN: 'Namangan',
  NAVOIY: 'Navoiy',
  QASHQADARYO: 'Qashqadaryo',
  QORAQALPOGISTON: "Qoraqalpog'iston",
  SAMARQAND: 'Samarqand',
  SIRDARYO: 'Sirdaryo',
  SURXONDARYO: 'Surxondaryo',
};
