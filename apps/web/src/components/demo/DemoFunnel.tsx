'use client';

import { useCallback, useEffect, useState } from 'react';
import { Hammer } from 'lucide-react';
import type { Locale } from '@ecwt/contracts';
import { DemoShell } from './DemoShell';
import { InvestorOverlay } from './InvestorOverlay';
import { STEP_LABELS } from './demo-copy';
import { StepAuth } from './steps/StepAuth';
import { StepOtp } from './steps/StepOtp';
import {
  DEMO_FIXTURE,
  INITIAL_STATE,
  clearState,
  loadState,
  nextScreen,
  prevScreen,
  saveState,
  stepIndex,
  type DemoScreen,
  type DemoState,
} from './demo-state';

const SOON: Record<Locale, { title: string; body: string }> = {
  uz: {
    title: 'Bu qadam qurilmoqda',
    body: 'Hozircha faqat 1-bet tayyor. Keyingi qadamlarni ketma-ket qo‘shamiz.',
  },
  ru: {
    title: 'Этот шаг в разработке',
    body: 'Пока готов только 1-й экран. Остальные шаги добавим по порядку.',
  },
  en: {
    title: 'This step is being built',
    body: 'Only screen 1 is ready so far. The remaining steps come next, in order.',
  },
};

/**
 * Varonkaning boshqaruvchisi: holat, saqlash va qadamlar yo‘naltirgichi.
 *
 * Qadam komponentlari sof ko‘rinish — ular holatni bilmaydi, faqat
 * `onChange` va `onNext` chaqiradi. Shu sabab yangi qadam qo‘shish
 * bitta `case` qo‘shish bilan cheklanadi.
 */
export function DemoFunnel({ locale }: { locale: Locale }) {
  const [state, setState] = useState<DemoState>(INITIAL_STATE);
  const [investorMode, setInvestorMode] = useState(false);
  const [restored, setRestored] = useState(false);

  // Saqlangan holatni faqat brauzerda tiklaymiz — server render bilan
  // ziddiyat bo‘lmasligi uchun birinchi renderdan keyin.
  useEffect(() => {
    const saved = loadState();
    if (saved) setState(saved);
    setRestored(true);
  }, []);

  useEffect(() => {
    if (restored) saveState(state);
  }, [state, restored]);

  const toggleInvestor = useCallback(() => setInvestorMode((prev) => !prev), []);

  // `I` — investor qatlami. Maydonga yozayotganda ishlamasligi kerak.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'i' && event.key !== 'I') return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
        return;
      }

      event.preventDefault();
      toggleInvestor();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleInvestor]);

  const patch = useCallback((next: Partial<DemoState>) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  const goNext = useCallback(() => {
    setState((prev) => {
      const screen = nextScreen(prev.screen);
      return { ...prev, screen, furthest: Math.max(prev.furthest, stepIndex(screen)) };
    });
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => ({ ...prev, screen: prevScreen(prev.screen) }));
  }, []);

  const jumpTo = useCallback((screen: DemoScreen) => {
    setState((prev) =>
      stepIndex(screen) <= prev.furthest ? { ...prev, screen } : prev,
    );
  }, []);

  /** Sahnada qo‘lda yozib o‘tirmaslik uchun joriy qadamni to‘ldiradi */
  const autofill = useCallback(() => {
    setState((prev) => {
      if (prev.screen === 'auth') {
        return { ...prev, fullName: DEMO_FIXTURE.fullName, phone: DEMO_FIXTURE.phone };
      }
      if (prev.screen === 'otp') {
        // Demo rejimida server har safar yangi kod beradi — shuni qo‘yamiz.
        // Haqiqiy SMS ulangan bo‘lsa qo‘yadigan narsa yo‘q: kod telefonda.
        return { ...prev, otp: prev.demoOtp || DEMO_FIXTURE.otp };
      }
      return prev;
    });
  }, []);

  const restart = useCallback(() => {
    clearState();
    setState(INITIAL_STATE);
  }, []);

  return (
    <>
      <DemoShell
        locale={locale}
        screen={state.screen}
        furthest={state.furthest}
        investorMode={investorMode}
        onBack={goBack}
        onJump={jumpTo}
        onAutofill={autofill}
        onRestart={restart}
        onToggleInvestor={toggleInvestor}
      >
        {state.screen === 'auth' && (
          <StepAuth locale={locale} state={state} onChange={patch} onNext={goNext} />
        )}

        {state.screen === 'otp' && (
          <StepOtp
            locale={locale}
            state={state}
            onChange={patch}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {state.screen !== 'auth' && state.screen !== 'otp' && (
          <UnderConstruction locale={locale} screen={state.screen} />
        )}
      </DemoShell>

      {investorMode && (
        <InvestorOverlay
          locale={locale}
          screen={state.screen}
          onClose={() => setInvestorMode(false)}
        />
      )}
    </>
  );
}

function UnderConstruction({ locale, screen }: { locale: Locale; screen: DemoScreen }) {
  const copy = SOON[locale];

  return (
    <div className="rounded-card border border-dashed border-brand-200 bg-white p-8 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gold-100">
        <Hammer className="h-5 w-5 text-gold-700" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-bold tracking-tight text-brand-950">
        {STEP_LABELS[locale][screen]}
      </h2>
      <p className="mt-1 text-sm font-medium text-brand-700">{copy.title}</p>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-brand-500">{copy.body}</p>
    </div>
  );
}
