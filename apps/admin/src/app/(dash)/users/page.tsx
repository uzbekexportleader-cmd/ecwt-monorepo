'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { Chip, EmptyRow, Loading, PageHeader, formatDate, formatPhone } from '@/lib/ui';

interface AdminUserRow {
  id: string;
  phone: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  completionPercent: number;
  region: string | null;
  businessType: string;
  membershipStatus: string;
  craft: string | null;
  applicationsCount: number;
  productsCount: number;
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin', 'users', { search, page }],
    queryFn: () => api.admin.users({ page, pageSize: 20, ...(search ? { search } : {}) }),
  });

  const items = (query.data?.items ?? []) as unknown as AdminUserRow[];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (query.data?.pageSize ?? 20)));

  return (
    <>
      <PageHeader title="Foydalanuvchilar" subtitle="Ro‘yxatdan o‘tgan hunarmandlar va xodimlar" />

      <div className="card mb-4 p-4">
        <label className="label" htmlFor="search">
          Qidirish
        </label>
        <input
          id="search"
          className="input max-w-md"
          placeholder="Ism yoki telefon raqami"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {query.isLoading ? <Loading /> : null}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr>
              <th className="table-th">Ism</th>
              <th className="table-th">Telefon</th>
              <th className="table-th">Rol</th>
              <th className="table-th">Hunar</th>
              <th className="table-th">Hudud</th>
              <th className="table-th">Profil</th>
              <th className="table-th">Arizalar</th>
              <th className="table-th">Ro‘yxatdan o‘tgan</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="hover:bg-[var(--color-surface-alt)]">
                <td className="table-td">
                  <Link
                    className="text-[var(--color-primary)] hover:underline"
                    href={`/users/${u.id}`}
                  >
                    {u.fullName ?? 'Ismi yo‘q'}
                  </Link>
                </td>
                <td className="table-td text-[var(--color-ink-secondary)]">{formatPhone(u.phone)}</td>
                <td className="table-td">
                  <Chip
                    label={u.role}
                    tone={u.role === 'USER' ? 'neutral' : u.role === 'REVIEWER' ? 'info' : 'gold'}
                  />
                </td>
                <td className="table-td">{u.craft ?? '—'}</td>
                <td className="table-td">{u.region ?? '—'}</td>
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${u.completionPercent}%`,
                          backgroundColor:
                            u.completionPercent >= 80
                              ? 'var(--color-success)'
                              : u.completionPercent >= 50
                                ? 'var(--color-primary)'
                                : 'var(--color-accent)',
                        }}
                      />
                    </div>
                    <span className="text-xs text-[var(--color-ink-muted)]">
                      {u.completionPercent}%
                    </span>
                  </div>
                </td>
                <td className="table-td">{u.applicationsCount}</td>
                <td className="table-td text-[var(--color-ink-muted)]">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
            {!query.isLoading && !items.length ? (
              <EmptyRow colSpan={8} text="Foydalanuvchi topilmadi" />
            ) : null}
          </tbody>
        </table>
      </div>

      {total > 20 ? (
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
