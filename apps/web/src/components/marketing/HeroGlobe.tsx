'use client';

import { useEffect, useRef, useState } from 'react';
import { buildLut, brightenOcean, renderFrame } from './globe-texture';
import { orthographic } from './world-data';

/**
 * Bosh sahifadagi asosiy vizual — shisha yer shari.
 *
 * Ilgari bu yerda aylanuvchi globus atrofida marketplace kartalari
 * uchardi. Endi tuzilma boshqacha: shar QIMIRLAMAYDI, harakat esa
 * undan tarqalayotgan nur yo'llarida.
 *
 * Nega aylanmaydi. Butun tasvirning ma'nosi bitta nuqtada —
 * O'zbekistonda. Shar aylansa, u ekranda joyini o'zgartiradi va undan
 * chiqayotgan nurlar ham har kadrda qayta hisoblanishi kerak bo'ladi;
 * mamlakat narigi tomonga o'tganda esa nurlar umuman yo'qoladi. Tinch
 * turgan shar — bu kamchilik emas, qaror: mahsulot surati kabi
 * o'qiladi, va hisob ham deyarli nolga tushadi (kadr BIR MARTA
 * chiziladi, keyin canvas tegilmaydi).
 *
 * "Shisha" ko'rinish uchta qatlamdan yig'iladi:
 *   1. Fotosurat sfera (NASA teksturasi, ortografik proyeksiya)
 *   2. Atmosfera — chetdagi yupqa ko'k halqa va tashqi yoyilma
 *   3. Aks — chap yuqoridan tushgan yorug'lik dog'i
 *
 * Tekstura topilmasa, shar o'rniga ko'k gradient qoladi: nurlar,
 * yorliqlar va O'zbekiston nuqtasi baribir ishlaydi.
 */

/** Kadr o'lchami. Shar ekranda kichik, shuning uchun 440 yetarli. */
const CANVAS = 440;

/** Sharning ko'rinib turgan markazi */
const CENTER_LON = 46;
const CENTER_LAT = 18;

/** O'zbekiston */
const UZ_LON = 64;
const UZ_LAT = 41;

const TEXTURE_URL = '/earth.jpg';

/**
 * Barcha koordinatalar 0..100 oralig'ida — foizda.
 *
 * Shu sababli komponent istalgan o'lchamda ishlaydi: SVG ham, HTML
 * yorliqlar ham bir xil raqamlardan foydalanadi va ular hech qachon
 * bir-biridan siljib ketmaydi.
 */
const R = 34;
const CX = 50;
const CY = 50;

interface Label {
  key: string;
  name: string;
  /** Nur yo'li tugaydigan nuqta, foizda */
  x: number;
  y: number;
  /** Nur yo'lining egilishi — musbat bo'lsa soat strelkasi bo'ylab */
  bend: number;
  /**
   * Matn shu nuqtadan qaysi tomonga o'sadi.
   *
   * Markazga tekislansa, chapdagi va o'ngdagi yorliqlar sharning
   * ustiga kirib qoladi — "Walmart" ning yarmi Yer yuzasida turadi.
   * Tashqariga qaratilganda esa ular hech qachon sharga tegmaydi.
   */
  side: 'left' | 'right' | 'center';
}

/**
 * Yorliqlar sharning atrofida.
 *
 * Joylari qo'lda tanlangan, formula bilan emas: teng oraliqda
 * qo'yilsa ular soat siferblatidek chiqadi, bu esa juda qat'iy
 * ko'rinadi. Bir oz notekislik tabiiyroq o'qiladi.
 */
const LABELS: readonly Label[] = [
  { key: 'amazon', name: 'Amazon', x: 14, y: 19, bend: -10, side: 'left' },
  { key: 'ebay', name: 'eBay', x: 86, y: 17, bend: 8, side: 'right' },
  { key: 'etsy', name: 'Etsy', x: 6, y: 47, bend: -8, side: 'left' },
  { key: 'walmart', name: 'Walmart', x: 94, y: 45, bend: 10, side: 'right' },
  { key: 'shopify', name: 'Shopify', x: 14, y: 76, bend: 9, side: 'left' },
  { key: 'tiktok', name: 'TikTok Shop', x: 86, y: 79, bend: -9, side: 'right' },
  { key: 'wayfair', name: 'Wayfair', x: 49, y: 5, bend: 6, side: 'center' },
  { key: 'temu', name: 'Temu', x: 51, y: 95, bend: -6, side: 'center' },
];

