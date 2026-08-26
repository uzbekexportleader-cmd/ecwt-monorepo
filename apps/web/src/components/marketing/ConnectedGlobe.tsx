'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Marketplace } from '@ecwt/contracts';
import { MarketplaceMark } from './MarketplaceMark';
import { brightenOcean, buildLut, renderFrame } from './globe-texture';
import { landPoints, orthographic } from './world-data';

/**
 * HOZIR ISHLATILMAYDI. Bosh sahifada globus o'rnini `MarketplaceStream`
 * egalladi. Fayl va `public/earth.jpg` saqlab qo'yilgan: globus qaytarilsa,
 * ikkalasi ham kerak bo'ladi.
 *
 * Aylanuvchi Yer shari va uning atrofida aylanadigan marketplace
 * logotiplari.
 *
 * Ikki rejim bor.
 *
 * ASOSIY — fotosurat. `public/earth.jpg` (NASA Blue Marble, yoyilgan
 * proyeksiya) sharga o‘raladi: ekrandagi har bir piksel uchun teskari
 * ortografik proyeksiya bilan u sharning qaysi nuqtasiga tegishli ekani
 * topiladi va teksturadan o‘sha rang olinadi. Ko‘rish markazining
 * uzunligi sekin o‘zgaradi — shundan aylanish chiqadi.
 *
 * ZAXIRA — vektor. Tekstura topilmasa (fayl o‘chirilgan yoki
 * almashtirilayotgan bo‘lsa) quyidagi SVG globus ishlashda davom etadi.
 * Uning quruqlik ma’lumoti dag‘al, shuning uchun u faqat sahifa
 * bo‘sh qolmasligi uchun turadi.
 *
 * Tezlik uchun jadval hiylasi: kenglik, uzunlik siljishi va yorug‘lik
 * pikselga bog‘liq, aylanish esa yo‘q — shuning uchun ular BIR MARTA
 * hisoblanib jadvalga yoziladi (`globe-texture.ts`), har kadrda faqat
 * qidirish va rang ko‘chirish qoladi.
 */

const CX = 200;
const CY = 200;
const R = 150;

/** Boshlang'ich ko'rish markazi — O'zbekiston old tomonda turadi */
const START_LON = 56;
const VIEW_LAT = 18;

/** To'liq aylanish vaqti. Logotiplarnikiga teng — ikkalasi bir maromda. */
const TURN_MS = 52_000;

/** Har bir 5 gradusli katak 2x2 ga bo'linadi — qadam 2.5 gradus */
const STEP_DEG = 2.5;
const POINTS = landPoints(2);

/** Logotiplar — halqa bo'ylab teng oraliqda */
const CHIPS: ReadonlyArray<{ key: Marketplace; angle: number }> = [
  { key: 'AMAZON_US', angle: 0 },
  { key: 'WALMART', angle: 60 },
  { key: 'SHOPIFY', angle: 120 },
  { key: 'TIKTOK_SHOP', angle: 180 },
  { key: 'EBAY', angle: 240 },
  { key: 'ETSY', angle: 300 },
];

/** To'rtburchak — qo'shnilari bilan tutashib, yaxlit quruqlik beradi */
function tile(x: number, y: number, halfW: number, halfH: number): string {
  const w = (halfW * 2).toFixed(2);
  const h = (halfH * 2).toFixed(2);
  return `M${(x - halfW).toFixed(1)} ${(y - halfH).toFixed(1)}h${w}v${h}h-${w}z`;
}

/**
 * Katakning ekrandagi yarim kengligi va balandligi.
 *
 * Kenglik bo'ylab qadam har doim bir xil yoy, uzunlik bo'ylab esa
 * `cos(lat)` ga qisqaradi — qutblarga yaqin kataklar ancha tor bo'ladi.
 * Ilgari ikkalasi uchun kattarog'i olinardi va shu sababli qutb
 * atrofidagi quruqlik shishib ketardi. Endi o'lchamlar alohida
 * hisoblanadi. `depth` — chetga qarab siqilish.
 */
