'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@ecwt/contracts';
import { StepAuth } from './steps/StepAuth';
import { INITIAL_STATE, loadState, saveState, type DemoState } from './demo-state';

/**
 * Bosh sahifadagi kirish kartasi — varonkaning 1-qadami.
 *
 * Varonkaning o'zi `/demo` da davom etadi. Bu yerda alohida forma
 * yozilmadi: `StepAuth` aynan o'sha komponent, faqat karta ichida va
 * kichikroq sarlavha bilan. Holat `localStorage` orqali uzatiladi,
 * shuning uchun keyingi sahifa ism va raqamni allaqachon biladi.
 */
export function EntryAuth({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [state, setState] = useState<DemoState>(INITIAL_STATE);

  // Saqlangan holatni brauzerda tiklaymiz — orqaga qaytgan foydalanuvchi
  // raqamini qaytadan yozmasin.
  useEffect(() => {
    const saved = loadState();
    if (saved) setState({ ...saved, screen: 'auth' });
  }, []);

  const patch = useCallback((next: Partial<DemoState>) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  const goToFunnel = useCallback(() => {
    const next: DemoState = {
      ...state,
      screen: 'otp',
      furthest: Math.max(state.furthest, 1),
    };

    // Saqlash va yo'naltirish `setState` yangilagichidan tashqarida
    // turishi shart: yangilagich render paytida ishlaydi, u yerda
    // `router.push` chaqirilsa React "boshqa komponentni render paytida
    // yangilash" xatosini beradi.
    saveState(next);
    setState(next);
    router.push(`/${locale}/demo`);
  }, [state, locale, router]);

  return (
    /* Krem sahifadagi yagona quyuq massa. Kontrast shu yerda eng yuqori,
       shuning uchun ko'z avval aynan shu formaga tushadi. Yuqori qirradagi
       ichki oq chiziq kartani sirtdan bir oz "ko'taradi". */
    <div
      className="rounded-[28px] border border-white/10 p-6 sm:p-7"
      style={{
        background: 'linear-gradient(158deg, #2b2119 0%, #1a1410 58%, #130e0a 100%)',
        boxShadow:
          'inset 0 1px 0 rgb(255 255 255 / 0.08), 0 2px 8px -2px rgb(40 28 18 / 0.28), 0 36px 72px -28px rgb(40 28 18 / 0.6)',
      }}
    >
      <StepAuth
        locale={locale}
        state={state}
        onChange={patch}
        onNext={goToFunnel}
        titleAs="h2"
        tone="espresso"
      />
    </div>
  );
}
