/**
 * Ovoz to'plami — sinov uchun.
 *
 * Ikki xil ovoz bor va ular tubdan farq qiladi:
 *
 *   SHOT  — har harakatga bitta qisqa ovoz. Klik, blip, jaranglash.
 *   DRONE — to'xtovsiz ovoz; sichqoncha uning balandligi va tovushini
 *           boshqaradi. Elektromobil va kosmik shamol aynan shunday:
 *           ularni alohida "tiq"lar bilan ifodalab bo'lmaydi.
 *
 * Shuning uchun ikkalasi bir xil interfeys ostida emas: `shot` bir
 * marta chaqiriladi va o'zi o'chadi, `drone` esa boshqariladigan
 * obyekt qaytaradi.
 */

export type Mode = 'shot' | 'drone';

export interface SoundDef {
  id: string;
  name: string;
  desc: string;
  group: 'kosmik' | 'elektro' | 'futuristik' | 'oddiy';
  mode: Mode;
}

export interface Drone {
  /** `k` — tezlik 0..1, `x` — kursorning gorizontal o'rni 0..1 */
  update(k: number, x: number): void;
  stop(): void;
}

export const SOUNDS: readonly SoundDef[] = [
  // ── Kosmik ────────────────────────────────────────────────────────
  { id: 'space-wind', name: 'Kosmik shamol', desc: 'Uzluksiz shitirlash, tezlikka qarab ochiladi', group: 'kosmik', mode: 'drone' },
  { id: 'nebula', name: 'Tumanlik', desc: 'Sokin akkord, sekin tebranadi', group: 'kosmik', mode: 'drone' },
  { id: 'radar', name: 'Radar', desc: 'Uzoq so‘nuvchi signal — suv osti kemasidek', group: 'kosmik', mode: 'shot' },
  { id: 'stardust', name: 'Yulduz changi', desc: 'Yuqori, tiniq uchqunlar', group: 'kosmik', mode: 'shot' },
  { id: 'portal', name: 'Portal', desc: 'Pastga tushuvchi rezonans', group: 'kosmik', mode: 'shot' },
  { id: 'deep-space', name: 'Chuqur fazo', desc: 'Juda past guvillash', group: 'kosmik', mode: 'drone' },

  // ── Elektromobil ──────────────────────────────────────────────────
  { id: 'ev-whine', name: 'EV motor', desc: 'Klassik elektromotor chiyillashi', group: 'elektro', mode: 'drone' },
  { id: 'ev-tesla', name: 'Tesla hum', desc: 'Yumshoq past g‘uvillash, toza', group: 'elektro', mode: 'drone' },
  { id: 'ev-turbine', name: 'Turbina', desc: 'Yuqori chastotali aylanish', group: 'elektro', mode: 'drone' },
  { id: 'ev-regen', name: 'Rekuperatsiya', desc: 'Sekinlashganda pasayuvchi tovush', group: 'elektro', mode: 'drone' },
  { id: 'ev-start', name: 'EV ishga tushishi', desc: 'Qisqa ko‘tariluvchi tovush', group: 'elektro', mode: 'shot' },
  { id: 'ev-pod', name: 'Kapsula', desc: 'Metall aralash motor — og‘irroq', group: 'elektro', mode: 'drone' },

  // ── Futuristik ────────────────────────────────────────────────────
  { id: 'hologram', name: 'Hologramma', desc: 'Titroq FM tovush', group: 'futuristik', mode: 'shot' },
  { id: 'data-blip', name: 'Ma’lumot', desc: 'Ikki pog‘onali raqamli signal', group: 'futuristik', mode: 'shot' },
  { id: 'interface', name: 'Interfeys', desc: 'Toza, quruq bosish — UI uslubi', group: 'futuristik', mode: 'shot' },
  { id: 'laser', name: 'Lazer', desc: 'Tez pastga tushuvchi', group: 'futuristik', mode: 'shot' },
  { id: 'warp', name: 'Warp', desc: 'Keskin yuqoriga sirg‘alish', group: 'futuristik', mode: 'shot' },
  { id: 'neon', name: 'Neon', desc: 'Rezonansli "chertish"', group: 'futuristik', mode: 'shot' },
  { id: 'scanner', name: 'Skaner', desc: 'Uzluksiz o‘zgaruvchi filtr', group: 'futuristik', mode: 'drone' },
  { id: 'circuit', name: 'Mikrosxema', desc: 'Mayda elektr chirsillashi', group: 'futuristik', mode: 'shot' },

  // ── Oddiy (avvalgi oltitasi) ──────────────────────────────────────
  { id: 'tick', name: 'Klik', desc: 'Qisqa mexanik "tiq"', group: 'oddiy', mode: 'shot' },
  { id: 'bubble', name: 'Tomchi', desc: 'Yumshoq dumaloq "blop"', group: 'oddiy', mode: 'shot' },
  { id: 'sweep', name: 'Sweep', desc: 'Ko‘tariluvchi sirg‘alish', group: 'oddiy', mode: 'shot' },
  { id: 'chime', name: 'Qo‘ng‘iroq', desc: 'Metall jaranglash', group: 'oddiy', mode: 'shot' },
  { id: 'whoosh', name: 'Shovqin', desc: 'Havo shitirlashi', group: 'oddiy', mode: 'shot' },
  { id: 'retro', name: 'Retro', desc: '8-bit kvadrat to‘lqin', group: 'oddiy', mode: 'shot' },
];

