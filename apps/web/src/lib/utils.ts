import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind klasslarini xavfsiz birlashtirish (ziddiyatlarni hal qiladi) */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** 1234567 -> "1 234 567" */
export function formatNumber(value: number, locale = 'uz-UZ'): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatUzs(value: number): string {
  return `${new Intl.NumberFormat('uz-UZ').format(Math.round(value))} so‘m`;
}

export function formatDate(value: string | Date, locale = 'uz-UZ'): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value: string | Date, locale = 'uz-UZ'): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
