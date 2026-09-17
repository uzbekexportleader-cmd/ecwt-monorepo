import type {
  AdminMetricsDto,
  AiMessageDto,
  AnalyticsBatchDto,
  ApplicationDto,
  ArtisanProfileDto,
  AuthResponse,
  AuthTokens,
  CraftCategoryDto,
  DocumentDto,
  EligibilityDto,
  FunnelStepDto,
  MarketplaceDto,
  NotificationDto,
  RegisterDeviceDto,
  OtpRequestResponse,
  Paginated,
  ProductDto,
  ProfileCompletionDto,
  CompanyInfoDto,
  ContractDto,
  JourneyDto,
  PricingQuoteDto,
  SalesMode,
  ContractPreviewDto,
  ServicePaymentDto,
  ExternalSubsidyDto,
  ExternalSubsidyStatus,
  MahallaPacketDto,
  SellerApplicationDto,
  SellerApplicationStatus,
  SessionUser,
  SubsidyDto,
  SubsidyWithEligibilityDto,
} from '@ecwt/types';

export class EcwtApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'EcwtApiError';
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** Server bilan umuman bog'lanib bo'lmadi (IP/firewall/server o'chiq) */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

/** Tokenlarni saqlash abstraksiyasi: mobil — SecureStore, admin — cookie/memory. */
export interface TokenStorage {
  getAccessToken(): Promise<string | null> | string | null;
  getRefreshToken(): Promise<string | null> | string | null;
  setTokens(tokens: AuthTokens): Promise<void> | void;
  clear(): Promise<void> | void;
}

export interface ApiClientOptions {
  baseUrl: string;
  storage: TokenStorage;
  /** Refresh ham muvaffaqiyatsiz bo'lsa chaqiriladi (logout) */
  onSessionExpired?: () => void;
  fetchImpl?: typeof fetch;
  /** Bitta so'rovga beriladigan maksimal vaqt (ms) */
  timeoutMs?: number;
}

/*
 * Server javob bermasa `fetch` o'zi juda uzoq (bir daqiqagacha) kutadi.
 * Shu vaqt ichida har ekranda aylanuvchi indikator turadi va odam
 * ilova "qotdi" deb o'ylaydi. Aniq chegara qo'yamiz: javob bo'lmasa
 * tez orada tushunarli xato chiqsin.
 */
const DEFAULT_TIMEOUT_MS = 12_000;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
  /** FormData yuborishda body'ni JSON qilmaslik uchun */
  raw?: boolean;
  signal?: AbortSignal;
}

