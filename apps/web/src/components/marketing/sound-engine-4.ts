import { type Drone, impulse } from './sound-engine';

/**
 * To'rtinchi dvigatel — FM, TO'LQIN JADVALI va MAXSUS SPEKTR.
 *
 * ── Nega yana ─────────────────────────────────────────────────────
 * Avvalgi 166 ta variantning hammasi bir xil manbadan chiqqan:
 * brauzerning to'rtta tayyor to'lqini (sine, square, sawtooth,
 * triangle). Ularni filtrlash, bo'lish, aks-sado qo'shish tovush
 * XARAKTERINI o'zgartiradi, lekin TEMBRINI emas. Shuning uchun
 * usullar har xil bo'lsa ham, natija bir oilaga o'xshab eshitiladi.
 *
 * Bu yerda manbaning o'zi boshqa:
 *
 *   FM   — bir generator ikkinchisining chastotasini boshqaradi.
 *          Nisbat butun bo'lsa ohangdor, butun bo'lmasa metall
 *          chiqadi. Sakson va to'qsoninchi yillardagi "raqamli"
 *          tovush — elektro pianino, qo'ng'iroq, shisha — aynan
 *          shundan. Filtr bilan bunday tembrni yasab bo'lmaydi.
 *
 *   WT   — to'lqin jadvali. Bir nechta turli spektr yonma-yon
 *          qo'yiladi va tovush ular orasida SUZIB yuradi. Zamonaviy
 *          sintezatorlarning "futuristik" tovushi shu.
 *
 *   SPEC — maxsus spektr. Har bir ohang darajasi qo'lda beriladi,
 *          ya'ni to'lqin shakli noldan quriladi.
 *
 * ── Nima uchun teskari aloqa yo'q ──────────────────────────────────
 * Haqiqiy FM sintezatorlarda operatorning o'ziga qaytishi bor. Web
 * Audio da halqa ichida majburiy kechikish tuguni bo'lishi kerak va
 * u FM uchun juda uzun — natija FM emas, taroq filtr bo'lib qoladi.
 * Shuning uchun grit butun bo'lmagan nisbatlar orqali olinadi.
 */

export interface FmOp {
  /** Tashuvchiga nisbatan chastota */
  ratio: number;
  /** Modulyatsiya kuchi (tashuvchi chastotasiga nisbatan) */
  index: number;
}

export interface Spectral {
  id: string;
  name: string;
  desc: string;
  group: string;
  kind: 'fm' | 'wt' | 'spec';

  base: number;
  span: number;
  cut: [number, number];
  q: number;
  space: number;
  sub?: number;
  trim?: number;

  /* ── FM ── */
  /**
   * `stack`    — operatorlar zanjiri: 3 → 2 → 1 → tashuvchi. Chuqur,
   *              murakkab tembr.
   * `parallel` — hammasi to'g'ridan-to'g'ri tashuvchiga. Tozaroq.
   * `two`      — ikkita mustaqil juftlik, stereoga yoyilgan.
   */
  algo?: 'stack' | 'parallel' | 'two';
  ops?: FmOp[];
  /** Tashuvchi to'lqini */
  carrier?: OscillatorType;

  /* ── WT ── */
  /** Spektrlar ro'yxati: har biri ohanglar darajalari */
  tables?: number[][];
  /** Suzish tezligi, Gts */
  morph?: number;
  /** Tezlik suzish o'rnini qanchalik suradi */
  morphSpeed?: number;

  /* ── SPEC ── */
  wave?: number[];
  voices?: number;
  detune?: number;
}

const GLIDE = 0.08;

/* ───────────────────────────────────────────── To'lqin qurish */

const waveCache = new Map<string, PeriodicWave>();

/**
 * Ohanglar darajalaridan to'lqin yasaydi.
 *
 * Sinus fazasida quriladi (`imag`), chunki quloq faza farqini
 * deyarli sezmaydi, lekin sinus fazasi cho'qqini pasaytiradi va
 * ovoz balandroq eshitiladi.
 */
function wave(ctx: AudioContext, partials: number[]) {
  const key = partials.join(',');
  const hit = waveCache.get(key);
  if (hit) return hit;

  const n = partials.length + 1;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let i = 0; i < partials.length; i += 1) imag[i + 1] = partials[i];

  const w = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  waveCache.set(key, w);
  return w;
}

/* ─────────────────────────────────────────────────── Dvigatel */

