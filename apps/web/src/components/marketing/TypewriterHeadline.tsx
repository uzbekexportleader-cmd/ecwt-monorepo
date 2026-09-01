'use client';

import { useEffect, useRef, useState } from 'react';

type Phase = 'typing' | 'pausedFull' | 'deleting' | 'pausedEmpty';

const TYPE_MS = 45;
const DELETE_MS = 25;
const HOLD_FULL_MS = 1800;
const HOLD_EMPTY_MS = 350;

interface TypewriterHeadlineProps {
  /** Ketma-ket ko'rsatiladigan gaplar — kamida ikkitasi bo'lishi kerak */
  phrases: readonly string[];
  className?: string;
}

/**
 * Sarlavhada bir gap yozilib, o'chib, keyingisi yoziladigan effekt.
 *
 * ── Nega `setInterval` emas, rekursiv `setTimeout` ──────────────────
 * Yozish, o'chirish va ikkalasi orasidagi kutish — uchalasining
 * tezligi boshqa-boshqa. `setInterval` bitta qat'iy davrga qulflaydi;
 * holat mashinasi (`Phase`) esa har bosqichda o'zining kechikishini
 * tanlaydi.
 *
 * ── Boshlang'ich holat `pausedFull` ──────────────────────────────────
 * Server birinchi gapni TO'LIQ chiqaradi (hydration mos kelishi
 * uchun) — animatsiya uni qaytadan yozmaydi, faqat bir oz turgach
 * o'chirishga o'tadi.
 *
 * ── `prefers-reduced-motion` ─────────────────────────────────────────
 * Foydalanuvchi harakatni kamaytirishni so'ragan bo'lsa, animatsiya
 * umuman ishga tushmaydi: birinchi gap statik turadi.
 */
export function TypewriterHeadline({ phrases, className }: TypewriterHeadlineProps) {
  const [text, setText] = useState(phrases[0] ?? '');
  const [reduced, setReduced] = useState(false);
  const phraseIndex = useRef(0);
  const charIndex = useRef((phrases[0] ?? '').length);
  const phase = useRef<Phase>('pausedFull');

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (reduced || phrases.length <= 1) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = phrases[phraseIndex.current % phrases.length] ?? '';

      switch (phase.current) {
        case 'typing':
          charIndex.current += 1;
          setText(current.slice(0, charIndex.current));
          if (charIndex.current >= current.length) {
            phase.current = 'pausedFull';
            timeoutId = setTimeout(tick, HOLD_FULL_MS);
          } else {
            timeoutId = setTimeout(tick, TYPE_MS);
          }
          break;

        case 'pausedFull':
          phase.current = 'deleting';
          timeoutId = setTimeout(tick, DELETE_MS);
          break;

        case 'deleting':
          charIndex.current -= 1;
          setText(current.slice(0, charIndex.current));
          if (charIndex.current <= 0) {
            phase.current = 'pausedEmpty';
            phraseIndex.current += 1;
            timeoutId = setTimeout(tick, HOLD_EMPTY_MS);
          } else {
            timeoutId = setTimeout(tick, DELETE_MS);
          }
          break;

        case 'pausedEmpty':
          phase.current = 'typing';
          timeoutId = setTimeout(tick, TYPE_MS);
          break;
      }
    };

    timeoutId = setTimeout(tick, HOLD_FULL_MS);

    return () => clearTimeout(timeoutId);
  }, [phrases, reduced]);

  return (
    <span className={className}>
      {text}
      {!reduced && (
        <span
          aria-hidden="true"
          className="ml-[0.06em] inline-block w-[2px] animate-pulse bg-current align-middle"
          style={{ height: '0.85em' }}
        />
      )}
    </span>
  );
}
