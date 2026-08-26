'use client';

import { useEffect, useRef } from 'react';

/**
 * Jonli yulduzlar qatlami.
 *
 * HOZIR ISHLATILMAYDI. Bosh sahifada fon o'rnini video egalladi
 * (`NightBackdrop`), va harakatni endi kameraning o'zi beradi.
 * Fayl saqlab qo'yilgan: fon yana suratga qaytarilsa, kerak bo'ladi.
 *
 * Qatlam qo'yilgan joyning ustiga tirik yulduzlarni chizadi. Uchta narsa
 * uni jonli qiladi:
 *
 *   1. MILTILLASH. Haqiqatda yulduz miltillashi — bu atmosferaning
 *      qimirlashi. Har bir yulduzning o'z tezligi va o'z fazasi bor,
 *      shuning uchun ular bir vaqtda emas, tarqoq miltillaydi.
 *
 *   2. PARALLAKS. Yulduzlar uch qatlamga bo'lingan. Yaqinlari tezroq,
 *      uzoqlari sekinroq suriladi — ko'z buni chuqurlik deb o'qiydi.
 *      Suratning o'zi eng sekin (140 s), ya'ni eng uzoq qatlam.
 *
 *   3. O'LCHAM VA RANG TARQOQLIGI. Bir xil oq nuqtalar sun'iy chiqadi.
 *      Haqiqiy yulduzlar issiq (sarg'ish) dan sovuq (ko'kish) gacha
 *      bo'ladi, va yorug'lari kamchilikni tashkil qiladi.
 *
 * Nega `requestAnimationFrame` emas? Bu sahifa avtomatlashtirilgan
 * brauzerda ham tekshiriladi, u yerda rAF sekundiga bir marta ishlaydi.
 * `setInterval` esa ikkala holatda ham bir xil yuradi.
 */

/** Qatlamlar: [yulduzlar ulushi, suzish tezligi (px/s), eng katta radius] */
const LAYERS = [
  { share: 0.5, drift: 1.4, maxR: 0.75 },
  { share: 0.32, drift: 2.6, maxR: 1.15 },
  { share: 0.18, drift: 4.2, maxR: 1.7 },
] as const;

/** Har 100 000 kv. pikselga nechta yulduz */
const DENSITY = 14;

/** Kadr oralig'i. 50 ms ≈ 20 kadr/s — miltillash uchun yetarli, yuk esa kam. */
const FRAME_MS = 50;

/**
 * Yulduz ranglari — issiqdan sovuqqa.
 *
 * Haqiqiy taqsimotda qizil mitti yulduzlar ko'p, lekin ular ko'zga
 * ko'rinmaydi. Ko'rinadiganlari orasida oq va ko'kish ustun, shuning
 * uchun ro'yxat shunga moslangan.
 */
const TINTS = [
  [255, 244, 232], // issiq oq
  [255, 255, 255], // oq
  [246, 249, 255], // sal ko'kish
  [214, 232, 255], // ko'k
  [255, 232, 205], // sarg'ish
] as const;

interface Star {
  x: number;
  y: number;
  r: number;
  tint: readonly [number, number, number];
  /** Asosiy yorqinlik 0..1 */
  base: number;
  /** Miltillash chuqurligi 0..1 */
  depth: number;
  /** Radian/s */
  speed: number;
  /** Boshlang'ich faza */
  phase: number;
  layer: number;
}

function makeStars(w: number, h: number): Star[] {
  const total = Math.round(((w * h) / 100_000) * DENSITY);
  const stars: Star[] = [];

  LAYERS.forEach((layer, li) => {
    const n = Math.round(total * layer.share);

    for (let i = 0; i < n; i += 1) {
      // Yorqin yulduzlar kam bo'lishi kerak: kvadratga ko'tarish
      // taqsimotni xira tomonga suradi.
      const t = Math.random() * Math.random();

      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.35 + t * (layer.maxR - 0.35),
        tint: TINTS[(Math.random() * TINTS.length) | 0],
        base: 0.3 + t * 0.65,
        depth: 0.25 + Math.random() * 0.5,
        speed: 0.5 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
        layer: li,
      });
    }
  });

  return stars;
}

export function LiveStars() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Retina ekranda nuqtalar loyqa bo'lmasligi uchun piksel nisbati.
    // 2 dan oshirmaymiz: farqi ko'rinmaydi, yuk esa kvadratiga o'sadi.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0;
    let h = 0;
    let stars: Star[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;

      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = makeStars(w, h);
    };

    resize();

    const start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        // Suzish. Chekkadan chiqqani narigi tomondan qaytib kiradi,
        // shuning uchun bo'sh joy hosil bo'lmaydi.
        const dx = still ? 0 : (t * LAYERS[s.layer].drift) % w;
        const x = (s.x + dx) % w;

        // Miltillash. Ikkita sinus qo'shilgani uchun takrorlanish
        // sezilmaydi — bitta sinus soat mayatnigidek bir xil yuradi.
        const tw = still
          ? 1
          : 1 -
            s.depth *
              (0.5 - 0.5 * Math.sin(t * s.speed + s.phase)) *
              (0.7 + 0.3 * Math.sin(t * s.speed * 0.37 + s.phase * 1.7));

        const a = Math.max(0, Math.min(1, s.base * tw));
        const [r, g, b] = s.tint;

        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx.beginPath();
        ctx.arc(x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();

        // Eng yorug'lari atrofga nur beradi — shundagina ular
        // "nuqta" emas, "yulduz" bo'lib o'qiladi.
        if (s.r > 1.15 && a > 0.55) {
          ctx.fillStyle = `rgba(${r},${g},${b},${a * 0.13})`;
          ctx.beginPath();
          ctx.arc(x, s.y, s.r * 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    draw(start);

    if (still) {
      const onResize = () => {
        resize();
        draw(performance.now());
      };
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }

    let timer: number | undefined;

    const run = () => {
      timer = window.setInterval(() => draw(performance.now()), FRAME_MS);
    };

    const stop = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    // Yashirin ilovada chizishdan ma'no yo'q — batareyani yeydi
    const onVisibility = () => {
      stop();
      if (!document.hidden) run();
    };

    const onResize = () => {
      resize();
      draw(performance.now());
    };

    run();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
