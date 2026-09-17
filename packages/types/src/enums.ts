/** ECWT — umumiy enum'lar. Prisma schema, API va mobil ilova shu ro'yxatga tayanadi. */

export const Role = {
  USER: 'USER',
  REVIEWER: 'REVIEWER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ApplicationStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  NEEDS_CORRECTION: 'NEEDS_CORRECTION',
  SCORING: 'SCORING',
  LOCAL_REVIEW: 'LOCAL_REVIEW',
  APPROVED: 'APPROVED',
  PAYMENT_PROCESSING: 'PAYMENT_PROCESSING',
  PAID: 'PAID',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const DocumentType = {
  PASSPORT: 'PASSPORT',
  MEMBERSHIP_CERTIFICATE: 'MEMBERSHIP_CERTIFICATE',
  BUSINESS_REGISTRATION: 'BUSINESS_REGISTRATION',
  BANK_DETAILS: 'BANK_DETAILS',
  CONTRACT: 'CONTRACT',
  INVOICE: 'INVOICE',
  RECEIPT: 'RECEIPT',
  PRODUCT_PHOTO: 'PRODUCT_PHOTO',
  SELFIE: 'SELFIE',
  SIGNED_CONTRACT: 'SIGNED_CONTRACT',
  WORKSHOP_PHOTO: 'WORKSHOP_PHOTO',
  CERTIFICATE: 'CERTIFICATE',
  OTHER: 'OTHER',
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const BusinessType = {
  NONE: 'NONE',
  YATT: 'YATT',
  MCHJ: 'MCHJ',
  FAMILY_ENTERPRISE: 'FAMILY_ENTERPRISE',
} as const;
export type BusinessType = (typeof BusinessType)[keyof typeof BusinessType];

export const MembershipStatus = {
  NONE: 'NONE',
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
} as const;
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];

export const VerificationStatus = {
  NOT_STARTED: 'NOT_STARTED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const SubsidyStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type SubsidyStatus = (typeof SubsidyStatus)[keyof typeof SubsidyStatus];

export const AmountType = {
  FIXED: 'FIXED',
  RANGE: 'RANGE',
  PERCENT_OF_EXPENSE: 'PERCENT_OF_EXPENSE',
  BHM_MULTIPLE: 'BHM_MULTIPLE',
} as const;
export type AmountType = (typeof AmountType)[keyof typeof AmountType];

/** Eligibility engine tekshiradigan talab turlari. */
export const RequirementType = {
  AGE_RANGE: 'AGE_RANGE',
  BUSINESS_TYPE: 'BUSINESS_TYPE',
  MEMBERSHIP: 'MEMBERSHIP',
  REGION: 'REGION',
  CRAFT_CATEGORY: 'CRAFT_CATEGORY',
  HAS_APPRENTICE: 'HAS_APPRENTICE',
  HAS_BANK_ACCOUNT: 'HAS_BANK_ACCOUNT',
  EXPERIENCE_YEARS: 'EXPERIENCE_YEARS',
  PROFILE_COMPLETION: 'PROFILE_COMPLETION',
  DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
  HAS_WORKSHOP: 'HAS_WORKSHOP',
  IDENTITY_VERIFIED: 'IDENTITY_VERIFIED',
  MARKETPLACE_EXPENSE: 'MARKETPLACE_EXPENSE',
} as const;
export type RequirementType = (typeof RequirementType)[keyof typeof RequirementType];

/** Talab bo'yicha natija. */
export const RequirementResult = {
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  NEEDS_CHECK: 'NEEDS_CHECK',
} as const;
export type RequirementResult = (typeof RequirementResult)[keyof typeof RequirementResult];

export const EligibilityVerdict = {
  ELIGIBLE: 'ELIGIBLE',
  PARTIAL: 'PARTIAL',
  NOT_ELIGIBLE: 'NOT_ELIGIBLE',
} as const;
export type EligibilityVerdict = (typeof EligibilityVerdict)[keyof typeof EligibilityVerdict];

export const NotificationType = {
  APPLICATION_SUBMITTED: 'APPLICATION_SUBMITTED',
  APPLICATION_STATUS: 'APPLICATION_STATUS',
  CORRECTION_REQUIRED: 'CORRECTION_REQUIRED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PAYMENT: 'PAYMENT',
  PROFILE: 'PROFILE',
  MARKETPLACE: 'MARKETPLACE',
  SYSTEM: 'SYSTEM',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const ProductStatus = {
  DRAFT: 'DRAFT',
  IN_REVIEW: 'IN_REVIEW',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  READY: 'READY',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const ListingStatus = {
  NOT_LISTED: 'NOT_LISTED',
  PENDING: 'PENDING',
  LISTED: 'LISTED',
  FAILED: 'FAILED',
} as const;
export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];

export const Locale = {
  UZ: 'uz',
  RU: 'ru',
  EN: 'en',
} as const;
export type Locale = (typeof Locale)[keyof typeof Locale];

/** Jinsi — davlat hujjatlarida talab qilinadi */
export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

/**
 * Foydalanuvchi kim.
 *
 * Ro'yxatdan o'tishda keyingi savollar shunga qarab o'zgaradi: hunarmandga
 * hunar savollari, agro holdingga boshqa savollar beriladi.
 */
export const ActivityType = {
  HUNARMAND: 'HUNARMAND',
  AGRO_HOLDING: 'AGRO_HOLDING',
  TADBIRKOR: 'TADBIRKOR',
  TEXTILE: 'TEXTILE',
  ISHLAB_CHIQARUVCHI: 'ISHLAB_CHIQARUVCHI',
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

/** Xizmat haqi qanday qoplanadi */
export const PaymentMethod = {
  SUBSIDY: 'SUBSIDY',
  SELF: 'SELF',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

/** Ro'yxatdan o'tish qaysi bosqichda to'xtagani */
export const OnboardingStage = {
  PERSONAL: 'PERSONAL',
  ADDRESS: 'ADDRESS',
  LOCATION: 'LOCATION',
  ACTIVITY_TYPE: 'ACTIVITY_TYPE',
  ACTIVITY_DETAILS: 'ACTIVITY_DETAILS',
  SERVICES: 'SERVICES',
  BANK: 'BANK',
  PAYMENT: 'PAYMENT',
  CONTRACT: 'CONTRACT',
  DONE: 'DONE',
} as const;
export type OnboardingStage = (typeof OnboardingStage)[keyof typeof OnboardingStage];

/**
 * Sotuvchi arizasining holati.
 *
 * Profil tekshiruvlaridan (`VerificationStatus`) ALOHIDA: u alohida
 * hujjatlar tasdig'i, bu esa "ECWT bu odamni sotuvchi sifatida qabul
 * qildimi" degan yakuniy qaror.
 */
export const SellerApplicationStatus = {
  UNDER_REVIEW: 'UNDER_REVIEW',
  MORE_INFO_NEEDED: 'MORE_INFO_NEEDED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type SellerApplicationStatus =
  (typeof SellerApplicationStatus)[keyof typeof SellerApplicationStatus];

/** online-mahalla.uz ga topshirilgan subsidiya arizasi holati */
export const ExternalSubsidyStatus = {
  PREPARED: 'PREPARED',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;
export type ExternalSubsidyStatus =
  (typeof ExternalSubsidyStatus)[keyof typeof ExternalSubsidyStatus];

/** Platforma formasining qadamlari (ekran nomlari bilan bir xil) */
export const MahallaFormStep = {
  APPLICANT: 'APPLICANT',
  ADDRESS: 'ADDRESS',
  REQUISITES: 'REQUISITES',
} as const;
export type MahallaFormStep = (typeof MahallaFormStep)[keyof typeof MahallaFormStep];

/** ECWT xizmat to'lovi holati */
export const ServicePaymentStatus = {
  AWAITING_SUBSIDY: 'AWAITING_SUBSIDY',
  AWAITING_TRANSFER: 'AWAITING_TRANSFER',
  PROOF_SUBMITTED: 'PROOF_SUBMITTED',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
} as const;
export type ServicePaymentStatus =
  (typeof ServicePaymentStatus)[keyof typeof ServicePaymentStatus];

/** Shartnoma holati */
export const ContractStatus = {
  DRAFT: 'DRAFT',
  ACCEPTED: 'ACCEPTED',
  SENT_FOR_SIGNING: 'SENT_FOR_SIGNING',
  SIGNED: 'SIGNED',
  DECLINED: 'DECLINED',
} as const;
export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];

/** Savdo usuli — bir marta tanlanadi */
export const SalesMode = {
  /** O'zbekistondan turib sotadi */
  FBM: 'FBM',
  /** AQSH omboriga oldindan jo'natadi */
  FBA: 'FBA',
} as const;
export type SalesMode = (typeof SalesMode)[keyof typeof SalesMode];

/**
 * Hunarmand yo'lidagi qadamlar.
 *
 * Ro'yxatdan o'tish (1–10) tugagach foydalanuvchi TO'G'RIDAN-TO'G'RI
 * kabinetga tushmaydi: mahsulot xalqaro savdoga chiqqunicha shu
 * qadamlardan birma-bir o'tadi. Qaysi qadamda ekani SERVERDA
 * hisoblanadi — ilova o'zicha taxmin qilmaydi va ilovadan chiqib
 * qaytganda ham aynan o'sha qadam ochiladi.
 */
export const JourneyStep = {
  /** 1–10: anketa tugatilmagan */
  ONBOARDING: 'ONBOARDING',
  /** 11: subsidiyaga ariza (faqat subsidiya yo'li) */
  SUBSIDY_APPLICATION: 'SUBSIDY_APPLICATION',
  /** 12: mahallaga borib Hokim yordamchisi bilan uchrashish */
  MAHALLA_VISIT: 'MAHALLA_VISIT',
  /** 13: mahalla 7-ligi qarorini kutish */
  COMMISSION_DECISION: 'COMMISSION_DECISION',
  /** 14: subsidiya tushgani tasdiqlandi */
  SUBSIDY_CONFIRMED: 'SUBSIDY_CONFIRMED',
  /** 15: ECWT xizmat haqini to'lash (ikki yo'l shu yerda birlashadi) */
  SERVICE_PAYMENT: 'SERVICE_PAYMENT',
  /** 16: to'lov hujjati tekshirilmoqda */
  PAYMENT_REVIEW: 'PAYMENT_REVIEW',
  /** 17: qayerdan sotasiz — FBM yoki FBA */
  SALES_MODE: 'SALES_MODE',
  /** 18: mahsulotni tayyorlash */
  PRODUCT_PREP: 'PRODUCT_PREP',
  /** 19: daromad kalkulyatori */
  EARNINGS_PREVIEW: 'EARNINGS_PREVIEW',
  /** 20: foto, video va xalqaro listing */
  CONTENT_PREP: 'CONTENT_PREP',
  /** 21: savdo maydonchasiga chiqarish */
  LISTING: 'LISTING',
  /** Yakun: mahsulot sotuvda, kabinet ochiq */
  DONE: 'DONE',
} as const;
export type JourneyStep = (typeof JourneyStep)[keyof typeof JourneyStep];
