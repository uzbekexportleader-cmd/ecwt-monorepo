import { z } from 'zod';

/* ------------------------------ umumiy ---------------------------------- */

/** O'zbekiston raqami: +998 XX XXX XX XX (faqat raqamlar saqlanadi) */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => /^998\d{9}$/.test(v), {
    message: 'Telefon raqami +998 bilan boshlanib, 12 ta raqamdan iborat bo‘lishi kerak',
  });

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Tasdiqlash kodi 6 ta raqamdan iborat');

export const pinflSchema = z
  .string()
  .trim()
  .regex(/^\d{14}$/, 'JShShIR 14 ta raqamdan iborat bo‘lishi kerak');

export const stirSchema = z
  .string()
  .trim()
  .regex(/^\d{9}$/, 'STIR 9 ta raqamdan iborat bo‘lishi kerak');

export const cardNumberSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 16, { message: 'Karta raqami 16 ta raqamdan iborat' });

export const bankAccountSchema = z
  .string()
  .trim()
  .regex(/^\d{20}$/, 'Hisob raqami 20 ta raqamdan iborat');

/** Ariza beruvchining eng kichik va eng katta yoshi */
export const MIN_AGE_YEARS = 16;
export const MAX_AGE_YEARS = 120;

/**
 * "YYYY-MM-DD" qatorining haqiqiy sana ekanini tekshiradi.
 *
 * Faqat regex yetarli emas: "2026-13-40" yoki "2025-02-30" ham naqshga
 * mos keladi, lekin bunday sana mavjud emas. Shu sababli sanani qurib,
 * u qaytadan xuddi shu qatorga aylanishini tekshiramiz.
 */
function isRealDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getUTCFullYear() === Number(y) &&
    date.getUTCMonth() + 1 === Number(m) &&
    date.getUTCDate() === Number(d)
  );
}

/** Sanadan bugungi kunga qadar to'liq yoshni hisoblaydi */
export function ageFromBirthDate(value: string, today = new Date()): number {
  const birth = new Date(`${value}T00:00:00Z`);
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

/**
 * Tug'ilgan sana: format + haqiqiylik + mantiqiy yosh oralig'i.
 *
 * Davlat subsidiyasi arizasi uchun ishlatiladi, shu sababli kelajakdagi
 * sana yoki 120 yoshdan katta qiymat qabul qilinmaydi.
 */
export const birthDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Sana YYYY-MM-DD ko‘rinishida')
  .refine(isRealDate, { message: 'Bunday sana mavjud emas' })
  .refine((v) => ageFromBirthDate(v) >= MIN_AGE_YEARS, {
    message: `Yosh kamida ${MIN_AGE_YEARS} bo‘lishi kerak`,
  })
  .refine((v) => ageFromBirthDate(v) <= MAX_AGE_YEARS, {
    message: 'Tug‘ilgan sana noto‘g‘ri',
  });

export const mfoSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, 'MFO 5 ta raqamdan iborat');

/* -------------------------------- auth ---------------------------------- */

export const otpRequestSchema = z.object({
  phone: phoneSchema,
});
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: otpCodeSchema,
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

export const adminLoginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(6, 'Parol kamida 6 belgidan iborat bo‘lishi kerak'),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

/**
 * Foydalanuvchi paroli.
 *
 * 8 belgi — admin paroliga qo'yilgan 6 dan qat'iyroq: bu yerda telefon
 * raqami ommaga ma'lum bo'lishi mumkin, ya'ni parol yagona to'siq bo'lib
 * qoladi. Murakkablik (katta harf, raqam) TALAB QILINMAYDI: hunarmandlar
 * uchun bu parolni qog'ozga yozib qo'yishga olib keladi, ya'ni xavfsizlikni
 * oshirmaydi. Uzunlik — eng samarali talab.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Parol kamida 8 belgidan iborat bo‘lishi kerak')
  .max(128, 'Parol juda uzun');

/** Telefon + parol bilan kirish (hunarmandlar uchun) */
export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Parolni kiriting'),
});
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Parol o'rnatish yoki almashtirish.
 *
 * `currentPassword` — parol ALLAQACHON bor bo'lsa majburiy. Busiz o'g'irlangan
 * telefonni qo'lga kiritgan odam parolni jimgina almashtirib, haqiqiy egasini
 * hisobidan chiqarib yuborardi.
 */
