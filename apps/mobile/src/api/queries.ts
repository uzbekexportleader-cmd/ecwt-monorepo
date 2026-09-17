import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import type {
  ApplicationDto,
  ArtisanProfileDto,
  CraftCategoryDto,
  DocumentDto,
  MarketplaceDto,
  NotificationDto,
  ProductDto,
  ProfileCompletionDto,
  ExternalSubsidyStatus,
  CompanyInfoDto,
  ContractPreviewDto,
  JourneyDto,
  SalesMode,
  ServicePaymentDto,
  MahallaPacketDto,
  SellerApplicationDto,
  SubsidyDto,
  SubsidyWithEligibilityDto,
} from '@ecwt/types';

import { api } from './client';

export const qk = {
  me: ['me'] as const,
  profile: ['profile'] as const,
  completion: ['profile', 'completion'] as const,
  crafts: ['craft-categories'] as const,
  documents: ['documents'] as const,
  subsidies: (onlyEligible?: boolean) => ['subsidies', { onlyEligible }] as const,
  subsidy: (id: string) => ['subsidies', id] as const,
  eligibility: (id: string) => ['subsidies', id, 'eligibility'] as const,
  applications: ['applications'] as const,
  application: (id: string) => ['applications', id] as const,
  notifications: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
  products: ['products'] as const,
  product: (id: string) => ['products', id] as const,
  marketplaces: ['marketplaces'] as const,
  aiHistory: ['ai', 'history'] as const,
  sellerApplication: ['seller-application'] as const,
  mahallaPacket: ['mahalla-subsidy', 'packet'] as const,
  company: ['company'] as const,
  servicePayment: ['service-payment'] as const,
  contract: ['contract'] as const,
  journey: ['journey'] as const,
  pricingQuote: (productId: string) => ['pricing', productId] as const,
};

/* --------------------- sotuvchi (hunarmand) arizasi ---------------------- */

/**
 * Anketa tugagach yaratiladigan ariza.
 *
 * `null` — ariza hali yo'q (anketa tugatilmagan). Bu xato emas, shuning
 * uchun qayta so'ralmaydi.
 */
export function useSellerApplication(): UseQueryResult<SellerApplicationDto | null> {
  return useQuery({
    queryKey: qk.sellerApplication,
    queryFn: () => api.sellerApplication.mine(),
  });
}

/* ----------------------------- hunarmand yo'li -------------------------- */

/**
 * Hozir qaysi qadamda ekani.
 *
 * Serverda hisoblanadi: ilova o'zicha taxmin qilmaydi. Har amaldan keyin
 * qayta so'raladi, shuning uchun qadam hech qachon eskirmaydi.
 */
export function useJourney(enabled = true): UseQueryResult<JourneyDto> {
  return useQuery({
    queryKey: qk.journey,
    queryFn: () => api.journey.current(),
    /*
     * Kutish qadamlarida holatni o'zimiz so'rab turamiz.
     *
     * Bunday qadamlarda navbat boshqada: mahalla qaror chiqaradi, ECWT
     * to'lovni tasdiqlaydi yoki mahsulotni joylashtiradi. Hunarmand
     * ekranga qarab o'tiradi va hech narsa o'zgarmaydi — chunki ilova
     * so'ramaydi. Natijada u "ishlamayapti" deb o'ylaydi.
     *
     * Harakat qilish NAVBATI o'zida bo'lganda so'rovni to'xtatamiz:
     * u yerda o'zgarish faqat uning o'z amalidan keyin bo'ladi.
     */
    refetchInterval: (query) => (query.state.data?.actionable === false ? 20_000 : false),
    /*
     * Kirmagan foydalanuvchida so'ramaymiz — aks holda har ochilishda
     * keraksiz 401 ketadi.
     */
    enabled,
  });
}

export function useMahallaVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { assistantName: string; assistantPhone: string; note?: string }) =>
      api.journey.mahallaVisit(v),
    onSuccess: (data) => qc.setQueryData(qk.journey, data),
  });
}

export function useChooseSalesMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mode: SalesMode) => api.journey.salesMode(mode),
    onSuccess: (data) => {
      qc.setQueryData(qk.journey, data);
      void qc.invalidateQueries({ queryKey: qk.profile });
    },
  });
}

/** 20-qadam: xalqaro e'lon matni (o'zi yozadi yoki ECWT tayyorlaydi) */
export function useSaveListingContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      productId: string;
      titleEn?: string;
      descriptionEn?: string;
      byEcwt?: boolean;
    }) => api.journey.content(v),
    onSuccess: (data) => {
      qc.setQueryData(qk.journey, data);
      void qc.invalidateQueries({ queryKey: qk.products });
    },
  });
}

/** 19-qadam: hisob-kitobni ko'rib, davom etish */
export function useEarningsSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.journey.earningsSeen(),
    onSuccess: (data) => qc.setQueryData(qk.journey, data),
  });
}

