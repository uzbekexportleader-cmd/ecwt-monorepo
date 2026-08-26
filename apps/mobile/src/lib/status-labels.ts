import type { Locale, OrderStatus, ProductStatus, SupplierStatus } from '@ecwt/contracts';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** Holat kodlarini 3 tilga o'giradi — saytdagi jadval bilan bir xil */
const SUPPLIER: Record<SupplierStatus, { label: Record<Locale, string>; tone: Tone }> = {
  DRAFT: {
    label: { uz: 'To‘ldirilmoqda', ru: 'Заполняется', en: 'Draft' },
    tone: 'neutral',
  },
  PENDING_REVIEW: {
    label: { uz: 'Tekshiruvda', ru: 'На проверке', en: 'Under review' },
    tone: 'warning',
  },
  VERIFIED: {
    label: { uz: 'Tasdiqlangan', ru: 'Подтверждён', en: 'Verified' },
    tone: 'success',
  },
  REJECTED: {
    label: { uz: 'Rad etilgan', ru: 'Отклонён', en: 'Rejected' },
    tone: 'danger',
  },
  SUSPENDED: {
    label: { uz: 'To‘xtatilgan', ru: 'Приостановлен', en: 'Suspended' },
    tone: 'danger',
  },
};

const PRODUCT: Record<ProductStatus, { label: Record<Locale, string>; tone: Tone }> = {
  DRAFT: { label: { uz: 'Qoralama', ru: 'Черновик', en: 'Draft' }, tone: 'neutral' },
  PENDING_REVIEW: {
    label: { uz: 'Tekshiruvda', ru: 'На проверке', en: 'Under review' },
    tone: 'warning',
  },
  APPROVED: { label: { uz: 'Tasdiqlangan', ru: 'Одобрен', en: 'Approved' }, tone: 'success' },
  REJECTED: { label: { uz: 'Rad etilgan', ru: 'Отклонён', en: 'Rejected' }, tone: 'danger' },
  ARCHIVED: { label: { uz: 'Arxivlangan', ru: 'В архиве', en: 'Archived' }, tone: 'neutral' },
};

const ORDER: Record<OrderStatus, { label: Record<Locale, string>; tone: Tone }> = {
  PENDING: { label: { uz: 'Kutilmoqda', ru: 'Ожидает', en: 'Pending' }, tone: 'neutral' },
  PAID: { label: { uz: 'To‘langan', ru: 'Оплачен', en: 'Paid' }, tone: 'info' },
  SHIPPED: { label: { uz: 'Jo‘natilgan', ru: 'Отправлен', en: 'Shipped' }, tone: 'info' },
  DELIVERED: { label: { uz: 'Yetkazilgan', ru: 'Доставлен', en: 'Delivered' }, tone: 'success' },
  CANCELLED: { label: { uz: 'Bekor qilingan', ru: 'Отменён', en: 'Cancelled' }, tone: 'danger' },
  REFUNDED: { label: { uz: 'Qaytarilgan', ru: 'Возвращён', en: 'Refunded' }, tone: 'danger' },
};

export function supplierStatus(status: SupplierStatus, locale: Locale) {
  return { label: SUPPLIER[status].label[locale], tone: SUPPLIER[status].tone };
}

export function productStatus(status: ProductStatus, locale: Locale) {
  return { label: PRODUCT[status].label[locale], tone: PRODUCT[status].tone };
}

export function orderStatus(status: OrderStatus, locale: Locale) {
  return { label: ORDER[status].label[locale], tone: ORDER[status].tone };
}