export const setPasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: passwordSchema,
});
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

/* ------------------------------- profil --------------------------------- */

export const businessTypeSchema = z.enum(['NONE', 'YATT', 'MCHJ', 'FAMILY_ENTERPRISE']);
export const genderSchema = z.enum(['MALE', 'FEMALE']);
export const activityTypeSchema = z.enum([
  'HUNARMAND',
  'AGRO_HOLDING',
  'TADBIRKOR',
  'TEXTILE',
  'ISHLAB_CHIQARUVCHI',
]);
export const paymentMethodSchema = z.enum(['SUBSIDY', 'SELF']);
export const onboardingStageSchema = z.enum([
  'PERSONAL',
  'ADDRESS',
  'LOCATION',
  'ACTIVITY_TYPE',
  'ACTIVITY_DETAILS',
  'SERVICES',
  'BANK',
  'PAYMENT',
  'CONTRACT',
  'DONE',
]);
export const membershipStatusSchema = z.enum(['NONE', 'PENDING', 'ACTIVE', 'EXPIRED']);

const optionalString = z.string().trim().max(500).optional().nullable();

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2, 'Ism kamida 2 belgi').max(60).optional().nullable(),
  lastName: z.string().trim().min(2, 'Familiya kamida 2 belgi').max(60).optional().nullable(),
  middleName: optionalString,
  gender: genderSchema.optional().nullable(),
  birthDate: birthDateSchema.optional().nullable(),
  pinfl: pinflSchema.optional().nullable(),
  passportSeries: z
    .string()
    .trim()
    .regex(/^[A-Z]{2}$/, 'Seriya ikki bosh harf, masalan AA')
    .optional()
    .nullable(),
  passportNumber: z
    .string()
    .trim()
    .regex(/^\d{7}$/, 'Pasport raqami 7 ta raqam')
    .optional()
    .nullable(),

  region: optionalString,
  district: optionalString,
  mahalla: optionalString,
  street: optionalString,
  houseNumber: z.string().trim().max(20).optional().nullable(),
  address: optionalString,
  /** GPS orqali aniqlangan joylashuv — foydalanuvchi ruxsat bersagina yuboriladi */
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  contactPhone: phoneSchema.optional().nullable(),

  activityType: activityTypeSchema.optional().nullable(),
  selectedMarketplaces: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  wantsBrandSite: z.boolean().optional(),
  wantsDropshipping: z.boolean().optional(),
  wantsChinaImport: z.boolean().optional(),
  paymentMethod: paymentMethodSchema.optional().nullable(),
  onboardingStage: onboardingStageSchema.optional(),

  businessType: businessTypeSchema.optional(),
  stir: stirSchema.optional().nullable(),
  organizationName: optionalString,
  craftCategoryId: z.string().optional().nullable(),
  craftSubcategoryId: z.string().optional().nullable(),
  yearsOfExperience: z.number().int().min(0).max(80).optional().nullable(),
  workshopAddress: optionalString,
  hasWorkshop: z.boolean().optional(),
  description: z.string().trim().max(2000).optional().nullable(),

  membershipStatus: membershipStatusSchema.optional(),
  membershipNumber: optionalString,

  bankAccount: bankAccountSchema.optional().nullable(),
  bankMfo: mfoSchema.optional().nullable(),
  bankName: optionalString,
  bankSwift: z
    .string()
    .trim()
    .regex(/^[A-Z0-9]{8}(?:[A-Z0-9]{3})?$/, 'SWIFT kod 8 yoki 11 belgidan iborat')
    .optional()
    .nullable(),
  bankCard: cardNumberSchema.optional().nullable(),
  bankHolderName: optionalString,

  hasApprentice: z.boolean().optional(),
  apprenticeCount: z.number().int().min(0).max(50).optional(),
  hasDisability: z.boolean().optional(),
  profilePhotoUrl: optionalString,
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/* ------------------------------ hujjatlar -------------------------------- */

