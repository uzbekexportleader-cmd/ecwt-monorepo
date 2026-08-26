import type {
  ListingStatus,
  Locale,
  OrderStatus,
  PaymentStatus,
  PayoutStatus,
  ProductStatus,
  SupplierStatus,
} from '@ecwt/contracts';
import type { Tone } from '@/components/ui/Badge';

/**
 * Holat nomlari 3 tilda + rang.
 *
 * Backend faqat holat KODINI qaytaradi (masalan "PENDING_REVIEW"),
 * matn esa shu yerda — shunda til qo'shish uchun backend'ga tegish shart emas.
 */

type LabelMap<T extends string> = Record<T, Record<Locale, string>>;

export const SUPPLIER_STATUS_LABELS: LabelMap<SupplierStatus> = {
  DRAFT: { uz: 'To‘ldirilmoqda', ru: 'Заполняется', en: 'Draft' },
  PENDING_REVIEW: { uz: 'Tekshiruvda', ru: 'На проверке', en: 'Under review' },
  VERIFIED: { uz: 'Tasdiqlangan', ru: 'Подтверждён', en: 'Verified' },
  REJECTED: { uz: 'Rad etilgan', ru: 'Отклонён', en: 'Rejected' },
  SUSPENDED: { uz: 'To‘xtatilgan', ru: 'Приостановлен', en: 'Suspended' },
};

export const SUPPLIER_STATUS_TONES: Record<SupplierStatus, Tone> = {
  DRAFT: 'neutral',
  PENDING_REVIEW: 'warning',
  VERIFIED: 'success',
  REJECTED: 'danger',
  SUSPENDED: 'danger',
};

export const PRODUCT_STATUS_LABELS: LabelMap<ProductStatus> = {
  DRAFT: { uz: 'Qoralama', ru: 'Черновик', en: 'Draft' },
  PENDING_REVIEW: { uz: 'Tekshiruvda', ru: 'На проверке', en: 'Under review' },
  APPROVED: { uz: 'Tasdiqlangan', ru: 'Одобрен', en: 'Approved' },
  REJECTED: { uz: 'Rad etilgan', ru: 'Отклонён', en: 'Rejected' },
  ARCHIVED: { uz: 'Arxivlangan', ru: 'В архиве', en: 'Archived' },
};

export const PRODUCT_STATUS_TONES: Record<ProductStatus, Tone> = {
  DRAFT: 'neutral',
  PENDING_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  ARCHIVED: 'neutral',
};

export const LISTING_STATUS_LABELS: LabelMap<ListingStatus> = {
  DRAFT: { uz: 'Qoralama', ru: 'Черновик', en: 'Draft' },
  SUBMITTED: { uz: 'Yuborilgan', ru: 'Отправлен', en: 'Submitted' },
  IN_REVIEW: { uz: 'Ko‘rib chiqilmoqda', ru: 'На рассмотрении', en: 'In review' },
  LIVE: { uz: 'Sotuvda', ru: 'В продаже', en: 'Live' },
  REJECTED: { uz: 'Rad etilgan', ru: 'Отклонён', en: 'Rejected' },
  PAUSED: { uz: 'To‘xtatilgan', ru: 'Приостановлен', en: 'Paused' },
  ARCHIVED: { uz: 'Arxivlangan', ru: 'В архиве', en: 'Archived' },
};

export const LISTING_STATUS_TONES: Record<ListingStatus, Tone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'info',
  IN_REVIEW: 'warning',
  LIVE: 'success',
  REJECTED: 'danger',
  PAUSED: 'warning',
  ARCHIVED: 'neutral',
};

export const ORDER_STATUS_LABELS: LabelMap<OrderStatus> = {
  PENDING: { uz: 'Kutilmoqda', ru: 'Ожидает', en: 'Pending' },
  PAID: { uz: 'To‘langan', ru: 'Оплачен', en: 'Paid' },
  SHIPPED: { uz: 'Jo‘natilgan', ru: 'Отправлен', en: 'Shipped' },
  DELIVERED: { uz: 'Yetkazilgan', ru: 'Доставлен', en: 'Delivered' },
  CANCELLED: { uz: 'Bekor qilingan', ru: 'Отменён', en: 'Cancelled' },
  REFUNDED: { uz: 'Qaytarilgan', ru: 'Возвращён', en: 'Refunded' },
};

export const ORDER_STATUS_TONES: Record<OrderStatus, Tone> = {
  PENDING: 'neutral',
  PAID: 'info',
  SHIPPED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'danger',
};

