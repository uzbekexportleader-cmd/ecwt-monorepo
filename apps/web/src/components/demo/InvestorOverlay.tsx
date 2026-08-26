'use client';

import { X } from 'lucide-react';
import type { Locale } from '@ecwt/contracts';
import { INVESTOR_NOTES, type DemoScreen } from './demo-state';

const CLOSE_LABEL: Record<Locale, string> = {
  uz: 'Yopish',
  ru: 'Закрыть',
  en: 'Close',
};

/**
 * Investor qatlami — har qadamning biznes ma’nosini ko‘rsatadi.
 *
 * Pitch paytida `I` tugmasi bilan yoqiladi: ekranda mahsulot oqimi
 * qoladi, ustiga esa o‘sha qadamning iqtisodiy ko‘rsatkichi chiqadi.
 */
export function InvestorOverlay({
  locale,
  screen,
  onClose,
}: {
  locale: Locale;
  screen: DemoScreen;
  onClose: () => void;
}) {
  const entry = INVESTOR_NOTES[screen];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 flex justify-center px-4 sm:bottom-20 sm:justify-end sm:px-8">
      <div className="pointer-events-auto w-full max-w-sm rounded-card border border-brand-800 bg-brand-950 p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-gold-300">
              {entry.metric[locale]}
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-white">{entry.value}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={CLOSE_LABEL[locale]}
            className="-mr-1 -mt-1 rounded-md p-1 text-brand-400 transition-colors hover:bg-brand-900 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-brand-200">{entry.note[locale]}</p>
      </div>
    </div>
  );
}