export const documentTypeSchema = z.enum([
  'PASSPORT',
  'MEMBERSHIP_CERTIFICATE',
  'BUSINESS_REGISTRATION',
  'BANK_DETAILS',
  'CONTRACT',
  'INVOICE',
  'RECEIPT',
  'PRODUCT_PHOTO',
  'SELFIE',
  'SIGNED_CONTRACT',
  'WORKSHOP_PHOTO',
  'CERTIFICATE',
  'OTHER',
]);

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export const documentUploadSchema = z.object({
  type: documentTypeSchema,
});
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

/* ------------------------------- arizalar -------------------------------- */

export const createApplicationSchema = z.object({
  subsidyId: z.string().min(1, 'Subsidiya tanlanmagan'),
});
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const updateApplicationSchema = z.object({
  formData: z.record(z.string(), z.unknown()).optional(),
  requestedAmount: z.number().int().min(0).optional().nullable(),
  documentIds: z.array(z.string()).optional(),
});
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

export const submitApplicationSchema = z.object({
  /** Foydalanuvchi shartlarga rozilik bergani */
  consent: z.literal(true, { message: 'Rozilik berilishi shart' }),
  /** Elektron tasdiqlash — hozircha mock provider */
  signatureToken: z.string().min(1),
});
export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;

export const applicationStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'NEEDS_CORRECTION',
  'SCORING',
  'LOCAL_REVIEW',
  'APPROVED',
  'PAYMENT_PROCESSING',
  'PAID',
  'REJECTED',
  'CANCELLED',
]);

export const changeStatusSchema = z
  .object({
    toStatus: applicationStatusSchema,
    comment: z.string().trim().max(1000).optional(),
    reason: z.string().trim().max(1000).optional(),
    approvedAmount: z.number().int().min(0).optional(),
  })
  .refine(
    (v) => !(['REJECTED', 'NEEDS_CORRECTION'].includes(v.toStatus) && !v.reason?.trim()),
    { message: 'Rad etish yoki tuzatishga qaytarishda sabab majburiy', path: ['reason'] },
  );
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;

/* ------------------------------ subsidiya -------------------------------- */

export const requirementTypeSchema = z.enum([
  'AGE_RANGE',
  'BUSINESS_TYPE',
  'MEMBERSHIP',
  'REGION',
  'CRAFT_CATEGORY',
  'HAS_APPRENTICE',
  'HAS_BANK_ACCOUNT',
  'EXPERIENCE_YEARS',
  'PROFILE_COMPLETION',
  'DOCUMENT_UPLOADED',
  'HAS_WORKSHOP',
  'IDENTITY_VERIFIED',
  'MARKETPLACE_EXPENSE',
]);

export const subsidyRequirementSchema = z.object({
  type: requirementTypeSchema,
  condition: z.record(z.string(), z.unknown()),
  humanReadableText: z.string().trim().min(3),
  fixRoute: z.string().optional().nullable(),
  fixLabel: z.string().optional().nullable(),
  order: z.number().int().min(0).default(0),
});

export const subsidyDocumentRequirementSchema = z.object({
  documentType: documentTypeSchema,
  title: z.string().trim().min(3),
  hint: z.string().trim().max(300).optional().nullable(),
  isOptional: z.boolean().default(false),
});

export const upsertSubsidySchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, 'Slug faqat kichik harf, raqam va tire'),
  title: z.string().trim().min(3).max(200),
  shortDescription: z.string().trim().min(3).max(300),
  fullDescription: z.string().trim().min(3).max(5000),
  category: z.string().trim().min(2).max(100),
  organization: z.string().trim().min(2).max(200),
  legalBasisUrl: z.string().trim().max(500).optional().nullable(),
  applicationUrl: z.string().trim().max(500).optional().nullable(),
  amountType: z.enum(['FIXED', 'RANGE', 'PERCENT_OF_EXPENSE', 'BHM_MULTIPLE']),
  minAmount: z.number().int().min(0).optional().nullable(),
  maxAmount: z.number().int().min(0).optional().nullable(),
  amountFactor: z.number().min(0).optional().nullable(),
  amountPerApprentice: z.boolean().default(false),
  processingDays: z.number().int().min(1).max(180),
  activeFrom: z.string().optional().nullable(),
  activeUntil: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']),
  isDemo: z.boolean().default(true),
  requirements: z.array(subsidyRequirementSchema).default([]),
  requiredDocuments: z.array(subsidyDocumentRequirementSchema).default([]),
});
export type UpsertSubsidyInput = z.infer<typeof upsertSubsidySchema>;

