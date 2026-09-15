import type {
  ActivityType,
  AmountType,
  ApplicationStatus,
  BusinessType,
  ContractStatus,
  JourneyStep,
  DocumentType,
  EligibilityVerdict,
  ExternalSubsidyStatus,
  Gender,
  ListingStatus,
  Locale,
  MahallaFormStep,
  MembershipStatus,
  NotificationType,
  OnboardingStage,
  PaymentMethod,
  ProductStatus,
  RequirementResult,
  RequirementType,
  Role,
  SellerApplicationStatus,
  ServicePaymentStatus,
  SubsidyStatus,
  VerificationStatus,
} from './enums';

/* ------------------------------- auth ---------------------------------- */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SessionUser {
  id: string;
  phone: string;
  role: Role;
  locale: Locale;
  fullName: string | null;
  hasProfile: boolean;
}

export interface AuthResponse extends AuthTokens {
  user: SessionUser;
}

export interface OtpRequestResponse {
  /** Kod yuborilgan raqam (maskalangan) */
  phone: string;
  expiresInSec: number;
  /** FAQAT dev rejimida to'ldiriladi. Productionda hech qachon qaytmaydi. */
  devCode?: string;
}

/* ------------------------------ profil --------------------------------- */

export interface CraftCategoryDto {
  id: string;
  slug: string;
  nameUz: string;
  nameRu: string | null;
  nameEn: string | null;
  icon: string | null;
  parentId: string | null;
  isActive: boolean;
  children?: CraftCategoryDto[];
}

export interface ArtisanProfileDto {
  id: string;
  userId: string;

  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  birthDate: string | null;
  gender: Gender | null;
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

  businessType: BusinessType;
  stir: string | null;
  organizationName: string | null;
  craftCategoryId: string | null;
  craftCategory?: CraftCategoryDto | null;
  craftSubcategoryId: string | null;
  yearsOfExperience: number | null;
  workshopAddress: string | null;
  hasWorkshop: boolean;
  description: string | null;

  membershipStatus: MembershipStatus;
  membershipNumber: string | null;

  bankAccount: string | null;
  bankMfo: string | null;
  bankCardMasked: string | null;
  bankHolderName: string | null;

  activityType: ActivityType | null;
  selectedMarketplaces: string[];
  wantsBrandSite: boolean;
  wantsDropshipping: boolean;
  wantsChinaImport: boolean;
  paymentMethod: PaymentMethod | null;
  onboardingStage: OnboardingStage;
  contractSignedAt: string | null;
  bankName: string | null;
  bankSwift: string | null;

  identityVerification: VerificationStatus;
  faceVerification: VerificationStatus;
  businessVerification: VerificationStatus;
  membershipVerification: VerificationStatus;
  bankVerification: VerificationStatus;

  profilePhotoUrl: string | null;
  hasApprentice: boolean;
  apprenticeCount: number;
  hasDisability: boolean;

  completionPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileChecklistItem {
  key: string;
  label: string;
  status: 'DONE' | 'WARN' | 'MISSING';
  hint?: string;
  /** Mobil ilovada tuzatish uchun yo'nalish */
  route?: string;
}

export interface ProfileCompletionDto {
  percent: number;
  items: ProfileChecklistItem[];
}

/* ----------------------------- hujjatlar -------------------------------- */

export interface DocumentDto {
  id: string;
  type: DocumentType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  verified: boolean;
  createdAt: string;
}

/* ----------------------------- subsidiya -------------------------------- */

export interface SubsidyRequirementDto {
  id: string;
  type: RequirementType;
  /** Tekshiruv sharti, masalan { min: 18 } yoki { in: ['YATT','MCHJ'] } */
  condition: Record<string, unknown>;
  humanReadableText: string;
  /** Bajarilmasa mobil ilova qayerga yo'naltiradi */
  fixRoute: string | null;
  fixLabel: string | null;
  order: number;
}

export interface SubsidyDocumentRequirementDto {
  id: string;
  documentType: DocumentType;
  title: string;
  hint: string | null;
  isOptional: boolean;
}

export interface SubsidyDto {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  organization: string;
  legalBasisUrl: string | null;
  applicationUrl: string | null;

  amountType: AmountType;
  minAmount: number | null;
  maxAmount: number | null;
  /** PERCENT_OF_EXPENSE uchun foiz, BHM_MULTIPLE uchun koeffitsient */
  amountFactor: number | null;
  amountPerApprentice: boolean;

