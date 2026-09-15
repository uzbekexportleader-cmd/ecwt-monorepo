'use client';

import React from 'react';
import { STATUS_LABEL_UZ, type ApplicationStatus } from '@ecwt/types';

export function formatSom(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.length !== 12) return raw;
  return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;
}

const STATUS_STYLE: Record<ApplicationStatus, { bg: string; fg: string }> = {
  DRAFT: { bg: 'rgba(111,128,166,0.15)', fg: '#a5b4d4' },
  SUBMITTED: { bg: 'rgba(96,165,250,0.15)', fg: '#60a5fa' },
  UNDER_REVIEW: { bg: 'rgba(96,165,250,0.15)', fg: '#60a5fa' },
  NEEDS_CORRECTION: { bg: 'rgba(251,191,36,0.15)', fg: '#fbbf24' },
  SCORING: { bg: 'rgba(0,194,224,0.15)', fg: '#00c2e0' },
  LOCAL_REVIEW: { bg: 'rgba(0,194,224,0.15)', fg: '#00c2e0' },
  APPROVED: { bg: 'rgba(52,211,153,0.15)', fg: '#34d399' },
  PAYMENT_PROCESSING: { bg: 'rgba(229,181,103,0.18)', fg: '#e5b567' },
  PAID: { bg: 'rgba(52,211,153,0.18)', fg: '#34d399' },
  REJECTED: { bg: 'rgba(248,113,113,0.15)', fg: '#f87171' },
  CANCELLED: { bg: 'rgba(111,128,166,0.15)', fg: '#6f80a6' },
};

export function StatusChip({ status }: { status: ApplicationStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="chip" style={{ backgroundColor: s.bg, color: s.fg }}>
      {STATUS_LABEL_UZ[status]}
    </span>
  );
}

export function Chip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'gold';
}) {
  const tones = {
    neutral: { bg: 'rgba(111,128,166,0.15)', fg: '#a5b4d4' },
    success: { bg: 'rgba(52,211,153,0.15)', fg: '#34d399' },
    warning: { bg: 'rgba(251,191,36,0.15)', fg: '#fbbf24' },
    danger: { bg: 'rgba(248,113,113,0.15)', fg: '#f87171' },
    info: { bg: 'rgba(96,165,250,0.15)', fg: '#60a5fa' },
    gold: { bg: 'rgba(229,181,103,0.18)', fg: '#e5b567' },
  };
  const t = tones[tone];
  return (
    <span className="chip" style={{ backgroundColor: t.bg, color: t.fg }}>
      {label}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--color-ink-secondary)]">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Loading({ label = 'Yuklanmoqda...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-[var(--color-ink-muted)]">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-line)] border-t-[var(--color-primary)]" />
      {label}
    </div>
  );
}

export function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="table-td text-center text-[var(--color-ink-muted)]">
        {text}
      </td>
    </tr>
  );
}

/** Hujjat turlarining o'zbekcha nomlari (UI da texnik enum ko'rinmasligi uchun). */
export const DOCUMENT_LABEL: Record<string, string> = {
  PASSPORT: 'Pasport / ID karta',
  MEMBERSHIP_CERTIFICATE: 'Uyushma a’zolik guvohnomasi',
  BUSINESS_REGISTRATION: 'Tadbirkorlik guvohnomasi',
  BANK_DETAILS: 'Bank rekvizitlari',
  CONTRACT: 'Shartnoma',
  INVOICE: 'Hisob-faktura',
  RECEIPT: 'Kvitansiya / to‘lov hujjati',
  PRODUCT_PHOTO: 'Mahsulot fotosi',
  WORKSHOP_PHOTO: 'Ustaxona fotosi',
  CERTIFICATE: 'Sertifikat',
  OTHER: 'Boshqa hujjat',
};