function tileSize(lat: number, depth: number): { w: number; h: number } {
  const arc = (R * STEP_DEG * Math.PI) / 180;
  const shrink = Math.max(depth, 0.3);
  const lonArc = arc * Math.max(Math.cos((lat * Math.PI) / 180), 0.12);
  return {
    w: (lonArc * shrink) / 2 + 0.3,
    h: (arc * shrink) / 2 + 0.3,
  };
}

interface Frame {
  land: string;
  uz: string;
  grid: string;
}

function buildFrame(centerLon: number): Frame {
  let land = '';
  let uz = '';

  for (const point of POINTS) {
    const p = orthographic(point.lon, point.lat, centerLon, VIEW_LAT, R);
    if (!p) continue;

    const x = CX + p.x;
    const y = CY + p.y;
    const { w, h } = tileSize(point.lat, p.depth);

    if (point.uz) uz += tile(x, y, w, h);
    else land += tile(x, y, w, h);
  }

  // Koordinata to'ri — shar bilan birga aylanadi
  let grid = '';

  for (let lon = -180; lon < 180; lon += 30) {
    let open = false;
    for (let lat = -90; lat <= 90; lat += 3) {
      const p = orthographic(lon, lat, centerLon, VIEW_LAT, R);
      if (!p) {
        open = false;
        continue;
      }
      grid += `${open ? 'L' : 'M'}${(CX + p.x).toFixed(1)} ${(CY + p.y).toFixed(1)}`;
      open = true;
    }
  }

  for (let lat = -60; lat <= 60; lat += 30) {
    let open = false;
    for (let lon = -180; lon <= 180; lon += 3) {
      const p = orthographic(lon, lat, centerLon, VIEW_LAT, R);
      if (!p) {
        open = false;
        continue;
      }
      grid += `${open ? 'L' : 'M'}${(CX + p.x).toFixed(1)} ${(CY + p.y).toFixed(1)}`;
      open = true;
    }
  }

  return { land, uz, grid };
}

/**
 * Yer teksturasining manzili.
 *
 * Fayl `apps/web/public/` ichida bo'lishi kerak va YOYILGAN
 * (equirectangular) dunyo xaritasi bo'lishi shart: eni bo'yidan aynan
 * ikki barobar, chap chekkasi -180, o'ng chekkasi +180 uzunlik. Sharning
 * bir yarmi tushirilgan oddiy surat ish bermaydi — undan aylanish
 * uchun narigi tomonni olib bo'lmaydi.
 *
 * Fayl topilmasa, quyidagi vektor globus ishlashda davom etadi — shu
 * sababli bitta aniq nom sinaladi, aks holda har yuklanishda konsolga
 * keraksiz 404 tushardi.
 */
const TEXTURE_URL = '/earth.jpg';

/** O'zbekiston markazi — teksturali sharda belgi shu yerga tushadi */
const UZ_LON = 64;
const UZ_LAT = 41;

/** Chizish tomoni pikselda — ekrandagidan kichik, farqi bilinmaydi */
const CANVAS_SIZE = 360;

/** Teksturani shu o'lchamga keltiramiz — namuna olish tez bo'lsin */
const TEX_W = 1024;
const TEX_H = 512;

function loadTexture(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = TEXTURE_URL;
  });
}

