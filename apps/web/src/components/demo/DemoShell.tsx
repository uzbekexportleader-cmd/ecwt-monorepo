'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, BadgeCheck, Banknote, ChartNoAxesColumn, RotateCcw, Wand2, Warehouse } from 'lucide-react';
import { LOCALES, type Locale } from '@ecwt/contracts';
import { cn } from '@/lib/utils';
import { SHELL_COPY, STEP_LABELS } from './demo-copy';
import { DEMO_STEPS, stepIndex, type DemoScreen } from './demo-state';

const BENEFIT_ICONS = [BadgeCheck, Banknote, Warehouse] as const;

interface DemoShellProps {
  locale: Locale;
  screen: DemoScreen;
  furthest: number;
  investorMode: boolean;
  onBack: () => void;
  onJump: (screen: DemoScreen) => void;
  onAutofill: () => void;
  onRestart: () => void;
  onToggleInvestor: () => void;
  children: ReactNode;
}

/**
 * Varonkaning umumiy ramkasi: chapda brend paneli va qadam relsi,
 * o‘ngda joriy qadam.
 *
 * Mobil ekranda chap panel yig‘ilib, tepadagi ixcham sarlavhaga
 * aylanadi — pitch telefonda ham, proyektorda ham bir xil ishlaydi.
 */
export function DemoShell({
  locale,
  screen,
  furthest,
  investorMode,
  onBack,
  onJump,
  onAutofill,
  onRestart,
  onToggleInvestor,
  children,
}: DemoShellProps) {
  const shell = SHELL_COPY[locale];
  const labels = STEP_LABELS[locale];
  const index = stepIndex(screen);
  const total = DEMO_STEPS.length;

  return (
    <main className="min-h-screen bg-brand-50 lg:grid lg:min-h-screen lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      {/* Chap panel — desktop */}
      <aside data-surface="dark" className="hidden bg-brand-950 px-8 py-10 lg:flex lg:flex-col">
        <Link href={`/${locale}`} className="inline-flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 text-sm font-bold text-brand-950">
            E
          </span>
          <span className="text-base font-bold tracking-tight text-white">ECWT</span>
        </Link>

        <h2 className="mt-10 text-[22px] font-semibold leading-[1.25] tracking-[-0.02em] text-white">
          {shell.brandTagline}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-brand-300">{shell.brandSubtitle}</p>

        <ul className="mt-7 space-y-3">
          {shell.benefits.map((benefit, i) => {
            const Icon = BENEFIT_ICONS[i] ?? BadgeCheck;
            return (
              <li key={benefit} className="flex items-center gap-2.5">
                <Icon className="h-4.5 w-4.5 shrink-0 text-gold-300" aria-hidden="true" />
                <span className="text-sm text-brand-100">{benefit}</span>
              </li>
            );
          })}
        </ul>

        <StepRail
          screen={screen}
          furthest={furthest}
          labels={labels}
          onJump={onJump}
          className="mt-9"
        />

        <div className="mt-auto grid grid-cols-3 gap-3 border-t border-brand-800 pt-6">
          {shell.stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-lg font-bold text-white">{stat.value}</div>
              <div className="text-xs leading-tight text-brand-300">{stat.label}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* O‘ng ustun */}
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center gap-3 border-b border-brand-100 bg-white px-4 py-3 sm:px-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 lg:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-800 text-xs font-bold text-white">
              E
            </span>
            <span className="text-sm font-bold tracking-tight text-brand-950">ECWT</span>
          </Link>

          <ProgressDots index={index} total={total} className="hidden sm:flex" />
          <span className="text-xs font-medium text-brand-500">
            {shell.stepOf(Math.min(index + 1, total), total)}
          </span>

          <span className="ml-auto rounded-md bg-gold-100 px-2 py-1 text-xs font-medium text-gold-800">
            {shell.demoBadge}
          </span>

          <LocaleToggle locale={locale} />
        </header>

        {/* Mobil qadam nomi */}
        <div className="border-b border-brand-100 bg-white px-4 pb-3 sm:px-8 lg:hidden">
          <ProgressDots index={index} total={total} className="sm:hidden mb-2" />
          <p className="text-xs font-medium uppercase tracking-wide text-brand-400">
            {labels[screen]}
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-8 sm:py-12">
          <div className="mx-auto w-full max-w-lg">
            {index > 0 && (
              <button
                type="button"
                onClick={onBack}
                className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 transition-colors hover:text-brand-800"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {shell.back}
              </button>
            )}

            {/* `key` qadam almashganda blokni qaytadan ulaydi — shu
                sababli har o'tishda kirish animatsiyasi qayta o'ynaydi. */}
            <div key={screen} className="animate-rise">
              {children}
            </div>
          </div>
        </div>

        {/* Sahna boshqaruvi — faqat prezentatsiya uchun */}
        <footer className="flex flex-wrap items-center gap-2 border-t border-brand-100 bg-white px-4 py-3 sm:px-8">
          <button
            type="button"
            onClick={onAutofill}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 transition-[background-color,transform] duration-150 hover:bg-brand-50 active:scale-[0.98]"
          >
            <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
            {shell.autofill}
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 transition-[background-color,transform] duration-150 hover:bg-brand-50 active:scale-[0.98]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {shell.restart}
          </button>

          <button
            type="button"
            onClick={onToggleInvestor}
            aria-pressed={investorMode}
            className={cn(
              'ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              investorMode
                ? 'bg-brand-800 text-white hover:bg-brand-900'
                : 'border border-brand-200 text-brand-700 hover:bg-brand-50',
            )}
          >
            <ChartNoAxesColumn className="h-3.5 w-3.5" aria-hidden="true" />
            {shell.investorToggle}
            <span className={cn('font-normal', investorMode ? 'text-brand-300' : 'text-brand-400')}>
              {shell.investorHint}
            </span>
          </button>
        </footer>
      </div>
    </main>
  );
}