/* ------------------------------ mahsulot --------------------------------- */

export const upsertProductSchema = z.object({
  title: z.string().trim().min(3, 'Mahsulot nomi kamida 3 belgi').max(200),
  description: z.string().trim().max(3000).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  price: z.number().int().min(0).optional().nullable(),
  currency: z.string().trim().length(3).default('UZS'),
  weightGram: z.number().int().min(0).optional().nullable(),
  lengthMm: z.number().int().min(0).optional().nullable(),
  widthMm: z.number().int().min(0).optional().nullable(),
  heightMm: z.number().int().min(0).optional().nullable(),
  material: z.string().trim().max(200).optional().nullable(),
  productionDays: z.number().int().min(0).max(365).optional().nullable(),
  stock: z.number().int().min(0).default(0),
  imageUrls: z.array(z.string()).max(10).optional(),
});
export type UpsertProductInput = z.infer<typeof upsertProductSchema>;

export const publishProductSchema = z.object({
  marketplaceIds: z.array(z.string()).min(1, 'Kamida bitta marketplace tanlang'),
});
export type PublishProductInput = z.infer<typeof publishProductSchema>;

/* --------------------------------- AI ------------------------------------ */

export const aiAskSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  context: z.record(z.string(), z.unknown()).optional(),
});
export type AiAskInput = z.infer<typeof aiAskSchema>;

/* ----------------------------- bildirishnoma ------------------------------ */

export const sendNotificationSchema = z.object({
  userIds: z.array(z.string()).optional(),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(500),
  route: z.string().trim().max(200).optional().nullable(),
});
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;

/* ------------------------- push bildirishnoma ----------------------------- */

/**
 * Expo push token formati: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`.
 * Qat'iy tekshiramiz — noto'g'ri token jimgina saqlanib, keyin push
 * yetib bormaganda sababini topish qiyin bo'ladi.
 */
export const registerDeviceSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^ExponentPushToken\[[^\]]+\]$/, 'Expo push token formati noto‘g‘ri'),
  platform: z.enum(['ios', 'android', 'web']).optional(),
});
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;

/* -------------------------------- analitika ------------------------------- */

export const ANALYTICS_EVENT_NAMES = [
  'app.opened',
  'auth.otp.requested',
  'auth.otp.verified',
  'onboarding.step.viewed',
  'onboarding.step.completed',
  'onboarding.completed',
  'application.submitted',
  'product.created',
] as const;

export const analyticsEventSchema = z.object({
  name: z.enum(ANALYTICS_EVENT_NAMES),
  /**
   * Faqat oddiy qiymatlar — obyekt ichida shaxsiy ma'lumot yashirinib
   * ketmasligi uchun (ism, telefon, hujjat raqami logga tushmasin).
   */
  props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  occurredAt: z.iso.datetime().optional(),
});
export type AnalyticsEventInputSchema = z.infer<typeof analyticsEventSchema>;

export const analyticsBatchSchema = z.object({
  /** Bitta so'rovda ko'pi bilan 50 ta — offline navbat cheklangan bo'lsin */
  events: z.array(analyticsEventSchema).min(1).max(50),
  appVersion: z.string().trim().max(32).optional(),
  platform: z.string().trim().max(16).optional(),
});
export type AnalyticsBatchInput = z.infer<typeof analyticsBatchSchema>;

/* -------------------------------- pagination ------------------------------ */

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
});
export type PaginationInput = z.infer<typeof paginationSchema>;

/* --------------------- sotuvchi arizasi (operator) ---------------------- */

/**
 * Operator qarori.
 *
 * Rad etish va "qo'shimcha ma'lumot kerak" holatlarida sabab MAJBURIY:
 * foydalanuvchi nima qilishi kerakligini bilmasa, ariza shu yerda o'lib
 * qoladi va u qo'ng'iroq qilishga majbur bo'ladi.
 */
export const sellerDecisionSchema = z
  .object({
    status: z.enum(['UNDER_REVIEW', 'MORE_INFO_NEEDED', 'APPROVED', 'REJECTED']),
    note: z.string().trim().max(1000).optional(),
  })
  .refine((v) => !['MORE_INFO_NEEDED', 'REJECTED'].includes(v.status) || Boolean(v.note?.length), {
    message: 'Sababni yozing — foydalanuvchi nima qilishi kerakligini bilishi shart',
    path: ['note'],
  });
