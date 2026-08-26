'use client';

import { useEffect, useRef, useState } from 'react';
import { SOUNDS, playShot, startDrone, type Drone } from './sound-kit';
import { startRich } from './sound-engine';
import { startExotic } from './sound-engine-2';
import { startShots } from './sound-engine-3';
import { startSpectral } from './sound-engine-4';
import { startBig } from './sound-engine-5';
import { RECIPES as RECIPES_1 } from './sound-recipes';
import { RECIPES_2 } from './sound-recipes-2';
import { RECIPES_3 } from './sound-recipes-3';
import { RECIPES_4 } from './sound-recipes-4';
import { RECIPES_5 } from './sound-recipes-5';
import { RECIPES_6 } from './sound-recipes-6';

/**
 * Ovoz tanlash — VAQTINCHALIK sahifa.
 *
 * Bu yerda to'rt avlod ovoz bor va ular bir xil emas:
 *
 *   ALOHIDA (RECIPES_4) — eng yangisi va tamoyili boshqacha: uzluksiz
 *                    emas, HAR NECHA PIKSELDA bitta qisqa tovush.
 *                    Yigirmata, ro'yxatning boshida.
 *   G'ALATI (RECIPES_3) — o'nta turli sintez usuli: chalinadigan sim,
 *                    qo'ng'iroq, halqa modulyatsiyasi va h.k. Qirqta.
 *   IKKINCHI (RECIPES_2) — motor chiyillashi, filtr tebranishi,
 *                    aks-sado, metall tus. Qirqta.
 *   BIRINCHI (RECIPES_1) — sub-bass + ko'p ovozli qatlam + havo +
 *                    reverb. Boy, lekin ichida harakat kam. Qirqta.
 *   ODDIY (SOUNDS) — eng birinchi urinish: bir-ikki generator,
 *                    reverbsiz. Solishtirish uchun qoldirilgan.
 *
 * Birinchi uch to'plam uzluksiz: sichqoncha tezligi tovushni
 * o'zgartiradi, alohida "tiq"lar chiqmaydi. To'rtinchisi esa aksincha.
 *
 * Uzluksiz ovozni bir marta bosib to'liq baholab bo'lmaydi — u
 * harakatsiz jim turadi. Shuning uchun "Eshitish" dvigatelni qisqa
 * vaqtga o'zi tezlashtirib, keyin so'ndirib ko'rsatadi; "Sinash" esa
 * uni sichqonchaga ulaydi, ya'ni saytdagidek.
 */

/**
 * Ikkala to'plam bitta ro'yxatda. Guruh sarlavhalari retseptlarning
 * o'zidan kelib chiqadi, shuning uchun yangi to'plam qo'shilganda bu
 * yerda hech narsa o'zgartirish shart emas.
 */
const RECIPES = [...RECIPES_1, ...RECIPES_2];

/**
 * Uchinchi to'plam alohida turadi: u boshqa dvigateldan chiqadi,
 * shuning uchun uni birinchi ikkitasi bilan bitta ro'yxatga qo'shib
 * bo'lmaydi — ishga tushirish funksiyasi boshqa.
 */
const startAny = (ctx: AudioContext, out: GainNode, id: string) => {
  const rich = RECIPES.find((r) => r.id === id);
  if (rich) return startRich(ctx, out, rich);
  const exotic = RECIPES_3.find((r) => r.id === id);
  if (exotic) return startExotic(ctx, out, exotic);
  const shots = RECIPES_4.find((r) => r.id === id);
  if (shots) return startShots(ctx, out, shots);
  const spectral = RECIPES_5.find((r) => r.id === id);
  if (spectral) return startSpectral(ctx, out, spectral);
  const big = RECIPES_6.find((r) => r.id === id);
  if (big) return startBig(ctx, out, big);
  return null;
};

/** Karta uchun umumiy ko'rinish — hamma dvigatel shu shaklda */
const ALL_RICH = [
  // Eng yangi to'plamlar tepada: pastga tushib borgan sari eskiroq
  ...RECIPES_6.map((r) => ({ id: r.id, name: r.name, desc: r.desc, group: r.group })),
  ...RECIPES_5.map((r) => ({ id: r.id, name: r.name, desc: r.desc, group: r.group })),
  ...RECIPES_4.map((r) => ({ id: r.id, name: r.name, desc: r.desc, group: r.group })),
  ...RECIPES.map((r) => ({ id: r.id, name: r.name, desc: r.desc, group: r.group })),
  ...RECIPES_3.map((r) => ({ id: r.id, name: r.name, desc: r.desc, group: r.group })),
];

const VOLUME = 0.16;
const MIN_DIST = 30;
const MIN_GAP = 80;
const TICK_MS = 40;
const SPEED_FULL = 2.2;

