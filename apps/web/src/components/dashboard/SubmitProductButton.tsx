'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Send } from 'lucide-react';
import type { Locale } from '@ecwt/contracts';
import { ApiError, apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';

const TEXT = {
  uz: { submit: 'Tekshiruvga yuborish', submitting: 'Yuborilmoqda...' },
  ru: { submit: 'На проверку', submitting: 'Отправляем...' },
  en: { submit: 'Submit for review', submitting: 'Submitting...' },
} as const;

/** Mahsulotni ECWT tekshiruviga yuborish */
export function SubmitProductButton({
  locale,
  productId,
}: {
  locale: Locale;
  productId: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = TEXT[locale];

  async function handleSubmit(): Promise<void> {
    setSubmitting(true);
    setError(null);

    try {
      await apiFetch(`/products/${productId}/submit`, { method: 'POST' });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kutilmagan xato');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button size="sm" onClick={handleSubmit} disabled={submitting}>
        <Send className="h-4 w-4" aria-hidden="true" />
        {submitting ? t.submitting : t.submit}
      </Button>

      {error && (
        <p role="alert" className="max-w-xs text-right text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
