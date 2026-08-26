'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Globe } from 'lucide-react';
import { LOCALES, LOCALE_LABELS, type Locale } from '@ecwt/contracts';
import { cn } from '@/lib/utils';

/**
 * Til almashtirgich.
 *
 * Manzildagi til segmentini almashtiradi: `/ru/xizmatlar` -> `/en/xizmatlar`.
 * Tanlov cookie'ga middleware tomonidan yoziladi.
 */
export function LocaleSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function switchTo(locale: Locale): void {
    setOpen(false);

    // pathname doim "/<locale>/..." ko'rinishida — birinchi segmentni almashtiramiz
    const segments = pathname.split('/');
    segments[1] = locale;

    startTransition(() => {
      router.push(segments.join('/') || `/${locale}`);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Tilni tanlash"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-50"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span className="uppercase">{current}</span>
      </button>

      {open && (
        <>
          {/* Tashqariga bosilganda yopiladi */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />

          <ul
            role="listbox"
            className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-brand-100 bg-white py-1 shadow-lg"
          >
            {LOCALES.map((locale) => (
              <li key={locale}>
                <button
                  type="button"
                  role="option"
                  aria-selected={locale === current}
                  onClick={() => switchTo(locale)}
                  className={cn(
                    'flex w-full items-center px-3.5 py-2 text-left text-sm transition-colors hover:bg-brand-50',
                    locale === current ? 'font-semibold text-brand-800' : 'text-brand-600',
                  )}
                >
                  {LOCALE_LABELS[locale]}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
