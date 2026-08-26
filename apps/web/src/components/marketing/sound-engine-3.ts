import { type Drone, impulse, noise } from './sound-engine';

/**
 * Uchinchi dvigatel — ALOHIDA TOVUSHLAR.
 *
 * ── Nega yana bir dvigatel ──────────────────────────────────────────
 * Avvalgi 146 ta variantning hammasi UZLUKSIZ edi: tovush to'xtovsiz
 * chiqib turadi, tezlik esa uni o'zgartiradi. Usullar har xil bo'lsa
 * ham, tamoyil bitta. Shuning uchun ular quloqqa bir oilaga o'xshab
 * eshitiladi.
 *
 * Bu yerda tamoyil boshqacha: sichqoncha har necha piksel yurganda
 * BITTA qisqa, toza tovush chiqadi. Qimmat qurilmalar va kinodagi
 * interfeys ovozlari aynan shunday ishlaydi — ular fon emas, ular
 * javob.
 *
 * ── Nega bu ilgari yaxshi chiqmagan edi ─────────────────────────────
 * Eng birinchi urinishda ham alohida tovushlar bor edi, lekin ular
 * bitta generatordan iborat — quruq "bip". Yaxshi qisqa tovush esa
 * uch qismdan iborat:
 *
 *   ZARBA (click) — 2–8 ms. Quloq tovushni aynan shundan taniydi.
 *   TANA (partials) — ohang. Nisbatlar butun bo'lsa musiqiy, butun
 *                   bo'lmasa metall.
 *   DUM (space)   — reverb. Busiz tovush "qirqilgan" bo'lib qoladi.
 *
 * ── Notaga tushirish ────────────────────────────────────────────────
 * Tasodifiy balandlik shovqinga aylanadi. Shuning uchun har bir tovush
 * qatordagi notaga tushiriladi va kursorning gorizontal o'rni qaysi
 * nota chiqishini belgilaydi: chapda past, o'ngda baland. Natijada
 * sichqoncha yurishi ohangga o'xshab qoladi.
 */

export interface ShotRecipe {
  id: string;
  name: string;
  desc: string;
  group: string;

  /** Har necha piksel harakatdan keyin bitta tovush */
  every: number;
  /** Eng past nota */
  base: number;
  /** Qator, yarim tonlarda */
  scale: number[];
  /** Kursor o'rni notani qanchalik boshqaradi (0 — umuman yo'q) */
  followX?: number;

  /** Boshlanish zarbasi — shovqinning juda qisqa bo'lagi */
  click?: { level: number; freq: number; q: number; decay: number };
  /** Tovush tanasi: [nisbat, daraja] */
  partials?: Array<[number, number]>;
  /** Tananing so'nish vaqti, soniyada */
  decay?: number;
  type?: OscillatorType;
  /** Chastota sirpanishi: boshi -> oxiri, nisbatda */
  sweep?: [number, number];
  /** Havo: filtrlangan shovqin bo'lagi */
  air?: { level: number; from: number; to: number; q: number; decay: number };
  /** Pastdagi zarba — og'irlik uchun */
  thump?: { level: number; freq: number; decay: number };

  /** Reverbga yuboriladigan ulush */
  space: number;
  /** Stereo tarqalish 0..1 */
  spread?: number;
  /** Balandlikni tenglashtirish ko'paytmasi, o'lchov bo'yicha */
  trim?: number;
}

/**
 * Tezlik birligi: `k = 1` da sichqoncha sekundiga shuncha piksel
 * yuradi deb hisoblanadi. `SoundLab` va `SiteSound` dagi
 * `SPEED_FULL = 2.2` px/ms bilan bir xil.
 */
const PX_PER_SEC = 2200;

