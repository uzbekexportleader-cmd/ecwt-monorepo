'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Raqamning nolgacha qaytib, o'z qiymatiga sanab chiqishi.
 *
 * Ekranga kirganda ishga tushadi. Savdo sahifasida bu shunchaki
 * effekt emas: harakatlanayotgan raqam o'sishni anglatadi, va aynan
 * shu narsa "12 marketplace" degan quruq faktdan ko'ra ko'proq gapiradi.
 *
 * ── Qiymat matn bo'lgani uchun ────────────────────────────────────
 * Kirish "12", "2+", "$1.1T" bo'lishi mumkin. Shuning uchun matn
 * uchga bo'linadi: oldingi belgi (`$`), sonning o'zi va keyingi
 * belgi (`+`, `T`). Faqat o'rtadagi son sanaladi, qolgani joyida
 * turadi. Son topilmasa — matn shundayligicha chiqadi.
 *
 * ── Nega `requestAnimationFrame` emas ─────────────────────────────
 * Bu sahifa avtomatlashtirilgan brauzerda ham tekshiriladi, u yerda
 * rAF sekundiga bir marta ishlaydi va sanash "sakrab" ko'rinadi.
 * `setInterval` ikkala holatda ham bir xil yuradi.
 */

const FRAME_MS = 40;
const DURATION_MS = 1100;

/** "$1.1T" -> { pre: "$", num: 1.1, post: "T", decimals: 1 } */
function parse(value: string) {
  const m = value.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/);
  if (!m) return null;

  const [, pre, digits, post] = m;
  const dot = digits.indexOf('.');

  return {
    pre,
    post,
    target: Number(digits),
    decimals: dot === -1 ? 0 : digits.length - dot - 1,
  };
}

export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const parsed = parse(value);

  /**
   * Boshlang'ich qiymat — HAQIQIY raqam, nol emas.
   *
   * Ilgari bu yerda nol turardi va sahifa serverdan "0 MARKETPLACE"
   * bo'lib kelardi. JS ishlamasa yoki qidiruv tizimi o'qisa, aynan
   * shu nol ko'rinardi — ya'ni sahifa yolg'on gapirardi. Endi nol
   * faqat brauzerda, sanashdan bir lahza oldin qo'yiladi.
   */
  const [shown, setShown] = useState<string>(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || !parsed) return;

    const finish = () => setShown(value);

    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      finish();
      return;
    }

    let timer: number | undefined;
    let started = false;

    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.some((e) => e.isIntersecting);

        // Hali ko'rinmagan bo'lsa — nolga tushiramiz va kutamiz.
        // Shu ondan boshlab raqam brauzerda boshqariladi.
        if (!seen) {
          if (!started) setShown(`${parsed.pre}0${parsed.post}`);
          return;
        }
        if (started) return;
        started = true;
        io.disconnect();

        const start = performance.now();

        timer = window.setInterval(() => {
          const p = Math.min(1, (performance.now() - start) / DURATION_MS);
          // Oxiriga kelib sekinlashadi — birdan to'xtagandan ko'ra tabiiy
          const eased = 1 - (1 - p) ** 3;
          const n = parsed.target * eased;

          setShown(`${parsed.pre}${n.toFixed(parsed.decimals)}${parsed.post}`);

          if (p >= 1) {
            window.clearInterval(timer);
            timer = undefined;
            finish();
          }
        }, FRAME_MS);
      },
      { threshold: 0.4 },
    );

    io.observe(el);

    return () => {
      io.disconnect();
      if (timer !== undefined) window.clearInterval(timer);
    };
    // `value` o'zgarmaydi (til almashsa komponent qayta yaratiladi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // `tabular-nums` bo'lmasa sanash paytida kenglik o'zgarib, raqam
  // qaltirab turadi.
  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  );
}