export type SellerDecisionInput = z.infer<typeof sellerDecisionSchema>;

/* ------------------ online-mahalla.uz subsidiya arizasi ----------------- */

/**
 * Platformadan olingan ariza raqami.
 *
 * Raqam formati platforma tomonidan beriladi va o'zgarishi mumkin, shu
 * sababli qat'iy shakl talab qilinmaydi — faqat bo'sh bo'lmasligi va
 * odam ko'chirib yozadigan uzunlikda bo'lishi tekshiriladi.
 */
export const externalSubsidySubmitSchema = z.object({
  externalNumber: z
    .string()
    .trim()
    .min(3, 'Ariza raqamini kiriting')
    .max(64, 'Ariza raqami juda uzun'),
  note: z.string().trim().max(1000).optional(),
});
export type ExternalSubsidySubmitInput = z.infer<typeof externalSubsidySubmitSchema>;

/**
 * Holatni qo'lda yangilash.
 *
 * `SUBMITTED` bu yerda yo'q: u faqat ariza raqami kiritilganda qo'yiladi,
 * ya'ni "topshirildi" degan holat dalilsiz paydo bo'lmaydi.
 */
export const externalSubsidyStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
  note: z.string().trim().max(1000).optional(),
});
export type ExternalSubsidyStatusInput = z.infer<typeof externalSubsidyStatusSchema>;

/* --------------------------- mahsulot tekshiruvi ------------------------ */

/**
 * Operator qarori.
 *
 * Tuzatish so'ralganda izoh MAJBURIY: "rad etildi" deb qo'yib, sababini
 * aytmaslik — hunarmandni qorong'uda qoldirish.
 */
export const productReviewSchema = z
  .object({
    decision: z.enum(['APPROVED', 'CHANGES_REQUESTED']),
    note: z.string().trim().max(1000).optional(),
  })
  .refine((v) => v.decision !== 'CHANGES_REQUESTED' || Boolean(v.note?.length), {
    message: 'Nimani tuzatish kerakligini yozing',
    path: ['note'],
  });
export type ProductReviewInput = z.infer<typeof productReviewSchema>;

/** Qoldiq: manfiy bo'lmasin, real bo'lmagan katta son ham kiritilmasin */
export const productStockSchema = z.object({
  stock: z.number().int().min(0).max(100000),
});
export type ProductStockInput = z.infer<typeof productStockSchema>;

/* ------------------- savdo kanaliga qo'lda joylashtirish ---------------- */

/**
 * Operator mahsulotni platformaga joylagach belgilaydi.
 *
 * Havola MAJBURIY va haqiqiy URL bo'lishi shart: "joyladim" degan
 * so'zning o'zi dalil emas — hunarmand e'lonni ochib ko'ra olishi kerak.
 */
export const listingPlacedSchema = z.object({
  listingUrl: z.string().trim().url('To‘liq havola kiriting (https://...)'),
  externalId: z.string().trim().max(128).optional(),
});
export type ListingPlacedInput = z.infer<typeof listingPlacedSchema>;

/* ---------------------- kompaniya va asoschi haqida --------------------- */

export const companyInfoSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  legalName: optionalString,
  stir: stirSchema.optional().nullable(),
  founderName: optionalString,
  founderTitle: optionalString,
  founderBio: z.string().trim().max(2000).optional().nullable(),
  founderPhone: optionalString,
  supportPhone: optionalString,
  supportTelegram: optionalString,
  supportEmail: z.string().trim().email().optional().nullable(),
  addressLine: optionalString,
  payeeName: optionalString,
  payeeAccount: optionalString,
  payeeMfo: optionalString,
  payeeBank: optionalString,
  payeeNote: optionalString,
});
export type CompanyInfoInput = z.infer<typeof companyInfoSchema>;

/**
 * Joylashuv faqat GPS'dan keladi.
 *
 * Qiymatlar Yer koordinatalari chegarasida bo'lishi tekshiriladi — noto'g'ri
 * son xaritani okean o'rtasiga olib boradi.
 */
export const companyLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  addressLine: optionalString,
});
export type CompanyLocationInput = z.infer<typeof companyLocationSchema>;