/**
 * 19-qadam: mahsulot bo'yicha xarajat va taxminiy tushum.
 *
 * Hisob SERVERDA qilinadi — tariflar u yerda bitta faylda turadi va
 * ilova ularni nusxalab yurmaydi (aks holda tarif o'zgarganda eski
 * ilovalar eski narxni ko'rsatib qolardi).
 */
export function usePricingQuote(productId: string | undefined) {
  return useQuery({
    queryKey: qk.pricingQuote(productId ?? ''),
    queryFn: () => api.pricing.quote(productId as string),
    enabled: Boolean(productId),
  });
}

/* ------------------------------- shartnoma ------------------------------ */

export function useContract(): UseQueryResult<ContractPreviewDto> {
  return useQuery({ queryKey: qk.contract, queryFn: () => api.contract.preview() });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.contract.create(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.contract }),
  });
}

export function useAcceptContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.contract.accept(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.contract }),
  });
}

/* ----------------------------- xizmat to'lovi --------------------------- */

export function useServicePayment(): UseQueryResult<ServicePaymentDto> {
  return useQuery({ queryKey: qk.servicePayment, queryFn: () => api.servicePayment.mine() });
}

export function useSubsidyArrived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) => api.servicePayment.subsidyArrived(note),
    onSuccess: (data) => qc.setQueryData(qk.servicePayment, data),
  });
}

export function useSubmitPaymentProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { documentId: string; amount: number; note?: string }) =>
      api.servicePayment.submitProof(v.documentId, v.amount, v.note),
    onSuccess: (data) => {
      qc.setQueryData(qk.servicePayment, data);
      // Qulf ochilishi mumkin — mahsulotlar ro'yxati ham yangilansin
      void qc.invalidateQueries({ queryKey: qk.products });
    },
  });
}

/* --------------------- kompaniya va asoschi haqida ---------------------- */

export function useCompany(): UseQueryResult<CompanyInfoDto> {
  return useQuery({ queryKey: qk.company, queryFn: () => api.company.get() });
}

/** Joylashuvni GPS orqali belgilash (faqat administrator) */
export function useSetCompanyLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { latitude: number; longitude: number; addressLine?: string }) =>
      api.company.setLocation(v.latitude, v.longitude, v.addressLine),
    onSuccess: (data) => qc.setQueryData(qk.company, data),
  });
}

/* ---------------- online-mahalla.uz subsidiya arizasi ------------------- */

export function useMahallaPacket(): UseQueryResult<MahallaPacketDto> {
  return useQuery({ queryKey: qk.mahallaPacket, queryFn: () => api.mahallaSubsidy.packet() });
}

/** Saytga o‘tishni qayd etadi — bu «topshirildi» degani emas */
export function useMahallaHandoff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.mahallaSubsidy.handoff(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.mahallaPacket }),
  });
}

export function useMahallaSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { externalNumber: string; note?: string }) =>
      api.mahallaSubsidy.submission(v.externalNumber, v.note),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.mahallaPacket });
      /*
       * Ariza raqami kiritilishi bilan yo'l keyingi qadamga o'tadi.
       * Bu so'ralmasa odam qaytganda hamon eski qadamni ko'rib turadi
       * va ishi bajarilmagandek tuyuladi.
       */
      void qc.invalidateQueries({ queryKey: qk.journey });
    },
  });
}

export function useMahallaStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { status: ExternalSubsidyStatus; note?: string }) =>
      api.mahallaSubsidy.status(v.status, v.note),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.mahallaPacket });
      // Rad etilgan yoki tasdiqlangan holat yo'lning qadamini o'zgartiradi
      void qc.invalidateQueries({ queryKey: qk.journey });
    },
  });
}

/* -------------------------------- profil -------------------------------- */

export function useProfile(): UseQueryResult<ArtisanProfileDto> {
  return useQuery({ queryKey: qk.profile, queryFn: () => api.profile.get() });
}

export function useCompletion(): UseQueryResult<ProfileCompletionDto> {
  return useQuery({ queryKey: qk.completion, queryFn: () => api.profile.completion() });
}

export function useCraftCategories(): UseQueryResult<CraftCategoryDto[]> {
  return useQuery({
    queryKey: qk.crafts,
    queryFn: () => api.craftCategories.list(),
    staleTime: 60 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.profile.update(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.profile });
      void qc.invalidateQueries({ queryKey: qk.completion });
      void qc.invalidateQueries({ queryKey: ['subsidies'] });
    },
  });
}

export function useVerify() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kind: 'identity' | 'business' | 'membership' | 'bank') => api.profile.verify(kind),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.profile });
      void qc.invalidateQueries({ queryKey: qk.completion });
      void qc.invalidateQueries({ queryKey: ['subsidies'] });
    },
  });
}

/* ------------------------------- hujjatlar ------------------------------- */

export function useDocuments(): UseQueryResult<DocumentDto[]> {
  return useQuery({ queryKey: qk.documents, queryFn: () => api.documents.list() });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => api.documents.upload(form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.documents });
      void qc.invalidateQueries({ queryKey: ['subsidies'] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.documents.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.documents }),
  });
}