function ProgressDots({
  index,
  total,
  className,
}: {
  index: number;
  total: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1', className)} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-1 rounded-full transition-all',
            i < index ? 'w-4 bg-brand-400' : i === index ? 'w-7 bg-brand-700' : 'w-4 bg-brand-200',
          )}
        />
      ))}
    </div>
  );
}

function StepRail({
  screen,
  furthest,
  labels,
  onJump,
  className,
}: {
  screen: DemoScreen;
  furthest: number;
  labels: Record<DemoScreen, string>;
  onJump: (screen: DemoScreen) => void;
  className?: string;
}) {
  const index = stepIndex(screen);

  return (
    <ol className={cn('space-y-0.5', className)}>
      {DEMO_STEPS.map((step, i) => {
        const isCurrent = i === index;
        const isDone = i < index;
        // Faqat allaqachon o‘tilgan qadamlarga sakrash mumkin —
        // demo tartibi buzilmaydi.
        const reachable = i <= furthest;

        return (
          <li key={step}>
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onJump(step)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                isCurrent ? 'bg-brand-900 text-white' : 'text-brand-300',
                reachable && !isCurrent && 'hover:bg-brand-900/60 hover:text-white',
                !reachable && 'cursor-default opacity-45',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isCurrent
                    ? 'bg-gold-400 text-brand-950'
                    : isDone
                      ? 'bg-brand-700 text-white'
                      : 'border border-brand-700 text-brand-400',
                )}
              >
                {i + 1}
              </span>
              {labels[step]}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function LocaleToggle({ locale }: { locale: Locale }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-brand-200 p-0.5">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={`/${l}/demo`}
          className={cn(
            'rounded-md px-2 py-1 text-xs font-medium uppercase transition-colors',
            l === locale ? 'bg-brand-100 text-brand-800' : 'text-brand-400 hover:text-brand-700',
          )}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