export function createApiClient(options: ApiClientOptions) {
  const { baseUrl, storage, onSessionExpired } = options;
  const doFetch = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let refreshPromise: Promise<boolean> | null = null;

  async function refreshTokens(): Promise<boolean> {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) return false;
      try {
        const res = await doFetch(join(baseUrl, '/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const tokens = (await res.json()) as AuthTokens;
        await storage.setTokens(tokens);
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
    return refreshPromise;
  }

  async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, query, auth = true, raw = false, signal } = opts;
    const url = join(baseUrl, path) + buildQuery(query);

    const send = async (): Promise<Response> => {
      /*
       * Tunnel ogohlantirish sahifasini chetlab o'tish.
       *
       * ngrok bepul tarifi har so'rovga "davom etasizmi?" degan HTML
       * sahifani qo'yadi. Ilova JSON kutgan joyda HTML olsa, xato
       * tushunarsiz bo'lib chiqadi. Bu sarlavha bilan ngrok sahifani
       * ko'rsatmaydi; boshqa serverlar uni e'tiborsiz qoldiradi.
       */
      const headers: Record<string, string> = { 'ngrok-skip-browser-warning': '1' };
      if (!raw && body !== undefined) headers['Content-Type'] = 'application/json';
      if (auth) {
        const token = await storage.getAccessToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      // Har urinish uchun alohida taymer: qayta yuborishda vaqt yangidan boshlanadi
      const timer = new AbortController();
      const id = setTimeout(() => timer.abort(new Error('timeout')), timeoutMs);
      const onOuterAbort = () => timer.abort(signal?.reason);
      signal?.addEventListener('abort', onOuterAbort);

      try {
        return await doFetch(url, {
          method,
          headers,
          body: raw ? (body as BodyInit) : body !== undefined ? JSON.stringify(body) : undefined,
          signal: timer.signal,
        });
      } finally {
        clearTimeout(id);
        signal?.removeEventListener('abort', onOuterAbort);
      }
    };

    let res: Response;
    try {
      res = await send();
    } catch (networkError) {
      /*
       * Tarmoq umuman yo'q yoki server javob bermayapti (noto'g'ri IP,
       * firewall, o'chiq server) — LEKIN aynan shu joyda `fetch` boshqa
       * ko'plab sabablarga ko'ra ham rad etadi: yaroqsiz so'rov tanasi,
       * TLS xatosi, so'rov bekor qilinishi va h.k. Asl xato `details`ga
       * saqlanadi — aks holda haqiqiy sabab abadiy yo'qoladi va foydalanuvchi
       * internetini tekshirib, aslida internet aloqador bo'lmagan muammoni
       * qidirib yuradi.
       */
      const timedOut =
        networkError instanceof Error &&
        (networkError.name === 'AbortError' || networkError.message === 'timeout');
      throw new EcwtApiError(
        0,
        timedOut
          ? 'Server javob bermadi. Internet yoki Wi-Fi ulanishini tekshiring.'
          : 'Serverga ulanib bo‘lmadi. Internet yoki Wi-Fi ulanishini tekshiring.',
        'NETWORK_ERROR',
        networkError,
      );
    }

    if (res.status === 401 && auth) {
      const refreshed = await refreshTokens();
      if (refreshed) {
        try {
          res = await send();
        } catch {
          throw new EcwtApiError(0, 'Serverga ulanib bo‘lmadi.', 'NETWORK_ERROR');
        }
      } else {
        await storage.clear();
        onSessionExpired?.();
      }
    }

    if (!res.ok) {
      let message = `So‘rov muvaffaqiyatsiz (${res.status})`;
      let code: string | undefined;
      let details: unknown;
      try {
        const data = (await res.json()) as { message?: string | string[]; code?: string; details?: unknown };
        if (data?.message) message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        code = data?.code;
        details = data?.details;
      } catch {
        /* javob JSON emas */
      }
      throw new EcwtApiError(res.status, message, code, details);
    }

    if (res.status === 204) return undefined as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  return {
    request,

    /* ------------------------------ auth ------------------------------ */
    auth: {
      requestOtp: (phone: string) =>
        request<OtpRequestResponse>('/auth/otp/request', { method: 'POST', body: { phone }, auth: false }),
      verifyOtp: (phone: string, code: string) =>
        request<AuthResponse>('/auth/otp/verify', { method: 'POST', body: { phone, code }, auth: false }),
      adminLogin: (phone: string, password: string) =>
        request<AuthResponse>('/auth/admin/login', { method: 'POST', body: { phone, password }, auth: false }),
      /** Hunarmandlar uchun: telefon + parol bilan kirish */
      login: (phone: string, password: string) =>
        request<AuthResponse>('/auth/login', { method: 'POST', body: { phone, password }, auth: false }),
      /** Parol o'rnatish yoki almashtirish (kirgan foydalanuvchi) */
      setPassword: (body: { currentPassword?: string; newPassword: string }) =>
        request<void>('/auth/password', { method: 'POST', body }),
      /** Parol o'rnatilganmi — sozlamalar ekrani shunga qarab chiziladi */
      hasPassword: () => request<{ hasPassword: boolean }>('/auth/password'),
      refresh: (refreshToken: string) =>
        request<AuthTokens>('/auth/refresh', { method: 'POST', body: { refreshToken }, auth: false }),
      logout: (refreshToken: string) =>
        request<void>('/auth/logout', { method: 'POST', body: { refreshToken } }),
    },

    /* ------------------------------- me ------------------------------- */
    me: {
      get: () => request<SessionUser>('/me'),
      update: (body: { locale?: string; fullName?: string }) =>
        request<SessionUser>('/me', { method: 'PATCH', body }),
    },

    /* ----------------------------- profil ----------------------------- */
    profile: {
      get: () => request<ArtisanProfileDto>('/artisan-profile'),
      update: (body: Record<string, unknown>) =>
        request<ArtisanProfileDto>('/artisan-profile', { method: 'PUT', body }),
      completion: () => request<ProfileCompletionDto>('/artisan-profile/completion'),
      verify: (kind: 'identity' | 'face' | 'business' | 'membership' | 'bank') =>
        request<ArtisanProfileDto>(`/artisan-profile/verify/${kind}`, { method: 'POST' }),
    },

    /* --------------------- sotuvchi (hunarmand) arizasi ---------------- */
    sellerApplication: {
      /** `null` — anketa hali tugatilmagan, bu xato emas */
      mine: () => request<SellerApplicationDto | null>('/seller-application'),
      list: (status?: SellerApplicationStatus) =>
        request<SellerApplicationDto[]>('/seller-application/all', {
          query: status ? { status } : undefined,
        }),
      decide: (id: string, status: SellerApplicationStatus, note?: string) =>
        request<SellerApplicationDto>(`/seller-application/${id}/decision`, {
          method: 'POST',
          body: { status, note },
        }),
    },

    /* ---------------- online-mahalla.uz subsidiya arizasi ------------- */
    mahallaSubsidy: {
      packet: () => request<MahallaPacketDto>('/mahalla-subsidy/packet'),
      handoff: () => request<ExternalSubsidyDto>('/mahalla-subsidy/handoff', { method: 'POST' }),
      submission: (externalNumber: string, note?: string) =>
        request<ExternalSubsidyDto>('/mahalla-subsidy/submission', {
          method: 'POST',
          body: { externalNumber, note },
        }),
      status: (status: ExternalSubsidyStatus, note?: string) =>
        request<ExternalSubsidyDto>('/mahalla-subsidy/status', {
          method: 'PATCH',
          body: { status, note },
        }),
    },

    /* ------------------- kompaniya va asoschi haqida ------------------ */
    company: {
      get: () => request<CompanyInfoDto>('/company'),
      update: (body: Record<string, unknown>) =>
        request<CompanyInfoDto>('/company', { method: 'PATCH', body }),
      setLocation: (latitude: number, longitude: number, addressLine?: string) =>
        request<CompanyInfoDto>('/company/location', {
          method: 'POST',
          body: { latitude, longitude, addressLine },
        }),
    },

    /* ------------------------ xizmat to'lovi -------------------------- */
    servicePayment: {
      mine: () => request<ServicePaymentDto>('/service-payment'),
      subsidyArrived: (note?: string) =>
        request<ServicePaymentDto>('/service-payment/subsidy-arrived', {
          method: 'POST',
          body: { note },
        }),
      submitProof: (documentId: string, amount: number, note?: string) =>
        request<ServicePaymentDto>('/service-payment/proof', {
          method: 'POST',
          body: { documentId, amount, note },
        }),
    },

    /* ------------------------------ shartnoma ------------------------- */
    contract: {
      preview: () => request<ContractPreviewDto>('/contract'),
      create: () => request<ContractDto>('/contract', { method: 'POST' }),
      accept: () => request<ContractDto>('/contract/accept', { method: 'POST' }),
      send: () => request<ContractDto>('/contract/send', { method: 'POST' }),
      templates: () => request<{ version: number; title: string; isActive: boolean }[]>('/contract/templates'),
      saveTemplate: (title: string, body: string) =>
        request<{ version: number; unknownPlaceholders: string[] }>('/contract/templates', {
          method: 'POST',
          body: { title, body },
        }),
    },

    /* --------------------------- hunarmand yo'li ---------------------- */
    journey: {
      current: () => request<JourneyDto>('/journey'),
      mahallaVisit: (body: {
        assistantName: string;
        assistantPhone: string;
        visitedAt?: string;
        note?: string;
      }) => request<JourneyDto>('/journey/mahalla-visit', { method: 'POST', body }),
      salesMode: (mode: SalesMode) =>
        request<JourneyDto>('/journey/sales-mode', { method: 'POST', body: { mode } }),
      /* 19-qadam: hisob-kitob ko'rib chiqildi */
      earningsSeen: () => request<JourneyDto>('/journey/earnings-seen', { method: 'POST' }),
      /* 20-qadam: xalqaro e'lon matni */
      content: (body: {
        productId: string;
        titleEn?: string;
        descriptionEn?: string;
        byEcwt?: boolean;
      }) => request<JourneyDto>('/journey/content', { method: 'POST', body }),
    },

    /* ------------------------ narx hisob-kitobi ---------------------- */
    pricing: {
      quote: (productId: string) =>
        request<PricingQuoteDto>(`/pricing/quote/${encodeURIComponent(productId)}`),
    },

    craftCategories: {
      list: () => request<CraftCategoryDto[]>('/craft-categories', { auth: false }),
    },

    /* ---------------------------- hujjatlar --------------------------- */
    documents: {
      list: () => request<DocumentDto[]>('/documents'),
      upload: (form: FormData) =>
        request<DocumentDto>('/documents', { method: 'POST', body: form, raw: true }),
      remove: (id: string) => request<void>(`/documents/${id}`, { method: 'DELETE' }),
    },

    /* ---------------------------- subsidiya --------------------------- */
    subsidies: {
      list: (params?: { onlyEligible?: boolean }) =>
        request<SubsidyWithEligibilityDto[]>('/subsidies', { query: params }),
      get: (id: string) => request<SubsidyDto>(`/subsidies/${id}`),
      eligibility: (id: string) => request<EligibilityDto>(`/subsidies/${id}/eligibility`),
    },

    /* ---------------------------- arizalar ---------------------------- */
    applications: {
      list: () => request<ApplicationDto[]>('/applications'),
      get: (id: string) => request<ApplicationDto>(`/applications/${id}`),
      create: (subsidyId: string) =>
        request<ApplicationDto>('/applications', { method: 'POST', body: { subsidyId } }),
      update: (id: string, body: Record<string, unknown>) =>
        request<ApplicationDto>(`/applications/${id}`, { method: 'PATCH', body }),
      submit: (id: string, body: { consent: true; signatureToken: string }) =>
        request<ApplicationDto>(`/applications/${id}/submit`, { method: 'POST', body }),
      resubmit: (id: string, body: { consent: true; signatureToken: string }) =>
        request<ApplicationDto>(`/applications/${id}/resubmit`, { method: 'POST', body }),
      cancel: (id: string) => request<ApplicationDto>(`/applications/${id}/cancel`, { method: 'POST' }),
      attachDocument: (id: string, documentId: string) =>
        request<ApplicationDto>(`/applications/${id}/documents`, { method: 'POST', body: { documentId } }),
    },

    /* -------------------------- bildirishnoma ------------------------- */
    notifications: {
      list: () => request<NotificationDto[]>('/notifications'),
      markRead: (id: string) => request<void>(`/notifications/${id}/read`, { method: 'POST' }),
      markAllRead: () => request<void>('/notifications/read-all', { method: 'POST' }),
      unreadCount: () => request<{ count: number }>('/notifications/unread-count'),
      /** Qurilmani push uchun ro'yxatga olish */
      registerDevice: (body: RegisterDeviceDto) =>
        request<void>('/notifications/device', { method: 'POST', body }),
      /** Chiqishda: bu qurilmaga endi push yuborilmaydi */
      unregisterDevice: (body: RegisterDeviceDto) =>
        request<void>('/notifications/device', { method: 'DELETE', body }),
    },

    /* ----------------------------- analitika --------------------------- */
    analytics: {
      /**
       * Hodisalarni to'plam (batch) bilan yuboradi.
       * Kirmagan foydalanuvchida ham ishlaydi — endpoint ochiq.
       */
      send: (body: AnalyticsBatchDto) =>
        request<void>('/analytics/events', { method: 'POST', body }),
      funnel: (days?: number) =>
        request<FunnelStepDto[]>(`/analytics/funnel${days ? `?days=${days}` : ''}`),
    },

    /* ---------------------------- mahsulot ---------------------------- */
    products: {
      list: () => request<ProductDto[]>('/products'),
      get: (id: string) => request<ProductDto>(`/products/${id}`),
      create: (body: Record<string, unknown>) =>
        request<ProductDto>('/products', { method: 'POST', body }),
      update: (id: string, body: Record<string, unknown>) =>
        request<ProductDto>(`/products/${id}`, { method: 'PATCH', body }),
      remove: (id: string) => request<void>(`/products/${id}`, { method: 'DELETE' }),
      submitForReview: (id: string) =>
        request<ProductDto>(`/products/${id}/submit`, { method: 'POST' }),
      setStock: (id: string, stock: number) =>
        request<ProductDto>(`/products/${id}/stock`, { method: 'PATCH', body: { stock } }),
      publish: (id: string, marketplaceIds: string[]) =>
        request<ProductDto>(`/products/${id}/publish`, { method: 'POST', body: { marketplaceIds } }),
    },

    marketplaces: {
      list: () => request<MarketplaceDto[]>('/marketplaces'),
    },

    /* -------------------------------- AI ------------------------------ */
    ai: {
      ask: (message: string, context?: Record<string, unknown>) =>
        request<AiMessageDto>('/ai/ask', { method: 'POST', body: { message, context } }),
      history: () => request<AiMessageDto[]>('/ai/history'),
      status: () => request<{ connected: boolean; provider: string }>('/ai/status'),
    },

    /* ------------------------------ admin ----------------------------- */
    admin: {
      metrics: () => request<AdminMetricsDto>('/admin/metrics'),
      users: (query?: Record<string, string | number | undefined>) =>
        request<Paginated<SessionUser & { profile?: ArtisanProfileDto }>>('/admin/users', { query }),
      /** Hunarmandning to'liq kartochkasi — 10 qadam javoblari va hujjatlar */
      userCard: (id: string) => request<Record<string, unknown>>(`/admin/users/${id}`),
      applications: (query?: Record<string, string | number | undefined>) =>
        request<Paginated<ApplicationDto>>('/admin/applications', { query }),
      application: (id: string) => request<ApplicationDto>(`/admin/applications/${id}`),
      changeStatus: (
        id: string,
        body: { toStatus: string; comment?: string; reason?: string; approvedAmount?: number },
      ) => request<ApplicationDto>(`/admin/applications/${id}/status`, { method: 'POST', body }),
      subsidies: () => request<SubsidyDto[]>('/admin/subsidies'),
      upsertSubsidy: (body: Record<string, unknown>, id?: string) =>
        id
          ? request<SubsidyDto>(`/admin/subsidies/${id}`, { method: 'PUT', body })
          : request<SubsidyDto>('/admin/subsidies', { method: 'POST', body }),
      auditLog: (query?: Record<string, string | number | undefined>) =>
        request<Paginated<{ id: string; action: string; actorName: string; entity: string; createdAt: string }>>(
          '/admin/audit-log',
          { query },
        ),
      sendNotification: (body: Record<string, unknown>) =>
        request<{ sent: number }>('/admin/notifications', { method: 'POST', body }),
    },
  };
}

export type EcwtApiClient = ReturnType<typeof createApiClient>;

/* ----------------------------- yordamchilar ------------------------------ */

function join(base: string, path: string): string {
  return base.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
}

function buildQuery(query?: Record<string, string | number | boolean | undefined | null>): string {
  if (!query) return '';
  const parts = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}