export function startSpectral(ctx: AudioContext, out: GainNode, r: Spectral): Drone {
  const now = ctx.currentTime;

  const bus = ctx.createGain();
  bus.gain.value = 0;
  bus.connect(out);

  const conv = ctx.createConvolver();
  conv.buffer = impulse(ctx);
  const wet = ctx.createGain();
  wet.gain.value = r.space;
  conv.connect(wet);
  wet.connect(bus);

  const dry = ctx.createGain();
  dry.gain.value = 1 - r.space * 0.45;
  dry.connect(bus);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = r.q;
  filter.frequency.value = r.cut[0];
  filter.connect(dry);
  filter.connect(conv);

  const running: OscillatorNode[] = [];
  const osc = (f: number, type?: OscillatorType, pw?: PeriodicWave) => {
    const o = ctx.createOscillator();
    if (pw) o.setPeriodicWave(pw);
    else o.type = type ?? 'sine';
    o.frequency.value = f;
    o.start(now);
    running.push(o);
    return o;
  };

  /** `update` da chastotasi yangilanadigan generatorlar */
  const tuned: Array<{ o: OscillatorNode; ratio: number }> = [];
  /** FM chuqurligi tezlik bilan o'zgaradi */
  const indices: Array<{ g: GainNode; index: number; ratio: number }> = [];
  /** To'lqin jadvalidagi qatlamlar */
  const layers: GainNode[] = [];

  switch (r.kind) {
    case 'fm': {
      const ops = r.ops ?? [];
      const build = (pan: number, shift: number) => {
        const car = osc(r.base * shift, r.carrier ?? 'sine');
        tuned.push({ o: car, ratio: shift });

        const p = ctx.createStereoPanner();
        p.pan.value = pan;
        car.connect(p);
        p.connect(filter);

        // Zanjir: har bir operator oldingisining chastotasini boshqaradi
        let target: AudioParam = car.frequency;
        let targetRatio = shift;

        for (const op of ops) {
          const m = osc(r.base * shift * op.ratio, 'sine');
          tuned.push({ o: m, ratio: shift * op.ratio });

          const g = ctx.createGain();
          g.gain.value = r.base * shift * op.index;
          m.connect(g);
          g.connect(target);
          indices.push({ g, index: op.index, ratio: shift });

          if (r.algo === 'stack') {
            // Keyingi operator shu operatorni boshqaradi
            target = m.frequency;
            targetRatio = shift * op.ratio;
          }
        }
        void targetRatio;
      };

      if (r.algo === 'two') {
        build(-0.55, 1);
        build(0.55, 1.004);
      } else {
        build(0, 1);
      }
      break;
    }

    case 'wt': {
      const tables = r.tables ?? [[1]];
      for (let i = 0; i < tables.length; i += 1) {
        const o = osc(r.base, undefined, wave(ctx, tables[i]));
        tuned.push({ o, ratio: 1 });

        const g = ctx.createGain();
        g.gain.value = i === 0 ? 1 : 0;
        const p = ctx.createStereoPanner();
        p.pan.value = (i / Math.max(tables.length - 1, 1)) * 1.2 - 0.6;

        o.connect(g);
        g.connect(p);
        p.connect(filter);
        layers.push(g);
      }
      break;
    }

    case 'spec': {
      const pw = wave(ctx, r.wave ?? [1, 0.5, 0.33]);
      const voices = r.voices ?? 3;
      for (let v = 0; v < voices; v += 1) {
        const spread = voices === 1 ? 0 : (v / (voices - 1)) * 2 - 1;
        const o = osc(r.base, undefined, pw);
        o.detune.value = spread * (r.detune ?? 12);
        tuned.push({ o, ratio: 1 });

        const g = ctx.createGain();
        g.gain.value = 0.7 / Math.sqrt(voices);
        const p = ctx.createStereoPanner();
        p.pan.value = spread * 0.7;

        o.connect(g);
        g.connect(p);
        p.connect(filter);
      }
      break;
    }
  }

  let subOsc: OscillatorNode | null = null;
  if (r.sub) {
    subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = r.base * 0.5;
    const g = ctx.createGain();
    g.gain.value = r.sub;
    subOsc.connect(g);
    g.connect(dry);
    subOsc.start(now);
    running.push(subOsc);
  }

  let phase = 0;
  let lastT = now;

  return {
    update(k, x) {
      const t = ctx.currentTime;
      // Haqiqiy o'tgan vaqt. Dastlab bu yerda qat'iy qadam ishlatilgan
      // edi va `morph` gertsda emas, "har chaqiruvda shuncha" degan
      // ma'noni anglatardi — ya'ni tezlik chaqiruv chastotasiga bog'liq
      // bo'lib qolgan va e'lon qilinganidan olti barobar sekin edi.
      const dt = Math.min(Math.max(t - lastT, 0), 0.2);
      lastT = t;
      const pos = 0.88 + x * 0.26;
      const f = (r.base + r.span * Math.sqrt(k)) * pos;

      for (const v of tuned) v.o.frequency.setTargetAtTime(f * v.ratio, t, GLIDE);
      subOsc?.frequency.setTargetAtTime(f * 0.5, t, GLIDE * 1.6);

      // FM chuqurligi tezlik bilan ortadi — tovush "ochiladi"
      for (const i of indices) {
        i.g.gain.setTargetAtTime(f * i.ratio * i.index * (0.3 + 0.7 * k), t, GLIDE);
      }

      // To'lqin jadvalida suzish
      if (layers.length > 1) {
        phase += 2 * Math.PI * (r.morph ?? 0.2) * dt;
        const p =
          ((Math.sin(phase) * 0.5 + 0.5) * (1 - (r.morphSpeed ?? 0.5)) +
            k * (r.morphSpeed ?? 0.5)) *
          (layers.length - 1);
        // Silliqlash suzish tezligiga moslashadi.
        //
        // Qat'iy 0.08 s ishlatilganda tez suzishda darajalar nishoniga
        // yetib ulgurmasdi va natija teskari chiqardi: `morph` qancha
        // katta bo'lsa, spektr shuncha KAM o'zgarardi. O'lchov shuni
        // ko'rsatdi.
        const tau = Math.min(Math.max(0.1 / Math.max(r.morph ?? 0.2, 0.1), 0.01), 0.08);
        layers.forEach((g, i) => {
          // Uchburchak oyna: qo'shni ikki spektr aralashadi
          const w = Math.max(0, 1 - Math.abs(p - i));
          g.gain.setTargetAtTime(w * 0.8, t, tau);
        });
      }

      filter.frequency.setTargetAtTime(r.cut[0] + (r.cut[1] - r.cut[0]) * k, t, GLIDE);
      bus.gain.setTargetAtTime(k * (r.trim ?? 1), t, k > 0.05 ? 0.06 : 0.25);
    },
    stop() {
      const t = ctx.currentTime;
      bus.gain.setTargetAtTime(0, t, 0.1);
      for (const o of running) o.stop(t + 0.6);
    },
  };
}