export function startShots(ctx: AudioContext, out: GainNode, r: ShotRecipe): Drone {
  const now = ctx.currentTime;

  const bus = ctx.createGain();
  bus.gain.value = r.trim ?? 1;
  bus.connect(out);

  const conv = ctx.createConvolver();
  conv.buffer = impulse(ctx);
  const wet = ctx.createGain();
  wet.gain.value = r.space;
  conv.connect(wet);
  wet.connect(bus);

  const dry = ctx.createGain();
  dry.gain.value = 1;
  dry.connect(bus);

  /** Har bir tovush shu yerga ulanadi */
  const send = (node: AudioNode, pan: number) => {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    node.connect(p);
    p.connect(dry);
    p.connect(conv);
  };

  let acc = 0;
  let lastT = now;
  let stopped = false;
  let stepIndex = 0;

  const fire = (t: number, k: number, x: number) => {
    // Nota tanlash: kursor o'rni + qadam. Ikkalasi ham qator ichida
    // qoladi, shuning uchun natija har doim ohangdor.
    const follow = r.followX ?? 0.6;
    const fromX = Math.floor(x * r.scale.length * follow);
    const idx = (fromX + stepIndex) % r.scale.length;
    stepIndex += 1;
    const f = r.base * 2 ** (r.scale[idx] / 12);

    // Tezlik tovushni kuchaytiradi va yorqinlashtiradi
    const vel = 0.45 + 0.55 * k;
    const pan = ((idx / Math.max(r.scale.length - 1, 1)) * 2 - 1) * (r.spread ?? 0.5);
    const decay = r.decay ?? 0.4;

    // ── Zarba
    if (r.click) {
      const src = ctx.createBufferSource();
      src.buffer = noise(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = r.click.freq;
      bp.Q.value = r.click.q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(r.click.level * vel, t + 0.0012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + r.click.decay);
      src.connect(bp);
      bp.connect(g);
      send(g, pan);
      src.start(t, Math.random() * 2);
      src.stop(t + r.click.decay + 0.02);
    }

    // ── Tana
    for (const [ratio, level] of r.partials ?? []) {
      const o = ctx.createOscillator();
      o.type = r.type ?? 'sine';
      const f0 = f * ratio;
      if (r.sweep) {
        o.frequency.setValueAtTime(f0 * r.sweep[0], t);
        o.frequency.exponentialRampToValueAtTime(f0 * r.sweep[1], t + decay);
      } else {
        o.frequency.value = f0;
      }
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(level * vel, t + 0.004);
      // Yuqori qismlar tezroq so'nadi — tabiiy xatti-harakat
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay / (1 + (ratio - 1) * 0.4));
      o.connect(g);
      send(g, pan);
      o.start(t);
      o.stop(t + decay + 0.05);
    }

    // ── Havo
    if (r.air) {
      const src = ctx.createBufferSource();
      src.buffer = noise(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = r.air.q;
      bp.frequency.setValueAtTime(r.air.from, t);
      bp.frequency.exponentialRampToValueAtTime(r.air.to, t + r.air.decay);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(r.air.level * vel, t + r.air.decay * 0.18);
      g.gain.exponentialRampToValueAtTime(0.0001, t + r.air.decay);
      src.connect(bp);
      bp.connect(g);
      send(g, -pan);
      src.start(t, Math.random() * 2);
      src.stop(t + r.air.decay + 0.02);
    }

    // ── Past zarba
    if (r.thump) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(r.thump.freq * 1.6, t);
      o.frequency.exponentialRampToValueAtTime(r.thump.freq, t + r.thump.decay * 0.6);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(r.thump.level * vel, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + r.thump.decay);
      o.connect(g);
      g.connect(dry);
      o.start(t);
      o.stop(t + r.thump.decay + 0.05);
    }
  };

  return {
    update(k, x) {
      if (stopped) return;
      const t = ctx.currentTime;
      const dt = Math.min(Math.max(t - lastT, 0), 0.2);
      lastT = t;

      // Bosib o'tilgan masofa: tezlik × vaqt. Tovush aynan MASOFAGA
      // bog'liq — vaqtga emas. Shuning uchun sekin yurganda ham,
      // tez yurganda ham tovushlar orasidagi oraliq bir xil bo'ladi,
      // faqat tezligi o'zgaradi.
      acc += k * PX_PER_SEC * dt;

      // Bir yangilanishda ikkitadan ko'p tovush chiqmasin: aks holda
      // to'xtab qolgandan keyin hammasi birdan yog'iladi
      let guard = 0;
      while (acc >= r.every && guard < 2) {
        acc -= r.every;
        fire(t + 0.005 + guard * 0.012, k, x);
        guard += 1;
      }
      if (acc > r.every * 3) acc = 0;
    },
    stop() {
      stopped = true;
      const t = ctx.currentTime;
      bus.gain.setTargetAtTime(0, t, 0.08);
    },
  };
}