export function SoundLab() {
  const [active, setActive] = useState<string | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const droneRef = useRef<Drone | null>(null);
  const lastRef = useRef({ x: 0, y: 0, t: 0 });
  const speedRef = useRef(0);

  const ensure = () => {
    if (ctxRef.current) return ctxRef.current;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;

    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = VOLUME;
    master.connect(ctx.destination);
    ctxRef.current = ctx;
    masterRef.current = master;
    return ctx;
  };

  useEffect(() => {
    if (!active) return;

    const ctx = ensure();
    const master = masterRef.current;
    if (!ctx || !master) return;

    const rich = startAny(ctx, master, active);
    const simple = SOUNDS.find((s) => s.id === active);
    const isDrone = !!rich || simple?.mode === 'drone';

    let timer: number | undefined;

    if (rich) droneRef.current = rich;
    else if (simple?.mode === 'drone') droneRef.current = startDrone(ctx, master, simple.id);

    if (isDrone) {
      timer = window.setInterval(() => {
        if (ctx.state !== 'running') return;
        // Harakat to'xtasa tezlik o'z-o'zidan nolga tushadi
        if (performance.now() - lastRef.current.t > 90) speedRef.current *= 0.72;
        droneRef.current?.update(
          Math.min(speedRef.current / SPEED_FULL, 1),
          lastRef.current.x / Math.max(window.innerWidth, 1),
        );
      }, TICK_MS);
    }

    const onMove = (e: PointerEvent) => {
      if (ctx.state !== 'running') return;
      const now = performance.now();
      const last = lastRef.current;
      const dist = Math.hypot(e.clientX - last.x, e.clientY - last.y);
      const dt = now - last.t;

      if (isDrone) {
        if (dt > 0) {
          const raw = Math.min(dist / dt, SPEED_FULL);
          speedRef.current = speedRef.current * 0.6 + raw * 0.4;
        }
        lastRef.current = { x: e.clientX, y: e.clientY, t: now };
        return;
      }

      if (dist < MIN_DIST || dt < MIN_GAP) return;
      lastRef.current = { x: e.clientX, y: e.clientY, t: now };
      if (simple) playShot(ctx, master, simple.id, e.clientX / Math.max(window.innerWidth, 1));
    };

    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove);
      if (timer !== undefined) window.clearInterval(timer);
      droneRef.current?.stop();
      droneRef.current = null;
      speedRef.current = 0;
    };
  }, [active]);

  /**
   * Uzluksiz ovozni namuna sifatida ko'rsatish.
   *
   * Bir tezlikda ushlab turish yetarli emas: quloq o'zgarishni
   * eshitadi. Shuning uchun tezlik avval ko'tariladi, keyin tushadi —
   * bu sichqonchani bir marta silkitgandek.
   */
  const demo = (d: Drone | null) => {
    if (!d) return;
    let k = 0;
    let up = true;
    const id = window.setInterval(() => {
      k = up ? Math.min(k + 0.1, 0.85) : Math.max(k - 0.1, 0);
      if (k >= 0.85) up = false;
      d.update(k, 0.5);
    }, 60);
    window.setTimeout(() => {
      window.clearInterval(id);
      d.stop();
    }, 2800);
  };

  const preview = (id: string) => {
    const ctx = ensure();
    const master = masterRef.current;
    if (!ctx || !master) return;
    void ctx.resume();

    const rich = startAny(ctx, master, id);
    if (rich) {
      demo(rich);
      return;
    }

    const simple = SOUNDS.find((s) => s.id === id);
    if (!simple) return;
    if (simple.mode === 'shot') playShot(ctx, master, simple.id, 0.5);
    else demo(startDrone(ctx, master, simple.id));
  };

  const card = (id: string, name: string, desc: string, badge?: string) => (
    <li
      key={id}
      className={`flex items-center justify-between gap-4 rounded-2xl border p-5 transition-colors ${
        active === id
          ? 'border-green-400/50 bg-green-400/[0.06]'
          : 'border-white/[0.12] bg-white/[0.03]'
      }`}
    >
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[16px] font-semibold">{name}</span>
          {badge && (
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-[9.5px] font-medium uppercase tracking-[0.1em] text-brand-200">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-1 block text-[13px] leading-snug text-brand-200">{desc}</span>
      </span>

      <span className="flex shrink-0 flex-col gap-2">
        <button
          type="button"
          onClick={() => preview(id)}
          className="rounded-full bg-white px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-brand-950 transition-transform hover:scale-[1.04]"
        >
          Eshitish
        </button>
        <button
          type="button"
          onClick={() => {
            void ensure()?.resume();
            setActive(active === id ? null : id);
          }}
          aria-pressed={active === id}
          className={`rounded-full border px-4 py-1.5 text-[12px] font-medium uppercase tracking-[0.1em] transition-colors ${
            active === id
              ? 'border-green-400/60 text-green-400'
              : 'border-white/20 text-brand-200 hover:text-white'
          }`}
        >
          {active === id ? 'Yoqilgan' : 'Sinash'}
        </button>
      </span>
    </li>
  );

  // Guruhlar retseptlar ro'yxatidan o'zi kelib chiqadi — qo'lda
  // yozilgan ro'yxat vaqt o'tib fayl bilan mos kelmay qolardi.
  const groups = [...new Set(ALL_RICH.map((r) => r.group))];

  return (
    <div className="flex flex-col gap-14">
      {groups.map((g) => (
        <section key={g}>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand-200">{g}</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {ALL_RICH.filter((r) => r.group === g).map((r) => card(r.id, r.name, r.desc))}
          </ul>
        </section>
      ))}

      <section>
        <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand-200/60">
          Avvalgi, sodda variantlar
        </h2>
        <p className="mt-2 max-w-[54ch] text-[13px] leading-snug text-brand-200/50">
          Bular birinchi urinish — bir-ikki generatordan iborat, reverbsiz va tor.
          Solishtirish uchun qoldirilgan.
        </p>
        <ul className="mt-5 grid gap-4 opacity-70 sm:grid-cols-2">
          {SOUNDS.map((s) => card(s.id, s.name, s.desc, s.mode === 'drone' ? 'uzluksiz' : undefined))}
        </ul>
      </section>
    </div>
  );
}