/** Oq shovqin buferi. Bir marta yasalib, qayta ishlatiladi. */
let noiseBuf: AudioBuffer | null = null;
function noise(ctx: AudioContext) {
  if (!noiseBuf || noiseBuf.sampleRate !== ctx.sampleRate) {
    const len = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i += 1) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

/* ══════════════════════════════════════════════ Bir martalik ovozlar */

export function playShot(ctx: AudioContext, out: GainNode, id: string, x: number) {
  const t = ctx.currentTime;
  const p = 1 + x * 1.1; // kursorning o'rni tovushni ko'taradi

  const env = ctx.createGain();
  env.connect(out);

  const osc = (type: OscillatorType, freq: number) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    return o;
  };
  const lp = (freq: number, q = 1) => {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  };

  switch (id) {
    case 'radar': {
      const o = osc('sine', 900 * p);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.9, t + 0.005);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      o.connect(env);
      o.start(t);
      o.stop(t + 1.2);
      return;
    }
    case 'stardust': {
      // Uchta tasodifiy yuqori ton — "uchqun" hissi
      for (let i = 0; i < 3; i += 1) {
        const o = osc('sine', (1400 + Math.random() * 1800) * p);
        const g = ctx.createGain();
        const d = t + i * 0.035;
        g.gain.setValueAtTime(0, d);
        g.gain.linearRampToValueAtTime(0.35, d + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, d + 0.4);
        o.connect(g);
        g.connect(out);
        o.start(d);
        o.stop(d + 0.45);
      }
      return;
    }
    case 'portal': {
      const o = osc('sawtooth', 700 * p);
      o.frequency.exponentialRampToValueAtTime(70 * p, t + 0.5);
      const f = lp(2200, 12);
      f.frequency.exponentialRampToValueAtTime(200, t + 0.5);
      env.gain.setValueAtTime(0.7, t);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(f);
      f.connect(env);
      o.start(t);
      o.stop(t + 0.6);
      return;
    }
    case 'ev-start': {
      const o = osc('sawtooth', 90 * p);
      o.frequency.exponentialRampToValueAtTime(620 * p, t + 0.35);
      const f = lp(600, 8);
      f.frequency.exponentialRampToValueAtTime(3000, t + 0.35);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.7, t + 0.05);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(f);
      f.connect(env);
      o.start(t);
      o.stop(t + 0.5);
      return;
    }
    case 'hologram': {
      const car = osc('sine', 640 * p);
      const mod = osc('sine', 640 * p * 3.7);
      const mg = ctx.createGain();
      mg.gain.setValueAtTime(1400, t);
      mg.gain.exponentialRampToValueAtTime(2, t + 0.35);
      mod.connect(mg);
      mg.connect(car.frequency);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.7, t + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      car.connect(env);
      mod.start(t);
      car.start(t);
      mod.stop(t + 0.55);
      car.stop(t + 0.55);
      return;
    }
    case 'data-blip': {
      const o = osc('square', 520 * p);
      o.frequency.setValueAtTime(780 * p, t + 0.05);
      env.gain.setValueAtTime(0.4, t);
      env.gain.setValueAtTime(0.4, t + 0.085);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
      const f = lp(3000);
      o.connect(f);
      f.connect(env);
      o.start(t);
      o.stop(t + 0.12);
      return;
    }
    case 'interface': {
      const o = osc('sine', 1100 * p);
      const o2 = osc('sine', 2200 * p);
      const g2 = ctx.createGain();
      g2.gain.value = 0.3;
      env.gain.setValueAtTime(0.8, t);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      o.connect(env);
      o2.connect(g2);
      g2.connect(env);
      o.start(t);
      o2.start(t);
      o.stop(t + 0.08);
      o2.stop(t + 0.08);
      return;
    }
    case 'laser': {
      const o = osc('sawtooth', 2400 * p);
      o.frequency.exponentialRampToValueAtTime(180 * p, t + 0.16);
      env.gain.setValueAtTime(0.55, t);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      const f = lp(4000, 6);
      o.connect(f);
      f.connect(env);
      o.start(t);
      o.stop(t + 0.2);
      return;
    }
    case 'warp': {
      const o = osc('triangle', 200 * p);
      o.frequency.exponentialRampToValueAtTime(2600 * p, t + 0.14);
      const f = lp(1200, 14);
      f.frequency.exponentialRampToValueAtTime(5000, t + 0.14);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.7, t + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(f);
      f.connect(env);
      o.start(t);
      o.stop(t + 0.24);
      return;
    }
    case 'neon': {
      const src = ctx.createBufferSource();
      src.buffer = noise(ctx);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 26; // juda tor — "chertish" hissi
      f.frequency.value = 1200 * p;
      env.gain.setValueAtTime(1, t);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      src.connect(f);
      f.connect(env);
      src.start(t);
      src.stop(t + 0.32);
      return;
    }
    case 'circuit': {
      // To'rtta juda qisqa chirsillash
      for (let i = 0; i < 4; i += 1) {
        const d = t + i * 0.018;
        const o = osc('square', (700 + Math.random() * 1600) * p);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.25, d);
        g.gain.exponentialRampToValueAtTime(0.0001, d + 0.02);
        o.connect(g);
        g.connect(out);
        o.start(d);
        o.stop(d + 0.025);
      }
      return;
    }
    case 'tick': {
      const o = osc('square', 1400 * p);
      o.frequency.exponentialRampToValueAtTime(400 * p, t + 0.03);
      env.gain.setValueAtTime(0.9, t);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
      o.connect(env);
      o.start(t);
      o.stop(t + 0.05);
      return;
    }
    case 'bubble': {
      const o = osc('sine', 180 * p);
      o.frequency.exponentialRampToValueAtTime(680 * p, t + 0.07);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(1, t + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(env);
      o.start(t);
      o.stop(t + 0.18);
      return;
    }
    case 'sweep': {
      const o = osc('sawtooth', 220 * p);
      o.frequency.exponentialRampToValueAtTime(1800 * p, t + 0.12);
      const f = lp(800);
      f.frequency.exponentialRampToValueAtTime(4000, t + 0.12);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.8, t + 0.015);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(f);
      f.connect(env);
      o.start(t);
      o.stop(t + 0.22);
      return;
    }
    case 'chime': {
      const car = osc('sine', 520 * p);
      const mod = osc('sine', 520 * p * 2.4);
      const mg = ctx.createGain();
      mg.gain.setValueAtTime(900, t);
      mg.gain.exponentialRampToValueAtTime(1, t + 0.3);
      mod.connect(mg);
      mg.connect(car.frequency);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.8, t + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      car.connect(env);
      mod.start(t);
      car.start(t);
      mod.stop(t + 0.5);
      car.stop(t + 0.5);
      return;
    }
    case 'whoosh': {
      const src = ctx.createBufferSource();
      src.buffer = noise(ctx);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 1.6;
      f.frequency.setValueAtTime(500 * p, t);
      f.frequency.exponentialRampToValueAtTime(2600 * p, t + 0.18);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(1, t + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      src.connect(f);
      f.connect(env);
      src.start(t);
      src.stop(t + 0.24);
      return;
    }
    case 'retro': {
      const o = osc('square', 330 * p);
      o.frequency.setValueAtTime(440 * p, t + 0.04);
      o.frequency.setValueAtTime(660 * p, t + 0.08);
      env.gain.setValueAtTime(0.55, t);
      env.gain.setValueAtTime(0.55, t + 0.1);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(env);
      o.start(t);
      o.stop(t + 0.15);
      return;
    }
    default:
      return;
  }
}