  processingDays: number;
  activeFrom: string | null;
  activeUntil: string | null;
  status: SubsidyStatus;
  isDemo: boolean;

  requirements: SubsidyRequirementDto[];
  requiredDocuments: SubsidyDocumentRequirementDto[];
  createdAt: string;
  updatedAt: string;
}

export interface RequirementCheckDto {
  requirementId: string;
  type: RequirementType;
  text: string;
  result: RequirementResult;
  /** Nima uchun bajarilmadi */
  reason: string | null;
  fixRoute: string | null;
  fixLabel: string | null;
}

export interface EligibilityDto {
  subsidyId: string;
  verdict: EligibilityVerdict;
  /** 0–100 */
  matchPercent: number;
  passedCount: number;
  totalCount: number;
  checks: RequirementCheckDto[];
  estimatedAmount: number | null;
  message: string;
}

export interface SubsidyWithEligibilityDto extends SubsidyDto {
  eligibility: EligibilityDto;
}

/* ------------------------------ arizalar -------------------------------- */

export interface ApplicationStatusHistoryDto {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  comment: string | null;
  reasonCode: string | null;
  actorName: string;
  createdAt: string;
}

export interface ApplicationDocumentDto {
  id: string;
  documentType: DocumentType;
  document: DocumentDto;
}

export interface ApplicationDto {
  id: string;
  number: string;
  subsidyId: string;
  subsidy?: Pick<SubsidyDto, 'id' | 'title' | 'organization' | 'processingDays' | 'isDemo'>;
  status: ApplicationStatus;
  requestedAmount: number | null;
  approvedAmount: number | null;
  /** Dasturga xos qo'shimcha maydonlar */
  formData: Record<string, unknown>;
  rejectionReason: string | null;
  correctionNote: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  paidAt: string | null;
  documents: ApplicationDocumentDto[];
  history: ApplicationStatusHistoryDto[];
  createdAt: string;
  updatedAt: string;
}

/* --------------------------- bildirishnoma ------------------------------ */

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  route: string | null;
  isRead: boolean;
  createdAt: string;
}

/* ---------------------------- marketplace ------------------------------- */

export interface MarketplaceDto {
  id: string;
  code: string;
  name: string;
  logoEmoji: string | null;
  isActive: boolean;
  /** Real integratsiya ulanganmi yoki mock rejimdami */
  isMock: boolean;
}

export interface ProductImageDto {
  id: string;
  url: string;
  order: number;
}