/** O'zbekistonning ekrandagi joyi — bir marta hisoblanadi */
const UZ = (() => {
  const p = orthographic(UZ_LON, UZ_LAT, CENTER_LON, CENTER_LAT, R);
  // Sharning ko'rinadigan tomonida bo'lishi tekshirilgan: CENTER_LON
  // shunga qarab tanlangan. Baribir zaxira qoldiramiz.
  return p ? { x: CX + p.x, y: CY + p.y } : { x: CX + 8, y: CY - 14 };
})();

/**
 * Nur yo'li — O'zbekistondan yorliqqa.
 *
 * To'g'ri chiziq quruq chiqadi, shuning uchun kvadratik egri
 * ishlatiladi. Boshqaruv nuqtasi o'rtadan perpendikular yo'nalishda
 * `bend` ga suriladi.
 */
function rayPath(to: Label): string {
  const dx = to.x - UZ.x;
  const dy = to.y - UZ.y;
  const len = Math.hypot(dx, dy) || 1;

  const mx = UZ.x + dx / 2;
  const my = UZ.y + dy / 2;

  // Perpendikular birlik vektor
  const px = -dy / len;
  const py = dx / len;

  const k = to.bend / 100;
  const cx = mx + px * len * k;
  const cy = my + py * len * k;

  return `M ${UZ.x} ${UZ.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

export function HeroGlobe({ label }: { label: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [textured, setTextured] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const img = new Image();
    img.decoding = 'async';

    img.onload = () => {
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      // Teksturani o'qish uchun uni avval yordamchi canvas'ga chizamiz
      const src = document.createElement('canvas');
      src.width = img.naturalWidth;
      src.height = img.naturalHeight;

      const sctx = src.getContext('2d', { willReadFrequently: true });
      if (!sctx) return;

      sctx.drawImage(img, 0, 0);

      let texture: ImageData;
      try {
        texture = sctx.getImageData(0, 0, src.width, src.height);
      } catch {
        // Boshqa domendan kelgan rasm canvas'ni "iflos" qiladi va
        // o'qishga ruxsat bermaydi. Bunday holda gradientda qolamiz.
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      brightenOcean(texture);

      const lut = buildLut(CANVAS, CENTER_LAT);
      const out = ctx.createImageData(CANVAS, CANVAS);

      // BIR MARTA. Shar qimirlamaydi, shuning uchun takrorlash shart emas.
      renderFrame(lut, texture, out, CENTER_LON);
      ctx.putImageData(out, 0, 0);

      setTextured(true);
    };

    img.src = TEXTURE_URL;

    return () => {
      cancelled = true;
      img.onload = null;
    };
  }, []);

  return (
    <div className="relative aspect-square w-full" role="img" aria-label={label}>
      {/* ── Atmosfera: sharning ORQASIDAN chiqib turgan yoyilma ───── */}
      <div
        className="absolute rounded-full"
        style={{
          left: `${50 - R - 6}%`,
          top: `${50 - R - 6}%`,
          width: `${(R + 6) * 2}%`,
          height: `${(R + 6) * 2}%`,
          background:
            'radial-gradient(circle at 50% 50%, rgba(90,170,255,0) 62%, rgba(96,176,255,0.28) 74%, rgba(56,124,205,0.12) 84%, rgba(40,96,190,0) 100%)',
        }}
      />

      {/* ── Fotosurat sfera ───────────────────────────────────────── */}
      {/* `width`/`height` — bu CHIZISH kadri, ekrandagi o'lcham emas.
          Shu sababli `inset` yolg'iz yetmaydi: canvas o'z atributidagi
          o'lchamda qolib ketadi va sharning yorliqlaridan siljib
          chiqadi. CSS o'lchami alohida berilishi shart. */}
      <canvas
        ref={canvasRef}
        width={CANVAS}
        height={CANVAS}
        aria-hidden="true"
        className="absolute rounded-full"
        style={{
          left: `${50 - R}%`,
          top: `${50 - R}%`,
          width: `${R * 2}%`,
          height: `${R * 2}%`,
          opacity: textured ? 1 : 0,
          transition: 'opacity 600ms ease-out',
        }}
      />

      {/* Tekstura topilmasa — sodda gradient sfera */}
      <div
        aria-hidden="true"
        className="absolute rounded-full"
        style={{
          left: `${50 - R}%`,
          top: `${50 - R}%`,
          width: `${R * 2}%`,
          height: `${R * 2}%`,
          opacity: textured ? 0 : 1,
          background:
            'radial-gradient(circle at 34% 28%, #2f6fbd 0%, #17427f 44%, #0a1f42 78%, #061428 100%)',
        }}
      />

      {/* ── Chekka chizig'i: shar yuzasining tugashi ──────────────── */}
      <div
        aria-hidden="true"
        className="absolute rounded-full"
        style={{
          left: `${50 - R}%`,
          top: `${50 - R}%`,
          width: `${R * 2}%`,
          height: `${R * 2}%`,
          background:
            'radial-gradient(circle at 50% 50%, rgba(150,210,255,0) 92%, rgba(170,222,255,0.55) 97.5%, rgba(120,185,255,0.28) 100%)',
        }}
      />

      {/* ── Shisha aksi: yorug'lik chap yuqoridan ─────────────────── */}
      <div
        aria-hidden="true"
        className="absolute rounded-full"
        style={{
          left: `${50 - R}%`,
          top: `${50 - R}%`,
          width: `${R * 2}%`,
          height: `${R * 2}%`,
          background:
            'radial-gradient(ellipse 46% 34% at 32% 22%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.07) 42%, rgba(255,255,255,0) 72%)',
        }}
      />

      {/* ── Nur yo'llari va yorliqlar ─────────────────────────────── */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <defs>
          {/* Gradient O'ZBEKISTON MARKAZIDAN tarqaladi.
              Avval u chiziqli va `objectBoundingBox` da edi — bu ishlamadi:
              deyarli tik yo'lda bbox eni nolga siqiladi va butun gradient
              bitta rangga aylanib qoladi. Radial va `userSpaceOnUse`
              bo'lganda esa u yo'lning yo'nalishiga umuman bog'liq emas,
              va ma'nosi ham to'g'ri: yorug'lik bitta nuqtadan chiqadi. */}
          <radialGradient
            id="ecwt-ray"
            gradientUnits="userSpaceOnUse"
            cx={UZ.x}
            cy={UZ.y}
            r={58}
          >
            <stop offset="0%" stopColor="#4ade80" stopOpacity="1" />
            <stop offset="30%" stopColor="#8fe0b4" stopOpacity="0.85" />
            <stop offset="65%" stopColor="#7fc7ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7fabda" stopOpacity="0.3" />
          </radialGradient>
        </defs>

        {LABELS.map((l, i) => {
          const d = rayPath(l);
          return (
            <g key={l.key}>
              {/* Doimiy, juda xira chiziq — yo'lning o'zi.
                  `vectorEffect` tufayli `strokeWidth` viewBox birligida
                  emas, EKRAN PIKSELIDA o'lchanadi — shuning uchun bu
                  yerdagi raqamlar 1 atrofida. */}
              <path
                d={d}
                fill="none"
                stroke="url(#ecwt-ray)"
                strokeWidth="1.1"
                strokeOpacity="0.45"
                vectorEffect="non-scaling-stroke"
              />
              {/* Yo'l bo'ylab yuguruvchi yorug'lik.
                  `pathLength` ni 100 ga qotiramiz — shunda dash
                  qiymatlari yo'lning haqiqiy uzunligiga bog'liq
                  bo'lmaydi va hamma nurlar bir xil tezlikda yuradi. */}
              <path
                className="animate-ray"
                d={d}
                fill="none"
                stroke="url(#ecwt-ray)"
                strokeWidth="2.8"
                strokeLinecap="round"
                pathLength={100}
                vectorEffect="non-scaling-stroke"
                style={{ animationDelay: `${i * 0.55}s` }}
              />
            </g>
          );
        })}
      </svg>

      {/* ── O'zbekiston ───────────────────────────────────────────── */}
      <span
        aria-hidden="true"
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${UZ.x}%`, top: `${UZ.y}%` }}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_14px_4px_rgba(74,222,128,0.55)]" />
        </span>
      </span>

      {/* ── Marketplace yorliqlari ────────────────────────────────── */}
      {LABELS.map((l) => (
        <span
          key={l.key}
          className="absolute -translate-y-1/2 whitespace-nowrap text-[11px] font-medium tracking-[0.01em] text-white/70 sm:text-[13px]"
          style={{
            left: `${l.x}%`,
            top: `${l.y}%`,
            // Chapdagilar chapga, o'ngdagilar o'ngga o'sadi; yuqori va
            // pastdagilar esa markazga tekislanadi — u yerda shar
            // gorizontal bo'yicha xalaqit bermaydi.
            transform:
              l.side === 'left'
                ? 'translate(-100%, -50%)'
                : l.side === 'right'
                  ? 'translate(0, -50%)'
                  : 'translate(-50%, -50%)',
            marginLeft: l.side === 'left' ? '-0.4rem' : l.side === 'right' ? '0.4rem' : 0,
          }}
        >
          {l.name}
        </span>
      ))}
    </div>
  );
}
