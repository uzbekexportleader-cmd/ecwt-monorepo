import type { Locale } from '@ecwt/contracts';

const INTL_LOCALE: Record<Locale, string> = {
  uz: 'uz-UZ',
  ru: 'ru-RU',
  en: 'en-US',
};

export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatUzs(value: number, locale: Locale = 'uz'): string {
  const formatted = new Intl.NumberFormat(INTL_LOCALE[locale]).format(Math.round(value));
  return locale === 'ru' ? `${formatted} сум` : `${formatted} so‘m`;
}

export function formatDate(value: string, locale: Locale = 'uz'): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
