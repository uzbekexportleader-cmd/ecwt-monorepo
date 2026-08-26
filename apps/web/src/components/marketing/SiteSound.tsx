'use client';

import { useEffect, useRef } from 'react';
import { type Drone } from './sound-engine';
import { startBig } from './sound-engine-5';
import { RECIPES_6 } from './sound-recipes-6';

/**
 * Sahifadagi ovoz — sichqoncha harakatiga javob beradi.
 *
 * Tanlangan variant: "Echo — sakrash". Sichqoncha har ikki yuz yigirma
 * piksel yurganda bitta toza tovush boshlanadi va u chapdan o'ngga
 * sakrab, uch yarim soniyalik xonada so'nadi. Ishoralar bir-birining
 * ustiga tushadi, shuning uchun tez harakatda katta va o'zgarib
 * turadigan fazo hosil bo'ladi; to'xtaganda hammasi o'z-o'zidan
 * so'nadi.
 *
 * ── Qachon boshlanadi ───────────────────────────────────────────────
 * Ovoz sahifa ochilishi bilan DARHOL yoqishga urinadi. Brauzer ruxsat
 * bersa — hech narsa bosish kerak emas.
 *
 * Lekin ruxsat har doim ham berilmaydi, va buni kod bilan aylanib
 * o'tib bo'lmaydi. Chrome, Safari va Firefox bir xil qoidaga amal
 * qiladi: notanish sayt o'z-o'zidan ovoz chiqara olmaydi. Chrome
 * qo'shimcha ravishda "media engagement" ni hisobga oladi — foydalanuvchi
 * saytga bir necha marta kirgan bo'lsa, ruxsat o'z-o'zidan beriladi.
 *
 * Shuning uchun ikki bosqich:
 *   1. Darhol urinib ko'ramiz (`resume`). Ruxsat bo'lsa — tamom.
 *   2. Bo'lmasa, foydalanuvchining BIRINCHI harakatini kutamiz. Bosish,
 *      tegish, klavisha — qaysi biri bo'lsa ham. Sichqonchani yurgizish
 *      esa yaramaydi: spetsifikatsiya bo'yicha u "faollashtiruvchi
 *      harakat" hisoblanmaydi.
 *
 * Ovoz dvigateli har ikki holatda ham oldindan qurilgan bo'ladi, ya'ni
 * ruxsat berilgan zahoti kechikishsiz eshitiladi.
 *
 * ── Ko'rinadigan tugma yo'q ─────────────────────────────────────────
 * Burchakda o'chirgich bor edi, u so'rov bo'yicha olib tashlandi.
 * Buning bahosi bor: endi sahifadan ovozni jimlata olmaydi — faqat
 * brauzer varag'ini jimlatish orqali (Chrome/Edge da varaq ustiga
 * o'ng tugma → "Mute tab"). Agar keyinchalik kerak bo'lsa, o'chirgichni
 * pastki qismga yoki menyuga qaytarish mumkin.
 *
 * ── Telefon ─────────────────────────────────────────────────────────
 * Sensorli ekranda "sichqoncha yurishi" degan tushuncha yo'q, shuning
 * uchun u yerda ovoz umuman yoqilmaydi.
 */

/** Qaysi ovoz — `/[locale]/sound` sahifasidan tanlangan */
const SOUND_ID = 'e-pingpong';

const VOLUME = 0.24;
const TICK_MS = 40;
/** Shu tezlikda ovoz to'liq quvvatga chiqadi (piksel/millisekund) */
const SPEED_FULL = 2.2;

export function SiteSound() {
  const droneRef = useRef<Drone | null>(null);
  const lastRef = useRef({ x: 0, y: 0, t: 0 });
  const speedRef = useRef(0);

  useEffect(() => {
    // Sensorli qurilmada umuman ishlamaydi
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    const recipe = RECIPES_6.find((r) => r.id === SOUND_ID);
    if (!recipe) return;

    let timer: number | undefined;

    // Kontekst DARHOL quriladi va darhol yoqishga urinadi. Brauzer
    // ruxsat bergan holatlarda (foydalanuvchi bu saytga ilgari kirgan
    // bo'lsa, yoki sozlamada ruxsat berilgan bo'lsa) ovoz hech narsa
    // bosmasdan boshlanadi.
    const ctx = new Ctor();

    const master = ctx.createGain();
    master.gain.value = VOLUME;
    master.connect(ctx.destination);
    droneRef.current = startBig(ctx, master, recipe);

    timer = window.setInterval(() => {
      if (ctx.state !== 'running') return;
      // Harakat to'xtasa tezlik o'z-o'zidan nolga tushadi
      if (performance.now() - lastRef.current.t > 90) speedRef.current *= 0.72;
      droneRef.current?.update(
        Math.min(speedRef.current / SPEED_FULL, 1),
        lastRef.current.x / Math.max(window.innerWidth, 1),
      );
    }, TICK_MS);

    /**
     * Yoqishga urinish.
     *
     * `resume()` brauzer ruxsat bermasa jimgina rad etadi — bu xato
     * emas, shuning uchun `catch` bo'sh. Ruxsat bergan zahoti
     * tinglovchilar olib tashlanadi.
     */
    const wake = () => {
      if (ctx.state === 'running') {
        detach();
        return;
      }
      void ctx.resume().then(() => {
        if (ctx.state === 'running') detach();
      }, () => {});
    };

    /**
     * Brauzer ovozni ochadigan harakatlar.
     *
     * MUHIM: sichqonchani yurgizish ham, sahifani aylantirish ham bu
     * ro'yxatga KIRMAYDI — spetsifikatsiya bo'yicha ular "faollashtiruvchi
     * harakat" hisoblanmaydi. Ishlaydiganlari: bosish, tegish va
     * klavisha. Qaysi biri birinchi bo'lsa, o'sha yoqadi.
     */
    const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'] as const;

    /**
     * Faqat HARAKAT tinglovchilari olib tashlanadi.
     *
     * Varaq ko'rinishini kuzatuvchi qoladi: brauzer boshqa varaqqa
     * o'tilganda kontekstni to'xtatib qo'yishi mumkin va qaytganda uni
     * yana yoqish kerak bo'ladi. Uni ham o'chirib yuborsak, qaytgandan
     * keyin ovoz jim qolardi.
     */
    const detach = () => {
      for (const g of GESTURES) window.removeEventListener(g, wake);
    };

    /** Boshqa varaqdan qaytganda kontekst to'xtab qolgan bo'lishi mumkin */
    const onVisible = () => {
      if (!document.hidden) wake();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const now = performance.now();
      const last = lastRef.current;
      const dt = now - last.t;
      if (dt > 0) {
        const raw = Math.min(Math.hypot(e.clientX - last.x, e.clientY - last.y) / dt, SPEED_FULL);
        // Silliqlash: xom tezlik juda sakrab turadi
        speedRef.current = speedRef.current * 0.6 + raw * 0.4;
      }
      lastRef.current = { x: e.clientX, y: e.clientY, t: now };
    };

    // Birinchi urinish — hech qanday harakatsiz
    wake();

    for (const g of GESTURES) window.addEventListener(g, wake, { passive: true });
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      detach();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pointermove', onMove);
      if (timer !== undefined) window.clearInterval(timer);
      droneRef.current?.stop();
      droneRef.current = null;
      speedRef.current = 0;
      window.setTimeout(() => void ctx.close(), 900);
    };
  }, []);

  return null;
}