export function ConnectedGlobe({ label }: { label: string }) {
  // Birinchi kadr render paytida hisoblanadi — serverdan kelgan HTML'da
  // ham to'liq shar turadi, hydration'gacha bo'sh joy ko'rinmaydi.
  const initial = useMemo(() => buildFrame(START_LON), []);

  const landRef = useRef<SVGPathElement | null>(null);
  const uzRef = useRef<SVGPathElement | null>(null);
  const gridRef = useRef<SVGPathElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /** Tekstura topilganda vektor globus o'rniga fotosurat shar chiziladi */
  const [textured, setTextured] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
    };

    loadTexture().then((img) => {
      if (cancelled || !img) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      // Teksturani bir marta o'qib olamiz
      const src = document.createElement('canvas');
      src.width = TEX_W;
      src.height = TEX_H;
      const srcCtx = src.getContext('2d', { willReadFrequently: true });
      if (!srcCtx) return;
      srcCtx.drawImage(img, 0, 0, TEX_W, TEX_H);

      let texture: ImageData;
      try {
        texture = srcCtx.getImageData(0, 0, TEX_W, TEX_H);
      } catch {
        // Boshqa domendan kelgan rasm canvas'ni "iflos" qiladi va
        // o'qib bo'lmaydi. Bunda vektor globus qoladi.
        return;
      }

      // Kosmosdan olingan suratda okean deyarli qora — quyuq fonda shar
      // ko‘rinmay qoladi. Bir marta ko‘kroq tusga suramiz.
      brightenOcean(texture);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const lut = buildLut(CANVAS_SIZE, VIEW_LAT);
      const out = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);

      // O'zbekiston teksturada belgilanmagan — uni ustidan chizamiz.
      // Shar aylanganda u narigi tomonga o'tib ko'rinmay qoladi.
      const markUzbekistan = (centerLon: number) => {
        const rad = Math.PI / 180;
        const r = CANVAS_SIZE / 2;
        const phi = UZ_LAT * rad;
        const phi0 = VIEW_LAT * rad;
        const dl = (UZ_LON - centerLon) * rad;

        const cosC =
          Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(dl);
        if (cosC <= 0.04) return;

        const x = r + r * Math.cos(phi) * Math.sin(dl);
        const y =
          r - r * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(dl));

        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#4ade80';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.55)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      };

      const paint = (lon: number) => {
        renderFrame(lut, texture, out, lon);
        ctx.putImageData(out, 0, 0);
        markUzbekistan(lon);
      };

      paint(START_LON);
      setTextured(true);

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const started = Date.now();
      stop();
      timer = setInterval(() => {
        const lon = START_LON - (((Date.now() - started) % TURN_MS) / TURN_MS) * 360;
        paint(lon);
      }, 85);
    });

    const onVisibility = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    if (textured) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Ataylab `requestAnimationFrame` emas, balki taymer: aylanish sekin
    // (bir aylanaga 52 soniya), kadrga qat'iy moslashish shart emas, va
    // taymer brauzer sahifani bo'yamayotganda ham bir maromda ishlaydi.
    const STEP_MS = 85; // ~12 marta/soniya

    const start = Date.now();
    let timer: ReturnType<typeof setInterval> | null = null;

    const draw = () => {
      // Uzunlik kamayadi — qit'alar chapdan o'ngga suriladi, ya'ni Yer
      // kosmosdan qanday ko'rinsa, shunday.
      const lon = START_LON - (((Date.now() - start) % TURN_MS) / TURN_MS) * 360;
      const { land, uz, grid } = buildFrame(lon);

      landRef.current?.setAttribute('d', land);
      uzRef.current?.setAttribute('d', uz);
      gridRef.current?.setAttribute('d', grid);
    };

    const run = () => {
      if (timer !== null) return;
      timer = setInterval(draw, STEP_MS);
    };

    const pause = () => {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => (document.hidden ? pause() : run());

    run();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      pause();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [textured]);

  return (
    <div className="relative aspect-square w-full">
      {/* Atmosfera.
          Kosmosdan olingan suratlarda Yerning cheti yupqa, yorqin ko'k
          chiziq bilan o'ralgan bo'ladi — bu quyosh nurining havo
          qatlamida sochilishi.

          Birinchi qatlam shar ORTIDA turadi: nur sferadan tashqariga
          chiqib turgandek ko'rinadi. Ataylab tor — 7% dan oshmaydi,
          aks holda bu atmosfera emas, bezak halqasiga aylanadi. */}
      <div
        className="absolute -inset-[7%] rounded-full"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(90,170,255,0) 43.5%, rgba(96,176,255,0.32) 46.6%, rgba(70,140,230,0.15) 50%, rgba(40,96,190,0) 58%)',
        }}
      />

      {/* Fotosurat shar — faqat tekstura topilganda ko'rinadi.
          `hidden` emas, `opacity`: element o'lchamini saqlab qolish
          brauzerga qayta joylashtirish ishini bermaydi. */}
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        aria-hidden={!textured}
        className="absolute inset-0 h-full w-full"
        style={{ opacity: textured ? 1 : 0 }}
      />

      {/* Ikkinchi qatlam — sharning o'zidagi yorqin chekka chizig'i.
          U canvas USTIDA turadi, shuning uchun tekstura tugagan joyda
          aniq chegara chiqadi. */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(150,210,255,0) 92%, rgba(170,222,255,0.6) 97.5%, rgba(120,185,255,0.32) 100%)',
        }}
      />

      {/* Uchinchi qatlam — o'sha chekka chizig'ining yorug' tomoni.
          Yorug'lik chap yuqoridan tushgani uchun atmosfera ham shu
          yoqda kuchliroq porlaydi. Niqob uni faqat chekkada qoldiradi. */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 34% 26%, rgba(200,232,255,0.5) 0%, rgba(200,232,255,0) 60%)',
          maskImage:
            'radial-gradient(circle at 50% 50%, transparent 90%, #000 96%)',
          WebkitMaskImage:
            'radial-gradient(circle at 50% 50%, transparent 90%, #000 96%)',
        }}
      />

      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full overflow-visible"
        role={textured ? 'presentation' : 'img'}
        aria-label={textured ? undefined : label}
        aria-hidden={textured || undefined}
        style={{ opacity: textured ? 0 : 1 }}
      >
        <defs>
          {/* Okean — yorug'lik chap yuqoridan tushadi */}
          <radialGradient id="ecwt-ocean" cx="0.36" cy="0.3" r="0.78">
            <stop offset="0%" stopColor="#3f86e0" />
            <stop offset="55%" stopColor="#1f56b4" />
            <stop offset="100%" stopColor="#0d2c72" />
          </radialGradient>

          {/* Chetga qarab qorayish — sharning yumaloqligini beradi */}
          <radialGradient id="ecwt-limb" cx="0.5" cy="0.5" r="0.5">
            <stop offset="55%" stopColor="#020714" stopOpacity="0" />
            <stop offset="88%" stopColor="#020714" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#020714" stopOpacity="0.78" />
          </radialGradient>

          {/* Quruqlik va to'r sharning tashqarisiga chiqmasin */}
          <clipPath id="ecwt-sphere-clip">
            <circle cx={CX} cy={CY} r={R} />
          </clipPath>
        </defs>

        <circle cx={CX} cy={CY} r={R} fill="url(#ecwt-ocean)" />

        <g clipPath="url(#ecwt-sphere-clip)">
          <path ref={landRef} d={initial.land} fill="#c2a878" />
          <path ref={uzRef} d={initial.uz} fill="#4ade80" />
          <path
            ref={gridRef}
            d={initial.grid}
            fill="none"
            stroke="#0b1f4d"
            strokeOpacity="0.4"
            strokeWidth="0.7"
          />
        </g>

        <circle cx={CX} cy={CY} r={R} fill="url(#ecwt-limb)" />
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#7fabda" strokeOpacity="0.3" />
      </svg>

      {/* Logotiplar halqasi. Tashqi qatlam aylanadi, eng ichkarisi esa
          teng tezlikda teskari aylanib, logotipni tik ushlab turadi.
          Kichik ekranda halqa qisqaradi — logotiplar kichraytiriladi. */}
      <div className="animate-orbit absolute inset-0 [--chip-scale:0.7] sm:[--chip-scale:0.85] lg:[--chip-scale:1]">
        {CHIPS.map(({ key, angle }) => (
          <div key={key} className="absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
            <div className="absolute left-1/2 top-0 -translate-x-1/2">
              <div style={{ transform: `rotate(${-angle}deg) scale(var(--chip-scale))` }}>
                <span className="animate-orbit-back flex items-center rounded-xl border border-white/12 bg-brand-950/85 px-3.5 py-2.5 backdrop-blur-md">
                  <MarketplaceMark id={key} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
