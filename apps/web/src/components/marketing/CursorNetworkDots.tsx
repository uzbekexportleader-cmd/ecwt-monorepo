'use client';

import { useEffect, useRef } from 'react';

/**
 * Butun sahifa bo'ylab sochilgan xira nuqtalar — sichqoncha yaqinlashsa
 * yorishadi va unga ingichka chiziq bilan bog'lanadi ("global tarmoq").
 *
 * ── Tanlov ───────────────────────────────────────────────────────────
 * Uchinchi 30 talik namunadan "Global tarmoq nuqtalari" (10) tanlandi
 * — ECWT "global marketplace tarmog'i" mavzusiga mos keladi. Aylanuvchi
 * yo'ldoshlar (`CursorOrbitDots`, 29) bilan BIRGA ishlaydi — bittasi
 * butun sahifa foni, ikkinchisi sichqonchaning o'ziga yopishgan detal.
 *
 * ── Nuqtalar QANDAY joylashtirilgan ───────────────────────────────────
 * `NightBackdrop`dagi yulduzlar kabi — `Math.random()` EMAS, qat'iy
 * urug'li generator, toki server va brauzer natijasi bir xil bo'lsin.
 *
 * ── Canvas + NightBackdrop'DAN KEYIN ─────────────────────────────────
 * Avvalgi effektlarda ham xuddi shu sabab: video shaffof emas, undan
 * OLDIN chizilgan qatlam butunlay ko'rinmay qoladi.
 */

interface Dot {
  x: number;
  y: number;
}

const LINK_DIST = 130;
const DOT_DENSITY = 22000; // har shuncha kv.piksel uchun bitta nuqta

function makeDots(width: number, height: number): Dot[] {
  let seed = 71823;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const count = Math.round((width * height) / DOT_DENSITY);
  return Array.from({ length: count }, () => ({ x: next() * width, y: next() * height }));
}

export function CursorNetworkDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dots: Dot[] = [];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      dots = makeDots(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    let pointer: { x: number; y: number } | null = null;
    const handleMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('pointermove', handleMove);

    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const dot of dots) {
        const d = pointer ? Math.hypot(dot.x - pointer.x, dot.y - pointer.y) : Infinity;
        const boost = Math.max(0, 1 - d / LINK_DIST);

        if (pointer && boost > 0) {
          ctx.beginPath();
          ctx.moveTo(pointer.x, pointer.y);
          ctx.lineTo(dot.x, dot.y);
          ctx.strokeStyle = `rgba(240,201,135,${boost * 0.35})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 1 + boost * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,201,135,${0.12 + boost * 0.7})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handleMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0" />;
}
