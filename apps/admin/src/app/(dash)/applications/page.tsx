'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { STATUS_LABEL_UZ, type ApplicationStatus } from '@ecwt/types';

import { api } from '@/lib/api';
import { EmptyRow, Loading, PageHeader, StatusChip, formatDate, formatSom } from '@/lib/ui';

const STATUSES = Object.keys(STATUS_LABEL_UZ) as ApplicationStatus[];

export default function ApplicationsPage() {
  const [status, setStatus] = useState<ApplicationStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin', 'applications', { status, search, page }],
    queryFn: () =>
      api.admin.applications({
        page,
        pageSize: 20,
        ...(status ? { status } : {}),
        ...(search ? { search } : {}),
      }),
  });

  const data = query.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <PageHeader title="Arizalar" subtitle="Barcha subsidiya arizalari va ularning holati" />

      <div className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[200px] flex-1">
          <label className="label" htmlFor="search">
            Qidirish
          </label>
          <input
            id="search"
            className="input"
            placeholder="Ariza raqami, ism yoki telefon"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="min-w-[200px]">
          <label className="label" htmlFor="status">
            Holat
          </label>
          <select
            id="status"
            className="input"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ApplicationStatus | '');
              setPage(1);
            }}
          >
            <option value="">Barchasi</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL_UZ[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {query.isLoading ? <Loading /> : null}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr>
              <th className="table-th">Raqam</th>
              <th className="table-th">Ariza beruvchi</th>
              <th className="table-th">Telefon</th>
              <th className="table-th">Dastur</th>
              <th className="table-th">Holat</th>
              <th className="table-th">Summa</th>
              <th className="table-th">Yuborilgan</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((a) => {
              const extra = a as typeof a & { applicantName?: string | null; applicantPhone?: string };
              return (
                <tr key={a.id} className="hover:bg-[var(--color-surface-alt)]">
                  <td className="table-td">
                    <Link href={`/applications/${a.id}`} className="text-[var(--color-primary)]">
                      {a.number}
                    </Link>
                  </td>
                  <td className="table-td">{extra.applicantName ?? '—'}</td>
                  <td className="table-td text-[var(--color-ink-secondary)]">
                    {extra.applicantPhone ?? '—'}
                  </td>
                  <td className="table-td">{a.subsidy?.title ?? '—'}</td>
                  <td className="table-td">
                    <StatusChip status={a.status} />
                  </td>
                  <td className="table-td">{formatSom(a.approvedAmount ?? a.requestedAmount)}</td>
                  <td className="table-td text-[var(--color-ink-muted)]">{formatDate(a.submittedAt)}</td>
                </tr>
              );
            })}
            {!query.isLoading && !data?.items.length ? (
              <EmptyRow colSpan={7} text="Ariza topilmadi" />
            ) : null}
          </tbody>
        </table>
      </div>

      {data && data.total > data.pageSize ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-[var(--color-ink-muted)]">
            Jami {data.total} ta · {page}/{totalPages}
          </span>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Oldingi
            </button>
            <button
              className="btn btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Keyingi
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
