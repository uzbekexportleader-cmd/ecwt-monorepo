'use client';

import { useEffect, useRef, useState } from 'react';

type Phase = 'typing' | 'pausedFull' | 'fading' | 'pausedEmpty';

/** Bir harf yozilishi orasidagi kechikish */
const TYPE_MS = 48;
/** Gap TO'LIQ yozilib bo'lgach, o'chishdan oldin necha vaqt turadi.
 *  O'qish uchun yetarli bo'lishi kerak — avvalgi 1800ms juda qisqa
 *  edi, keyingi gap boshlanguncha o'qib ulgurmasdi. */
const HOLD_FULL_MS = 3200;
/** Erish animatsiyasining davomiyligi */
const FADE_MS = 600;
/** Erib bo'lgach, keyingi gap yozila boshlashidan oldingi tin olish */
const HOLD_EMPTY_MS = 250;

interface TypewriterHeadlineProps {
  /** Ketma-ket ko'rsatiladigan gaplar — kamida ikkitasi bo'lishi kerak */
  phrases: readonly string[];
  className?: string;
}

/**
 * Sarlavhada bir gap yozilib, erib, keyingisi yoziladigan effekt.
 *
 * ── Nega `setInterval` emas, rekursiv `setTimeout` ──────────────────
 * Yozish tezligi, to'la turish va erish — uchalasining davomiyligi
 * boshqa-boshqa. `setInterval` bitta qat'iy davrga qulflaydi; holat
 * mashinasi (`Phase`) esa har bosqichda o'zining kechikishini
 * tanlaydi.
 *
 * ── Kirish — yozib, chiqish — erib ───────────────────────────────────
 * Ilgari gap harf-harf O'CHIRILARDI (backspace kabi). Bu mexanik
 * ko'rindi — egasi buni yoqtirmadi va "qum isporyatsa qilgani kabi"
 * yo'qolishini so'radi. Endi kirish (yozish) va chiqish (erish)
 * ASIMMETRIK: matn harf-harf TERILADI, lekin bir butun holda YUMSHOQ
 * ERIYDI (`opacity` o'tishi), harf-harf o'chirilmaydi.
 *
 * Erish faqat CHIQISHDA animatsiyalanadi — qaytib 1ga chiqish esa
 * ANIQ VA DARHOL (`transition: none`), aks holda bo'sh matn ustida
 * yangi gap harflari yarim shaffof holda terila boshlardi.
 *
 * ── Boshlang'ich holat `pausedFull` ──────────────────────────────────
 * Server birinchi gapni TO'LIQ chiqaradi (hydration mos kelishi
 * uchun) — animatsiya uni qaytadan yozmaydi, faqat bir oz turgach
 * erishga o'tadi.
 *
 * ── `prefers-reduced-motion` ─────────────────────────────────────────
 * Foydalanuvchi harakatni kamaytirishni so'ragan bo'lsa, animatsiya
 * umuman ishga tushmaydi: birinchi gap statik turadi.
 *
 * ── Balandlik bu yerda BOSHQARILMAYDI ────────────────────────────────
 * Konteyner balandligini qat'iy ushlab turish (`page.tsx` dagi
 * `h-[...] overflow-hidden`) chaqiruvchining vazifasi — bu komponent
 * faqat matnni yozadi/eritadi.
 */
export function TypewriterHeadline({ phrases, className }: TypewriterHeadlineProps) {
  const [text, setText] = useState(phrases[0] ?? '');
  const [visible, setVisible] = useState(true);
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
          phase.current = 'fading';
          setVisible(false);
          timeoutId = setTimeout(tick, FADE_MS);
          break;

        case 'fading':
          setText('');
          setVisible(true);
          charIndex.current = 0;
          phraseIndex.current += 1;
          phase.current = 'pausedEmpty';
          timeoutId = setTimeout(tick, HOLD_EMPTY_MS);
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
    <span
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        // Faqat 0ga O'TISH animatsiyalanadi. 1ga qaytish darhol —
        // izohda tushuntirilgan sababga ko'ra.
        transition: visible ? 'none' : `opacity ${FADE_MS}ms ease`,
      }}
    >
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