/* --------------------------- xizmat to'lovi ----------------------------- */

/**
 * Hunarmand o'tkazma hujjatini yuboradi.
 *
 * Hujjat MAJBURIY: "o'tkazdim" degan so'zning o'zi dalil emas, operator
 * tekshiradigan narsa bo'lishi kerak.
 */
export const servicePaymentProofSchema = z.object({
  documentId: z.string().min(1, 'To‘lov hujjatini yuklang'),
  amount: z.number().int().min(1000).max(1_000_000_000),
  note: z.string().trim().max(1000).optional(),
});
export type ServicePaymentProofInput = z.infer<typeof servicePaymentProofSchema>;

/**
 * Operator qarori.
 *
 * Rad etilganda sabab majburiy — hunarmand nimani tuzatishini bilishi kerak.
 */
export const servicePaymentDecisionSchema = z
  .object({
    decision: z.enum(['CONFIRMED', 'REJECTED']),
    note: z.string().trim().max(1000).optional(),
  })
  .refine((v) => v.decision !== 'REJECTED' || Boolean(v.note?.length), {
    message: 'Nima uchun qabul qilinmadi — yozing',
    path: ['note'],
  });
export type ServicePaymentDecisionInput = z.infer<typeof servicePaymentDecisionSchema>;

/** Subsidiya kelganini hunarmand bildiradi */
export const subsidyArrivedSchema = z.object({
  note: z.string().trim().max(1000).optional(),
});
export type SubsidyArrivedInput = z.infer<typeof subsidyArrivedSchema>;

/* ------------------------------ shartnoma ------------------------------- */

/**
 * Shartnoma shabloni.
 *
 * Matn uzun bo'ladi (bir necha sahifa), shuning uchun chegara ham katta.
 * O'rin egallar `{{fullName}}` ko'rinishida yoziladi.
 */
export const contractTemplateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().min(50, 'Shartnoma matni juda qisqa').max(200_000),
});
export type ContractTemplateInput = z.infer<typeof contractTemplateSchema>;

/** Imzolangan nusxani qayd etish (operator) */
export const contractSignedSchema = z.object({
  documentId: z.string().min(1).optional(),
});
export type ContractSignedInput = z.infer<typeof contractSignedSchema>;

/* --------------------------- hunarmand yo'li ---------------------------- */

/**
 * 12-qadam: mahallaga borib Hokim yordamchisi bilan uchrashish.
 *
 * Telefon raqami MAJBURIY — ECWT ham shu raqam orqali bog'lanadi,
 * ya'ni u ishlaydigan raqam bo'lishi kerak.
 */
export const mahallaVisitSchema = z.object({
  assistantName: z.string().trim().min(3, 'F.I.Sh. ni yozing').max(200),
  assistantPhone: phoneSchema,
  visitedAt: z.string().trim().optional(),
  note: z.string().trim().max(1000).optional(),
});
export type MahallaVisitInput = z.infer<typeof mahallaVisitSchema>;

/** 17-qadam: savdo usuli, bir marta tanlanadi */
export const salesModeSchema = z.object({
  mode: z.enum(['FBM', 'FBA']),
});
export type SalesModeInput = z.infer<typeof salesModeSchema>;

/**
 * 20-qadam: xalqaro e'lon matni.
 *
 * Yo hunarmand matnni o'zi yozadi (ikkala maydon ham to'liq), yo ECWT
 * tayyorlashini so'raydi. Yarim to'ldirilgan matn maydonchaga chiqmaydi,
 * shuning uchun ikkalasi birga talab qilinadi.
 */
export const listingContentSchema = z
  .object({
    productId: z.string().uuid(),
    titleEn: z.string().trim().min(10, 'Sarlavha juda qisqa').max(200).optional(),
    descriptionEn: z.string().trim().min(30, 'Tavsif juda qisqa').max(4000).optional(),
    byEcwt: z.boolean().optional(),
  })
  .refine((v) => v.byEcwt === true || (Boolean(v.titleEn) && Boolean(v.descriptionEn)), {
    message: 'Sarlavha va tavsifni to‘liq yozing yoki ECWT tayyorlashini tanlang',
  });
export type ListingContentInput = z.infer<typeof listingContentSchema>;
