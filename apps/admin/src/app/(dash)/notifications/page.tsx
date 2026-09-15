'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { sendNotificationSchema } from '@ecwt/validation';

import { api, EcwtApiError } from '@/lib/api';
import { PageHeader } from '@/lib/ui';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [route, setRoute] = useState('');
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState<number | null>(null);

  const send = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.admin.sendNotification(payload),
    onSuccess: (res) => {
      setSent(res.sent);
      setTitle('');
      setBody('');
      setRoute('');
      setError(undefined);
    },
    onError: (e) => setError(e instanceof EcwtApiError ? e.message : 'Yuborib bo‘lmadi'),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(null);
    const parsed = sendNotificationSchema.safeParse({
      title,
      body,
      route: route || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Ma’lumotlar noto‘g‘ri');
      return;
    }
    send.mutate(parsed.data);
  };

  return (
    <>
      <PageHeader
        title="Bildirishnoma yuborish"
        subtitle="Barcha hunarmand foydalanuvchilarga ilova ichida xabar yuboriladi"
      />

      <form onSubmit={submit} className="card max-w-2xl p-6">
        <div className="mb-4">
          <label className="label" htmlFor="title">
            Sarlavha
          </label>
          <input
            id="title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masalan: Yangi subsidiya dasturi"
          />
        </div>

        <div className="mb-4">
          <label className="label" htmlFor="body">
            Matn
          </label>
          <textarea
            id="body"
            className="input h-28 py-2"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Qisqa va tushunarli yozing."
          />
        </div>

        <div className="mb-6">
          <label className="label" htmlFor="route">
            Ilovadagi yo‘nalish (ixtiyoriy)
          </label>
          <input
            id="route"
            className="input"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            placeholder="/(tabs)/opportunities"
          />
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
            Foydalanuvchi bildirishnomani bosganda shu ekran ochiladi.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-[var(--color-danger)] bg-[rgba(248,113,113,0.1)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        ) : null}

        {sent !== null ? (
          <div className="mb-4 rounded-lg border border-[var(--color-success)] bg-[rgba(52,211,153,0.1)] px-3 py-2 text-sm text-[var(--color-success)]">
            {sent} ta foydalanuvchiga yuborildi.
          </div>
        ) : null}

        <button type="submit" className="btn btn-primary" disabled={send.isPending}>
          {send.isPending ? 'Yuborilmoqda...' : 'Yuborish'}
        </button>
      </form>
    </>
  );
}