/* ══════════════════════════════════════════════════ Uzluksiz ovozlar */

/** Yumshoq o'zgarish vaqti — busiz har o'zgarishda "chiq" eshitiladi */
const GLIDE = 0.07;

export function startDrone(ctx: AudioContext, out: GainNode, id: string): Drone | null {
  const t = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.value = 0;
  g.connect(out);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.connect(g);

  const oscs: OscillatorNode[] = [];
  const srcs: AudioBufferSourceNode[] = [];

  const addOsc = (type: OscillatorType, freq: number, detune: number, level: number) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const lg = ctx.createGain();
    lg.gain.value = level;
    o.connect(lg);
    lg.connect(filter);
    o.start(t);
    oscs.push(o);
    return o;
  };

  const addNoise = (level: number) => {
    const s = ctx.createBufferSource();
    s.buffer = noise(ctx);
    s.loop = true;
    const lg = ctx.createGain();
    lg.gain.value = level;
    s.connect(lg);
    lg.connect(filter);
    s.start(t);
    srcs.push(s);
    return s;
  };

  /** Har turdagi drone o'ziga xos: bazasi, oralig'i va filtri */
  let base = 80;
  let span = 260;
  let cutLo = 300;
  let cutHi = 2600;
  let q = 4;

  switch (id) {
    case 'space-wind':
      addNoise(1);
      filter.type = 'bandpass';
      base = 0;
      cutLo = 240;
      cutHi = 1800;
      q = 1.2;
      break;
    case 'nebula':
      addOsc('sine', 110, 0, 0.5);
      addOsc('sine', 165, 7, 0.35); // beshlik
      addOsc('sine', 220, -9, 0.3); // oktava
      base = 110;
      span = 90;
      cutLo = 400;
      cutHi = 1600;
      q = 1;
      break;
    case 'deep-space':
      addOsc('sine', 42, 0, 0.9);
      addOsc('sine', 63, 5, 0.4);
      base = 42;
      span = 40;
      cutLo = 120;
      cutHi = 500;
      q = 1;
      break;
    case 'ev-whine':
      addOsc('sawtooth', 78, 0, 0.55);
      addOsc('sawtooth', 78, 11, 0.35);
      addOsc('triangle', 156, -6, 0.22);
      base = 78;
      span = 262;
      q = 6;
      break;
    case 'ev-tesla':
      addOsc('sine', 90, 0, 0.8);
      addOsc('sine', 180, 4, 0.3);
      base = 90;
      span = 180;
      cutLo = 260;
      cutHi = 1400;
      q = 1;
      break;
    case 'ev-turbine':
      addOsc('sawtooth', 240, 0, 0.4);
      addOsc('sawtooth', 240, 14, 0.3);
      addNoise(0.12);
      base = 240;
      span = 900;
      cutLo = 700;
      cutHi = 5200;
      q = 9;
      break;
    case 'ev-regen':
      addOsc('triangle', 300, 0, 0.6);
      addOsc('sine', 150, 6, 0.35);
      base = 300;
      span = -170; // tezlashganda PASAYADI
      cutLo = 900;
      cutHi = 2400;
      q = 3;
      break;
    case 'ev-pod':
      addOsc('square', 62, 0, 0.35);
      addOsc('sawtooth', 93, 9, 0.35);
      addOsc('triangle', 186, -7, 0.2);
      base = 62;
      span = 200;
      cutLo = 200;
      cutHi = 2000;
      q = 8;
      break;
    case 'scanner':
      addOsc('sawtooth', 160, 0, 0.5);
      addNoise(0.18);
      base = 160;
      span = 120;
      cutLo = 300;
      cutHi = 4200;
      q = 16; // juda tor — filtr "sirg'alishi" eshitiladi
      break;
    default:
      return null;
  }

  filter.Q.value = q;
  filter.frequency.value = cutLo;

  return {
    update(k, x) {
      const now = ctx.currentTime;
      const pos = 0.85 + x * 0.3; // kursorning o'rni tovushni sal suradi

      if (base > 0) {
        const f = (base + span * Math.sqrt(k)) * pos;
        for (const o of oscs) {
          const ratio = o.frequency.value / Math.max(base, 1);
          o.frequency.setTargetAtTime(f * (ratio > 1.4 ? 2 : 1), now, GLIDE);
        }
      }

      filter.frequency.setTargetAtTime(cutLo + (cutHi - cutLo) * k, now, GLIDE + 0.02);
      // Ko'tarilish tez, so'nish sekin — tabiiy xatti-harakat
      g.gain.setTargetAtTime(k, now, k > 0.05 ? 0.05 : 0.2);
    },
    stop() {
      const now = ctx.currentTime;
      g.gain.setTargetAtTime(0, now, 0.08);
      for (const o of oscs) o.stop(now + 0.4);
      for (const s of srcs) s.stop(now + 0.4);
    },
  };
}