export interface ProductDto {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  price: number | null;
  currency: string;
  weightGram: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  material: string | null;
  productionDays: number | null;
  stock: number;
  status: ProductStatus;
  /** Operator izohi — nima tuzatilishi kerak */
  reviewNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  /**
   * Tekshiruvga yuborish uchun yetishmayotgan narsalar.
   *
   * Serverda hisoblanadi: qoida bitta joyda tursin, ilova o'zicha
   * taxmin qilmasin.
   */
  missingForReview: string[];
  /** Hozir tekshiruvga yuborish mumkinmi */
  canSubmitForReview: boolean;
  reviewHistory: ProductReviewEventDto[];
  images: ProductImageDto[];
  listings: MarketplaceListingDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductReviewEventDto {
  status: ProductStatus;
  note: string | null;
  createdAt: string;
}

export interface MarketplaceListingDto {
  id: string;
  marketplaceId: string;
  marketplace?: MarketplaceDto;
  status: ListingStatus;
  /** Platformadagi e'lon havolasi — faqat haqiqatan joylangandan keyin */
  listingUrl: string | null;
  placedAt: string | null;
  externalId: string | null;
  errorMessage: string | null;
  isMock: boolean;
  updatedAt: string;
}

/* ------------------------------- umumiy --------------------------------- */

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminMetricsDto {
  users: number;
  artisans: number;
  applications: number;
  pending: number;
  approved: number;
  rejected: number;
  paid: number;
  products: number;
  paidAmount: number;
}

export interface AiMessageDto {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

/* ------------------------- push bildirishnoma --------------------------- */

export interface RegisterDeviceDto {
  /** Expo push token: `ExponentPushToken[...]` */
  token: string;
  platform?: 'ios' | 'android' | 'web';
}

/* ------------------------------ analitika ------------------------------- */

/**
 * Mahsulot voronkasi hodisalari.
 *
 * Ro'yxat yopiq — shu bilan nomlar bir joyda turadi va mobil bilan server
 * bir xil tushunadi. Yangi hodisa kerak bo'lsa shu yerga qo'shiladi.
 */
export type AnalyticsEventName =
  /** Ilova ochildi */
  | 'app.opened'
  /** Telefon raqami kiritildi, OTP so'raldi */
  | 'auth.otp.requested'
  /** OTP tasdiqlandi — foydalanuvchi kirdi */
  | 'auth.otp.verified'
  /** Anketaning bir qadami ko'rsatildi */
  | 'onboarding.step.viewed'
  /** Anketaning bir qadami yakunlandi */
  | 'onboarding.step.completed'
  /** Anketa to'liq yakunlandi */
  | 'onboarding.completed'
  /** Subsidiyaga ariza yuborildi */
  | 'application.submitted'
  /** Mahsulot qo'shildi */
  | 'product.created';

export interface AnalyticsEventInput {
  name: AnalyticsEventName;
  /** Qo'shimcha kontekst — shaxsiy ma'lumot yozilmaydi */
  props?: Record<string, string | number | boolean | null>;
  /** Hodisa mijozda yuz bergan payt (ISO) — offline navbat uchun */
  occurredAt?: string;
}

export interface AnalyticsBatchDto {
  events: AnalyticsEventInput[];
  appVersion?: string;
  platform?: string;
}

/** Voronka hisoboti: qaysi qadamda necha kishi qolgan */
export interface FunnelStepDto {
  name: string;
  users: number;
  events: number;
}

/* ---------------------- sotuvchi (hunarmand) arizasi -------------------- */

export interface SellerApplicationEventDto {
  status: SellerApplicationStatus;
  note: string | null;
  createdAt: string;
}

export interface SellerApplicationDto {
  id: string;
  /** ECWT-2026-000123 */
  number: string;
  status: SellerApplicationStatus;
  /** Rad etish sababi yoki qanday ma'lumot yetishmayotgani */
  reviewerNote: string | null;
  submittedAt: string;
  decidedAt: string | null;
  history: SellerApplicationEventDto[];
  /**
   * Sotuvga chiqarish va pul olish ochiqmi.
   *
   * Backend hisoblab beradi — mobil ilova holatdan o'zi xulosa chiqarmasin,
   * aks holda qoida ikki joyda takrorlanadi va vaqt o'tib farq qiladi.
   */
  canSell: boolean;
}

/* ------------------ online-mahalla.uz subsidiya paketi ------------------ */

export interface MahallaFieldDto {
  /** Ichki kalit: `region`, `stir`, ... */
  key: string;
  step: MahallaFormStep;
  /** Platformadagi maydon nomi — foydalanuvchi ekranda o'shani ko'radi */
  label: string;
  /** Tayyor qiymat; `null` — profilda yo'q */
  value: string | null;
  hint: string | null;
  /** Qiymat yo'q bo'lsa, ilovada qayerda to'ldiriladi */
  fixRoute: string | null;
}

export interface ExternalSubsidyDto {
  id: string;
  platform: string;
  subsidyType: string;
  status: ExternalSubsidyStatus;
  externalNumber: string | null;
  note: string | null;
  preparedAt: string;
  submittedAt: string | null;
}

export interface MahallaPacketDto {
  /** Barcha majburiy maydon to'ldirilganmi */
  ready: boolean;
  /** Ariza topshiriladigan manzil */
  url: string;
  /** Platformadagi subsidiya turi matni (ro'yxatdan tanlanadi) */
  subsidyType: string;
  fields: MahallaFieldDto[];
  /** Yetishmayotgan maydonlar nomi */
  missing: string[];
  /** Oxirgi topshiriq yozuvi (bo'lsa) */
  submission: ExternalSubsidyDto | null;
}

/* ---------------------- kompaniya va asoschi haqida --------------------- */

export interface CompanyInfoDto {
  name: string;
  legalName: string | null;
  stir: string | null;

  founderName: string | null;
  founderTitle: string | null;
  founderBio: string | null;
  founderPhone: string | null;

  supportPhone: string | null;
  supportTelegram: string | null;
  supportEmail: string | null;

  latitude: number | null;
  longitude: number | null;
  addressLine: string | null;
  locationSetAt: string | null;
  /** Joylashuvni o'zgartirish huquqi bormi (faqat administrator) */
  canEdit: boolean;
}

/* --------------------------- xizmat to'lovi ----------------------------- */

export interface ServicePaymentEventDto {
  status: ServicePaymentStatus;
  note: string | null;
  createdAt: string;
}

export interface ServicePaymentDto {
  status: ServicePaymentStatus;
  declaredAmount: number | null;
  note: string | null;
  reviewerNote: string | null;
  receiptUrl: string | null;
  submittedAt: string | null;
  confirmedAt: string | null;
  history: ServicePaymentEventDto[];

