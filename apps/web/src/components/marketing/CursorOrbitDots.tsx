'use client';

import { useEffect, useRef } from 'react';

/**
 * Sichqoncha atrofida aylanib yuruvchi uchta kichik "yo'ldosh" nuqta.
 *
 * ── Tanlov ───────────────────────────────────────────────────────────
 * Uchinchi 30 talik namunadan "Aylanuvchi yo'ldoshlar" (29) tanlandi —
 * "Global tarmoq nuqtalari" (10) va matn titrashi (16) bilan BIRGA
 * ishlaydi, chunki ular bir-biriga xalaqit bermaydi: bittasi butun
 * sahifa foni, ikkinchisi bitta matn ustida, bu esa sichqonchaning
 * O'ZIGA yopishgan kichik detal.
 *
 * ── DOM, canvas emas ─────────────────────────────────────────────────
 * Atigi uchta element bo'lgani uchun to'liq ekran canvas ortiqcha —
 * uchta kichik `<span>` React tashqarisida, to'g'ridan-to'g'ri
 * `transform` orqali harakatlantiriladi.
 *
 * ── Yumshoq ergashish ────────────────────────────────────────────────
 * Markaz nuqta sichqonchaning O'ZI emas, unga sekin "erib boruvchi"
 * (`lerp`) nuqta — shuning uchun yo'ldoshlar keskin sakramaydi, biroz
 * kechikib, silliq ergashadi.
 */

const COUNT = 3;
const RADIUS = 22;
const ANGLE_SPEED = 0.045;
const FOLLOW = 0.15;

export function CursorOrbitDots() {
  const dotsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let pointer: { x: number; y: number } | null = null;
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let angle = 0;

    const handleMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('pointermove', handleMove);

    let raf: number;
    const tick = () => {
      if (pointer) {
        pos.x += (pointer.x - pos.x) * FOLLOW;
        pos.y += (pointer.y - pos.y) * FOLLOW;
      }
      angle += ANGLE_SPEED;

      dotsRef.current.forEach((dot, i) => {
        if (!dot) return;
        const a = angle + (i * Math.PI * 2) / COUNT;
        const x = pos.x + Math.cos(a) * RADIUS;
        const y = pos.y + Math.sin(a) * RADIUS;
        dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        dot.style.opacity = pointer ? '1' : '0';
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {Array.from({ length: COUNT }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            dotsRef.current[i] = el;
          }}
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-[60] h-[5px] w-[5px] rounded-full bg-[#4FE0FF] opacity-0 shadow-[0_0_6px_rgba(79,224,255,0.8)] transition-opacity duration-300"
        />
      ))}
    </>
  );
}
