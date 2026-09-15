'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { STATUS_LABEL_UZ } from '@ecwt/types';

import { api } from '@/lib/api';
import { Loading, PageHeader, StatusChip, formatDate, formatSom } from '@/lib/ui';

export default function DashboardPage() {
  const metrics = useQuery({ queryKey: ['admin', 'metrics'], queryFn: () => api.admin.metrics() });
  const recent = useQuery({
    queryKey: ['admin', 'applications', 'recent'],
    queryFn: () => api.admin.applications({ page: 1, pageSize: 8 }),
  });

  const m = metrics.data;

  const cards = [
    { label: 'Foydalanuvchilar', value: m?.users ?? 0, tone: 'var(--color-primary)' },
    { label: 'Hunarmandlar', value: m?.artisans ?? 0, tone: 'var(--color-accent)' },
    { label: 'Jami arizalar', value: m?.applications ?? 0, tone: 'var(--color-info)' },
    { label: 'Ko‘rib chiqilmoqda', value: m?.pending ?? 0, tone: 'var(--color-warning)' },
    { label: 'Tasdiqlangan', value: m?.approved ?? 0, tone: 'var(--color-success)' },
    { label: 'Rad etilgan', value: m?.rejected ?? 0, tone: 'var(--color-danger)' },
    { label: 'To‘langan', value: m?.paid ?? 0, tone: 'var(--color-success)' },
    { label: 'Mahsulotlar', value: m?.products ?? 0, tone: 'var(--color-primary)' },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Platforma bo‘yicha umumiy ko‘rsatkichlar"
      />

      {metrics.isLoading ? <Loading /> : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
              {c.label}
            </div>
            <div className="mt-2 text-3xl font-bold" style={{ color: c.tone }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-4 p-5">
        <div className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
          To‘langan subsidiyalar summasi
        </div>
        <div className="mt-2 text-3xl font-bold text-[var(--color-accent)]">
          {formatSom(m?.paidAmount ?? 0)}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">So‘nggi arizalar</h2>
        <Link href="/applications" className="text-sm text-[var(--color-primary)]">
          Barchasi →
        </Link>
      </div>

      <div className="card mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr>
              <th className="table-th">Raqam</th>
              <th className="table-th">Ariza beruvchi</th>
              <th className="table-th">Dastur</th>
              <th className="table-th">Holat</th>
              <th className="table-th">Summa</th>
              <th className="table-th">Yangilangan</th>
            </tr>
          </thead>
          <tbody>
            {(recent.data?.items ?? []).map((a) => {
              const extra = a as typeof a & { applicantName?: string | null; applicantPhone?: string };
              return (
                <tr key={a.id} className="hover:bg-[var(--color-surface-alt)]">
                  <td className="table-td">
                    <Link href={`/applications/${a.id}`} className="text-[var(--color-primary)]">
                      {a.number}
                    </Link>
                  </td>
                  <td className="table-td">{extra.applicantName ?? extra.applicantPhone ?? '—'}</td>
                  <td className="table-td">{a.subsidy?.title ?? '—'}</td>
                  <td className="table-td">
                    <StatusChip status={a.status} />
                  </td>
                  <td className="table-td">{formatSom(a.approvedAmount ?? a.requestedAmount)}</td>
                  <td className="table-td text-[var(--color-ink-muted)]">{formatDate(a.updatedAt)}</td>
                </tr>
              );
            })}
            {!recent.isLoading && !recent.data?.items.length ? (
              <tr>
                <td colSpan={6} className="table-td text-center text-[var(--color-ink-muted)]">
                  Hozircha ariza yo‘q
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--color-warning)] bg-[rgba(251,191,36,0.08)] p-4 text-sm text-[var(--color-warning)]">
        Diqqat: bazadagi subsidiya dasturlari <strong>demo</strong> ma’lumot. Ishga tushirishdan oldin
        rasmiy normativ hujjatlar asosida almashtirilishi kerak.
      </div>

      <div className="mt-4 text-xs text-[var(--color-ink-muted)]">
        Statuslar: {Object.values(STATUS_LABEL_UZ).join(' · ')}
      </div>
    </>
  );
}
