'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { Locale } from '@ecwt/contracts';
import { ApiError, apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';

const TEXT = {
  uz: {
    approve: 'Tasdiqlash',
    reject: 'Rad etish',
    reasonLabel: 'Rad etish sababi',
    reasonPlaceholder: 'Nima to‘g‘rilanishi kerakligini aniq yozing...',
    confirm: 'Yuborish',
    cancel: 'Bekor qilish',
    working: 'Bajarilmoqda...',
    reasonRequired: 'Sababni yozing (kamida 5 belgi)',
  },
  ru: {
    approve: 'Одобрить',
    reject: 'Отклонить',
    reasonLabel: 'Причина отклонения',
    reasonPlaceholder: 'Чётко напишите, что нужно исправить...',
    confirm: 'Отправить',
    cancel: 'Отмена',
    working: 'Выполняем...',
    reasonRequired: 'Укажите причину (минимум 5 символов)',
  },
  en: {
    approve: 'Approve',
    reject: 'Reject',
    reasonLabel: 'Rejection reason',
    reasonPlaceholder: 'Clearly state what needs to be corrected...',
    confirm: 'Submit',
    cancel: 'Cancel',
    working: 'Working...',
    reasonRequired: 'Provide a reason (at least 5 characters)',
  },
} as const;

/**
 * Tasdiqlash / rad etish tugmalari.
 *
 * `endpoint` — POST qilinadigan manzil, `approvedStatus` — tasdiqlaganda
 * yuboriladigan holat (hamkor uchun VERIFIED, mahsulot uchun APPROVED).
 */
export function ReviewActions({
  locale,
  endpoint,
  approvedStatus,
}: {
  locale: Locale;
  endpoint: string;
  approvedStatus: 'VERIFIED' | 'APPROVED';
}) {
  const router = useRouter();
  const t = TEXT[locale];

  const [mode, setMode] = useState<'idle' | 'rejecting'>('idle');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(status: string, rejectReason?: string): Promise<void> {
    setBusy(true);
    setError(null);

    try {
      await apiFetch(endpoint, {
        method: 'POST',
        body: { status, ...(rejectReason ? { reason: rejectReason } : {}) },
      });
      setMode('idle');
      setReason('');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kutilmagan xato');
    } finally {
      setBusy(false);
    }
  }

  if (mode === 'rejecting') {
    return (
      <div className="w-full max-w-md space-y-2">
        <label htmlFor={`reason-${endpoint}`} className="block text-xs font-medium text-brand-700">
          {t.reasonLabel}
        </label>

        <Textarea
          id={`reason-${endpoint}`}
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t.reasonPlaceholder}
        />

        {error && (
          <p role="alert" className="text-xs font-medium text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="danger"
            disabled={busy}
            onClick={() => {
              if (reason.trim().length < 5) {
                setError(t.reasonRequired);
                return;
              }
              void send('REJECTED', reason.trim());
            }}
          >
            {busy ? t.working : t.confirm}
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setMode('idle');
              setError(null);
            }}
          >
            {t.cancel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-2">
        <Button size="sm" disabled={busy} onClick={() => void send(approvedStatus)}>
          <Check className="h-4 w-4" aria-hidden="true" />
          {t.approve}
        </Button>

        <Button size="sm" variant="outline" disabled={busy} onClick={() => setMode('rejecting')}>
          <X className="h-4 w-4" aria-hidden="true" />
          {t.reject}
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