/* ------------------------------- subsidiya ------------------------------- */

export function useSubsidies(onlyEligible?: boolean): UseQueryResult<SubsidyWithEligibilityDto[]> {
  return useQuery({
    queryKey: qk.subsidies(onlyEligible),
    queryFn: () => api.subsidies.list(onlyEligible ? { onlyEligible: true } : undefined),
  });
}

export function useSubsidy(id: string): UseQueryResult<SubsidyDto> {
  return useQuery({ queryKey: qk.subsidy(id), queryFn: () => api.subsidies.get(id), enabled: !!id });
}

export function useEligibility(id: string) {
  return useQuery({
    queryKey: qk.eligibility(id),
    queryFn: () => api.subsidies.eligibility(id),
    enabled: !!id,
  });
}

/* -------------------------------- arizalar ------------------------------- */

export function useApplications(): UseQueryResult<ApplicationDto[]> {
  return useQuery({
    queryKey: qk.applications,
    queryFn: () => api.applications.list(),
    // Status admin tomonidan o'zgarganda ilova o'zi yangilanadi
    refetchInterval: 20_000,
  });
}

export function useApplication(id: string): UseQueryResult<ApplicationDto> {
  return useQuery({
    queryKey: qk.application(id),
    queryFn: () => api.applications.get(id),
    enabled: !!id,
    refetchInterval: 15_000,
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subsidyId: string) => api.applications.create(subsidyId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.applications }),
  });
}

export function useUpdateApplication(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.applications.update(id, body),
    onSuccess: (data) => {
      qc.setQueryData(qk.application(id), data);
      void qc.invalidateQueries({ queryKey: qk.applications });
    },
  });
}

export function useSubmitApplication(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts: { resubmit?: boolean; signatureToken: string }) =>
      opts.resubmit
        ? api.applications.resubmit(id, { consent: true, signatureToken: opts.signatureToken })
        : api.applications.submit(id, { consent: true, signatureToken: opts.signatureToken }),
    onSuccess: (data) => {
      qc.setQueryData(qk.application(id), data);
      void qc.invalidateQueries({ queryKey: qk.applications });
      void qc.invalidateQueries({ queryKey: qk.notifications });
    },
  });
}

export function useAttachDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => api.applications.attachDocument(id, documentId),
    onSuccess: (data) => qc.setQueryData(qk.application(id), data),
  });
}

/* ----------------------------- bildirishnoma ----------------------------- */

export function useNotifications(): UseQueryResult<NotificationDto[]> {
  return useQuery({
    queryKey: qk.notifications,
    queryFn: () => api.notifications.list(),
    refetchInterval: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: qk.unread,
    queryFn: () => api.notifications.unreadCount(),
    refetchInterval: 30_000,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.notifications });
      void qc.invalidateQueries({ queryKey: qk.unread });
    },
  });
}

/* -------------------------------- mahsulot ------------------------------- */

export function useProducts(): UseQueryResult<ProductDto[]> {
  return useQuery({ queryKey: qk.products, queryFn: () => api.products.list() });
}

export function useProduct(id: string): UseQueryResult<ProductDto> {
  return useQuery({ queryKey: qk.product(id), queryFn: () => api.products.get(id), enabled: !!id });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.products.create(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.products }),
  });
}

export function useSubmitProductForReview(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.products.submitForReview(id),
    onSuccess: (data) => {
      qc.setQueryData(qk.product(id), data);
      void qc.invalidateQueries({ queryKey: qk.products });
    },
  });
}

export function useSetProductStock(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stock: number) => api.products.setStock(id, stock),
    onSuccess: (data) => {
      qc.setQueryData(qk.product(id), data);
      void qc.invalidateQueries({ queryKey: qk.products });
    },
  });
}

export function usePublishProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (marketplaceIds: string[]) => api.products.publish(id, marketplaceIds),
    onSuccess: (data) => {
      qc.setQueryData(qk.product(id), data);
      void qc.invalidateQueries({ queryKey: qk.products });
    },
  });
}

export function useMarketplaces(): UseQueryResult<MarketplaceDto[]> {
  return useQuery({
    queryKey: qk.marketplaces,
    queryFn: () => api.marketplaces.list(),
    staleTime: 30 * 60 * 1000,
  });
}

/* ----------------------------------- AI ---------------------------------- */

export function useAiHistory() {
  return useQuery({ queryKey: qk.aiHistory, queryFn: () => api.ai.history() });
}

/**
 * Haqiqiy AI xizmati ulanganmi.
 *
 * Ogohlantirish matni SHU javobga qarab ko'rsatiladi: kalit ulangan
 * kunda yozuv o'zi yo'qoladi va uni qo'lda o'chirish esdan chiqmaydi.
 */
export function useAiStatus() {
  return useQuery({
    queryKey: ['ai', 'status'] as const,
    queryFn: () => api.ai.status(),
    staleTime: 5 * 60_000,
  });
}

export function useAskAi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => api.ai.ask(message),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.aiHistory }),
  });
}
