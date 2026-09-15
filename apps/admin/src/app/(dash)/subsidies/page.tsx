'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { Chip, EmptyRow, Loading, PageHeader, formatDate, formatSom } from '@/lib/ui';

const STATUS_TONE = {
  ACTIVE: 'success',
  DRAFT: 'neutral',
  INACTIVE: 'warning',
  ARCHIVED: 'neutral',
} as const;

export default function SubsidiesPage() {
  const query = useQuery({ queryKey: ['admin', 'subsidies'], queryFn: () => api.admin.subsidies() });
  const items = query.data ?? [];

  return (
    <>
      <PageHeader
        title="Subsidiya dasturlari"
        subtitle="Talablar va hujjatlar ro‘yxati eligibility dvigateli tomonidan ishlatiladi"
      />

      <div className="mb-4 rounded-xl border border-[var(--color-warning)] bg-[rgba(251,191,36,0.08)] p-4 text-sm text-[var(--color-warning)]">
        DEMO belgisi qo‘yilgan dasturlar namunaviy shartlarga ega. Rasmiy shartlar yuristlar tomonidan
        tasdiqlangach yangilanishi kerak.
      </div>

      {query.isLoading ? <Loading /> : null}

      <div className="space-y-4">
        {items.map((s) => (
          <div key={s.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{s.title}</h2>
                  {s.isDemo ? <Chip label="DEMO" tone="gold" /> : null}
                  <Chip label={s.status} tone={STATUS_TONE[s.status]} />
                </div>
                <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-secondary)]">
                  {s.shortDescription}
                </p>
              </div>
              <div className="text-right text-sm">
                <div className="text-[var(--color-ink-muted)]">Maksimal</div>
                <div className="font-semibold text-[var(--color-accent)]">
                  {formatSom(s.maxAmount)}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="label">Talablar ({s.requirements.length})</div>
                <ul className="space-y-1 text-sm text-[var(--color-ink-secondary)]">
                  {s.requirements.map((r) => (
                    <li key={r.id}>• {r.humanReadableText}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="label">Hujjatlar ({s.requiredDocuments.length})</div>
                <ul className="space-y-1 text-sm text-[var(--color-ink-secondary)]">
                  {s.requiredDocuments.map((d) => (
                    <li key={d.id}>
                      • {d.title}
                      {d.isOptional ? ' (ixtiyoriy)' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--color-ink-muted)]">
              <span>Tashkilot: {s.organization}</span>
              <span>Muddat: {s.processingDays} ish kuni</span>
              <span>Turi: {s.amountType}</span>
              <span>Yangilangan: {formatDate(s.updatedAt)}</span>
            </div>
          </div>
        ))}

        {!query.isLoading && !items.length ? (
          <div className="card overflow-hidden">
            <table className="w-full">
              <tbody>
                <EmptyRow colSpan={1} text="Dastur qo‘shilmagan" />
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <p className="mt-6 text-xs text-[var(--color-ink-muted)]">
        Dastur qo‘shish va tahrirlash API orqali mavjud (POST/PUT /admin/subsidies). Vizual muharrir
        keyingi bosqichda qo‘shiladi.
      </p>
    </>
  );
}
