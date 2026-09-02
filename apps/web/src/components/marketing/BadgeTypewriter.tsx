'use client';

import { useEffect, useRef, useState } from 'react';

/** Bir harf yozilishi orasidagi kechikish */
const TYPE_MS = 45;
/** So'z to'liq yozilib bo'lgach, keyingisiga o'tishdan oldin necha vaqt turadi */
const HOLD_MS = 1800;
/** So'nish (fade) animatsiyasining davomiyligi */
const FADE_MS = 300;

interface BadgeTypewriterProps {
  /** Ketma-ket yozilib turadigan qisqa so'z/iboralar */
  words: readonly string[];
}

/**
 * Bosh ekrandagi kichik plashka ichida aylanadigan qisqa
 * yorliqlar ("AI YORDAMIDA" -> "50+ MARKETPLACE" -> ...).
 *
 * `TypewriterHeadline`dan ANCHA soddaroq — bu yerda ko'p qatorga
 * bo'lish, oldindan o'lchash yoki ketma-ket o'chirish kerak emas:
 * har bir yorliq bitta qisqa so'z, bitta qatorga sig'adi, shuning
 * uchun oddiy "yoz -> tur -> so'n -> tozala -> keyingisini yoz"
 * sikli yetarli.
 */
export function BadgeTypewriter({ words }: BadgeTypewriterProps) {
  const [text, setText] = useState(words[0] ?? '');
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const wordIndex = useRef(0);
  const charIndex = useRef(0);
  const phase = useRef<'typing' | 'hold' | 'fading'>('hold');

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (reduced || words.length <= 1) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const word = words[wordIndex.current % words.length] ?? '';

      switch (phase.current) {
        case 'typing':
          charIndex.current += 1;
          setText(word.slice(0, charIndex.current));
          if (charIndex.current >= word.length) {
            phase.current = 'hold';
            timeoutId = setTimeout(tick, HOLD_MS);
          } else {
            timeoutId = setTimeout(tick, TYPE_MS);
          }
          break;

        case 'hold':
          phase.current = 'fading';
          setVisible(false);
          timeoutId = setTimeout(tick, FADE_MS);
          break;

        case 'fading':
          wordIndex.current += 1;
          charIndex.current = 0;
          setText('');
          setVisible(true);
          phase.current = 'typing';
          timeoutId = setTimeout(tick, TYPE_MS);
          break;

        default:
          break;
      }
    };

    timeoutId = setTimeout(tick, HOLD_MS);
    return () => clearTimeout(timeoutId);
  }, [words, reduced]);

  const showCursor = !reduced && phase.current !== 'hold';

  return (
    <span style={{ opacity: visible ? 1 : 0, transition: `opacity ${FADE_MS}ms ease` }}>
      {text}
      {showCursor && (
        <span
          aria-hidden="true"
          className="ml-[0.05em] inline-block w-[1px] animate-cursor-blink bg-current align-baseline"
          style={{ height: '0.75em' }}
        />
      )}
    </span>
  );
}
