'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { EmptyRow, Loading, PageHeader, formatDate } from '@/lib/ui';

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['admin', 'audit', page],
    queryFn: () => api.admin.auditLog({ page, pageSize: 50 }),
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <>
      <PageHeader
        title="Audit jurnali"
        subtitle="Har bir muhim harakat yoziladi. Jurnal faqat qo‘shiladi — o‘chirib bo‘lmaydi."
      />

      {query.isLoading ? <Loading /> : null}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr>
              <th className="table-th">Vaqt</th>
              <th className="table-th">Kim</th>
              <th className="table-th">Harakat</th>
              <th className="table-th">Obyekt</th>
              <th className="table-th">ID</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="hover:bg-[var(--color-surface-alt)]">
                <td className="table-td whitespace-nowrap text-[var(--color-ink-muted)]">
                  {formatDate(a.createdAt)}
                </td>
                <td className="table-td">{a.actorName}</td>
                <td className="table-td font-mono text-xs text-[var(--color-primary)]">{a.action}</td>
                <td className="table-td">{a.entity}</td>
                <td className="table-td font-mono text-xs text-[var(--color-ink-muted)]">
                  {(a as { entityId?: string | null }).entityId?.slice(0, 8) ?? '—'}
                </td>
              </tr>
            ))}
            {!query.isLoading && !items.length ? <EmptyRow colSpan={5} text="Yozuv yo‘q" /> : null}
          </tbody>
        </table>
      </div>

      {total > 50 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-[var(--color-ink-muted)]">
            Jami {total} ta · {page}/{totalPages}
          </span>
          <div className="flex gap-2">
            <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
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