export const PAYOUT_STATUS_LABELS: LabelMap<PayoutStatus> = {
  PENDING: { uz: 'Navbatda', ru: 'В очереди', en: 'Pending' },
  PROCESSING: { uz: 'Jarayonda', ru: 'В обработке', en: 'Processing' },
  PAID: { uz: 'To‘langan', ru: 'Выплачен', en: 'Paid' },
  FAILED: { uz: 'Xatolik', ru: 'Ошибка', en: 'Failed' },
  CANCELLED: { uz: 'Bekor qilingan', ru: 'Отменён', en: 'Cancelled' },
};

export const PAYOUT_STATUS_TONES: Record<PayoutStatus, Tone> = {
  PENDING: 'neutral',
  PROCESSING: 'info',
  PAID: 'success',
  FAILED: 'danger',
  CANCELLED: 'neutral',
};

export const PAYMENT_STATUS_LABELS: LabelMap<PaymentStatus> = {
  PENDING: { uz: 'Kutilmoqda', ru: 'Ожидает', en: 'Pending' },
  AUTHORIZED: { uz: 'Band qilingan', ru: 'Захолдирован', en: 'Authorized' },
  SUCCEEDED: { uz: 'To‘langan', ru: 'Оплачен', en: 'Succeeded' },
  FAILED: { uz: 'Muvaffaqiyatsiz', ru: 'Неудачно', en: 'Failed' },
  REFUNDED: { uz: 'Qaytarilgan', ru: 'Возвращён', en: 'Refunded' },
  PARTIALLY_REFUNDED: { uz: 'Qisman qaytarilgan', ru: 'Частичный возврат', en: 'Partly refunded' },
  CANCELLED: { uz: 'Bekor qilingan', ru: 'Отменён', en: 'Cancelled' },
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, Tone> = {
  PENDING: 'neutral',
  AUTHORIZED: 'info',
  SUCCEEDED: 'success',
  FAILED: 'danger',
  REFUNDED: 'warning',
  PARTIALLY_REFUNDED: 'warning',
  CANCELLED: 'neutral',
};

/** Kabinet menyusi va umumiy so'zlar */
export const UI_TEXT = {
  uz: {
    dashboard: 'Bosh sahifa',
    profile: 'Kompaniya profili',
    products: 'Mahsulotlar',
    listings: 'Marketplace e’lonlari',
    orders: 'Buyurtmalar',
    payouts: 'To‘lovlar',
    settings: 'Sozlamalar',
    logout: 'Chiqish',
    suppliers: 'Hamkorlar',
    leads: 'Arizalar',
    review: 'Ko‘rib chiqish',
    addProduct: 'Mahsulot qo‘shish',
    balance: 'Hisobdagi mablag‘',
    revenue: 'Umumiy savdo',
    liveListings: 'Sotuvdagi e’lonlar',
    totalOrders: 'Buyurtmalar',
    pendingPayout: 'To‘lanmagan',
    approvedProducts: 'Tasdiqlangan mahsulot',
    empty: 'Hozircha ma’lumot yo‘q',
    loadError: 'Ma’lumotni yuklab bo‘lmadi. Server ishlayotganini tekshiring.',
    backToSite: 'Saytga qaytish',
  },
  ru: {
    dashboard: 'Главная',
    profile: 'Профиль компании',
    products: 'Товары',
    listings: 'Листинги',
    orders: 'Заказы',
    payouts: 'Выплаты',
    settings: 'Настройки',
    logout: 'Выйти',
    suppliers: 'Партнёры',
    leads: 'Заявки',
    review: 'Проверка',
    addProduct: 'Добавить товар',
    balance: 'Баланс',
    revenue: 'Общая выручка',
    liveListings: 'Активные листинги',
    totalOrders: 'Заказов',
    pendingPayout: 'К выплате',
    approvedProducts: 'Одобренных товаров',
    empty: 'Пока нет данных',
    loadError: 'Не удалось загрузить данные. Проверьте, запущен ли сервер.',
    backToSite: 'Вернуться на сайт',
  },
  en: {
    dashboard: 'Overview',
    profile: 'Company profile',
    products: 'Products',
    listings: 'Marketplace listings',
    orders: 'Orders',
    payouts: 'Payouts',
    settings: 'Settings',
    logout: 'Sign out',
    suppliers: 'Suppliers',
    leads: 'Enquiries',
    review: 'Review',
    addProduct: 'Add product',
    balance: 'Balance',
    revenue: 'Total revenue',
    liveListings: 'Live listings',
    totalOrders: 'Orders',
    pendingPayout: 'Awaiting payout',
    approvedProducts: 'Approved products',
    empty: 'No data yet',
    loadError: 'Could not load data. Check that the server is running.',
    backToSite: 'Back to site',
  },
} as const;