  /**
   * Savdo bo'limlari ochiqmi.
   *
   * Serverda hisoblanadi: qoida bitta joyda tursin. Ilova holatdan o'zi
   * xulosa chiqarsa, vaqt o'tib ikkisi bir-biridan farq qiladi.
   */
  unlocked: boolean;

  /** Pul o'tkaziladigan rekvizitlar (faqat o'tkazma kutilayotganda) */
  payee: {
    name: string | null;
    account: string | null;
    mfo: string | null;
    bank: string | null;
    note: string | null;
  } | null;
}

/* ------------------------------ shartnoma ------------------------------- */

export interface ContractPlaceholderDto {
  /** `{{fullName}}` ichidagi nom */
  key: string;
  /** Odam tushunadigan nom */
  label: string;
  value: string | null;
  /** Qiymat yo'q bo'lsa qayerda to'ldiriladi */
  fixRoute: string | null;
}

export interface ContractDto {
  id: string;
  number: string;
  status: ContractStatus;
  /** To'ldirilgan matn — imzolash paytidagi nusxa */
  body: string;
  templateVersion: number;
  externalUrl: string | null;
  /** Hunarmand ilovada tasdiqlagan payt */
  acceptedAt: string | null;
  sentAt: string | null;
  signedAt: string | null;
  note: string | null;
  createdAt: string;
}

export interface ContractPreviewDto {
  /** Faol shablon versiyasi */
  templateVersion: number | null;
  title: string | null;
  /** To'ldirilgan matn (hali saqlanmagan) */
  body: string | null;
  placeholders: ContractPlaceholderDto[];
  /** Yetishmayotgan maydonlar nomi */
  missing: string[];
  ready: boolean;
  /** Mavjud shartnoma (bo'lsa) */
  contract: ContractDto | null;
  /**
   * E-imzo tizimi ulanganmi.
   *
   * `false` bo'lsa ilova "yuborildi" deb ko'rsatmaydi — shartnoma
   * qo'lda imzolanadi va fayli yuklanadi.
   */
  eSignatureReady: boolean;
}

/* ------------------------- hunarmand yo'li (tunnel) --------------------- */

export interface JourneyDto {
  /** Hozirgi qadam */
  step: JourneyStep;
  /** Nechanchi qadam (foydalanuvchiga ko'rsatiladigan raqam) */
  index: number;
  /** Jami qadamlar soni */
  total: number;

  /** Hozir nima bo'lyapti */
  now: string;
  /** Kimning harakati kutilmoqda */
  actor: 'ARTISAN' | 'MAHALLA' | 'ECWT' | 'MARKETPLACE';
  /** Foydalanuvchi keyin nima qiladi */
  next: string;

  /**
   * Foydalanuvchi shu qadamda biror amal qiladimi.
   *
   * `false` — kutish qadami: ekranda holat turadi, tugma bo'lmaydi.
   */
  actionable: boolean;

  /** Rad etilgan bo'lsa sababi (masalan mahalla qarori) */
  rejectionReason: string | null;
  /** Subsidiya yo'lidami yoki o'zi to'laydimi */
  selfPaid: boolean;
  /** Kabinet ochiqmi */
  cabinetUnlocked: boolean;
}

/* --------------------------- narx hisob-kitobi --------------------------- */

/**
 * Hisobning bitta qatori.
 *
 * `amountUzs` null bo'lishi mumkin — bu "qiymat hali ma'lum emas"
 * degani. Bunday qatorni nol deb ko'rsatish hunarmandni chalg'itadi,
 * shuning uchun ekranda alohida yoziladi.
 */
export interface PricingLineDto {
  key: string;
  label: string;
  amountUzs: number | null;
  note?: string;
}

/** 19-qadam: mahsulot bo'yicha xarajat va taxminiy tushum */
export interface PricingQuoteDto {
  productTitle: string;
  priceUzs: number | null;
  salesMode: string | null;
  paymentMethod: string | null;
  lines: PricingLineDto[];
  /** Barcha qator ma'lum bo'lgandagina hisoblanadi */
  netUzs: number | null;
  /** Hisobga kirmagan, lekin bilish kerak bo'lgan narsalar */
  unknowns: string[];
}
