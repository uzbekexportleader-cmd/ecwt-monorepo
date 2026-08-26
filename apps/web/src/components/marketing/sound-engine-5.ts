import { type Drone, noise } from './sound-engine';

/**
 * Beshinchi dvigatel — KATTA ISHORALAR.
 *
 * ── Nima yetishmayotgan edi ─────────────────────────────────────────
 * Avvalgi 196 ta variantning hammasi kichik masshtabda edi: yo
 * uzluksiz g'uvillash, yo juda qisqa tovush. Kinoda "wooooo"
 * degizadigan narsa esa uchinchi xil — bir-uch soniya davom etadigan
 * KATTA ISHORA: sekin ko'tariladi, balandlik suriladi, keyin uzoq
 * dumi bilan so'nadi.
 *
 * Yana bir narsa: 196 tasining hammasi BITTA xil reverbdan o'tgan
 * edi — 2.6 soniyalik bir xil xona. Fazo esa tovushning yarmi. Shu
 * yerda har bir retseptning o'z xonasi bor: o'lchami ham, so'nishi
 * ham boshqa.
 *
 * ── Ishoralar ustma-ust tushadi ─────────────────────────────────────
 * Har necha piksel harakatda bitta ishora boshlanadi, lekin u uzoq
 * davom etgani uchun keyingisi oldingisi tugamasdan boshlanadi.
 * Natijada tovushlar bir-birining ustiga qatlanadi va katta,
 * o'zgarib turadigan fazo hosil bo'ladi. Aynan shu narsa "global"
 * tuyg'usini beradi.
 */

export interface BigRecipe {
  id: string;
  name: string;
  desc: string;
  group: string;

  /** Har necha piksel harakatda bitta ishora */
  every: number;
  /** Ishoraning davomiyligi, soniya */
  len: number;
  /** Ko'tarilish ulushi (0.02 — zarba, 0.5 — sekin shishish) */
  attack: number;

  base: number;
  /** Nota tanlash uchun qator, yarim tonlarda */
  scale: number[];
  /** Balandlik ishorasi: boshidan oxirigacha nisbat */
  glide?: [number, number];

  /**
   * `saw`   — ko'chirilgan arralar; kuchli, keng
   * `sine`  — qo'lda berilgan ohanglar; toza
   * `pluck` — chalingan bas: tez zarba, past ohanglar uzoq yangraydi
   * `bowed` — kamon: sekin, titroq bilan
   * `noise` — filtrlangan shovqin; shuvillash
   */
  voice: 'saw' | 'sine' | 'pluck' | 'bowed' | 'noise';
  voices?: number;
  detune?: number;
  /** `sine` va `pluck` uchun ohanglar darajalari */
  partials?: number[];

  /** Filtr: ishora boshida -> oxirida */
  cut: [number, number];
  q: number;

  /** Xona: [soniya, so'nish darajasi] */
  room: [number, number];
  space: number;
  /** Ping-pong aks-sado: chapdan o'ngga sakraydi */
  echo?: { time: number; feedback: number; mix: number };
  /** Uzluksiz past qatlam — og'irlik uchun */
  sub?: number;

  trim?: number;
}

const PX_PER_SEC = 2200;

/* ────────────────────────────────────────────── Xona (reverb) */

const roomCache = new Map<string, AudioBuffer>();

/**
 * Har bir retsept uchun alohida impuls javobi.
 *
 * `seconds` — xonaning o'lchami. Katta xonada tovush uzoq yashaydi.
 * `decay`   — so'nish shakli. Kichik qiymat: uzoq, "cherkovga" xos
 *             dum. Katta qiymat: tez o'chadi, xona kichikroq tuyuladi.
 *
 * Chap va o'ng kanal mustaqil hisoblanadi — stereo kenglik shundan.
 */
function room(ctx: AudioContext, seconds: number, decay: number) {
  const key = `${ctx.sampleRate}:${seconds}:${decay}`;
  const hit = roomCache.get(key);
  if (hit) return hit;

  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const pre = Math.floor(rate * 0.028);
  const buf = ctx.createBuffer(2, len, rate);

  for (let ch = 0; ch < 2; ch += 1) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i += 1) {
      if (i < pre) {
        d[i] = 0;
        continue;
      }
      const t = (i - pre) / (len - pre);
      d[i] = (Math.random() * 2 - 1) * (1 - t) ** decay;
    }
  }

  roomCache.set(key, buf);
  return buf;
}

/* ───────────────────────────────────────────────────── Dvigatel */

export function startBig(ctx: AudioContext, out: GainNode, r: BigRecipe): Drone {
  const now = ctx.currentTime;

  const bus = ctx.createGain();
  bus.gain.value = r.trim ?? 1;
  bus.connect(out);

  const conv = ctx.createConvolver();
  conv.buffer = room(ctx, r.room[0], r.room[1]);
  const wet = ctx.createGain();
  wet.gain.value = r.space;
  conv.connect(wet);
  wet.connect(bus);

  const dry = ctx.createGain();
  dry.gain.value = 1;
  dry.connect(bus);

  /** Ishoralar shu ikkovga yuboriladi */
  const feed = (node: AudioNode) => {
    node.connect(dry);
    node.connect(conv);
  };

  // Ping-pong aks-sado: tovush chapdan o'ngga sakraydi
  let echoIn: GainNode | null = null;
  if (r.echo) {
    echoIn = ctx.createGain();
    echoIn.gain.value = 1;

    const dl = ctx.createDelay(2);
    const dr = ctx.createDelay(2);
    dl.delayTime.value = Math.min(r.echo.time, 1.8);
    dr.delayTime.value = Math.min(r.echo.time, 1.8);

    // Halqa ichidagi filtr ovozni KUCHAYTIRMASLIGI kerak, shuning
    // uchun Q past. Bu avvalgi dvigatelda o'rganilgan xato edi.
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 2400;
    damp.Q.value = 0.5;

    const fb = ctx.createGain();
    fb.gain.value = Math.min(r.echo.feedback, 0.7);

    const pl = ctx.createStereoPanner();
    pl.pan.value = -0.85;
    const pr = ctx.createStereoPanner();
    pr.pan.value = 0.85;

    const mix = ctx.createGain();
    mix.gain.value = r.echo.mix;

    echoIn.connect(dl);
    dl.connect(pl);
    pl.connect(mix);
    dl.connect(dr);
    dr.connect(pr);
    pr.connect(mix);
    dr.connect(damp);
    damp.connect(fb);
    fb.connect(dl);

    mix.connect(dry);
    mix.connect(conv);
  }

  const running: OscillatorNode[] = [];
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

  let acc = 0;
  let lastT = now;
  let stopped = false;
  let step = 0;

  const fire = (t: number, k: number, x: number) => {
    const scale = r.scale;
    const idx = (Math.floor(x * scale.length * 0.7) + step) % scale.length;
    step += 1;
    const f = r.base * 2 ** (scale[idx] / 12);

    const len = r.len;
    const vel = 0.4 + 0.6 * k;
    const att = Math.max(len * r.attack, 0.004);

    // Umumiy konvert — hamma qatlam shundan o'tadi
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vel, t + att);
    env.gain.exponentialRampToValueAtTime(0.0001, t + len);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = r.q;
    filter.frequency.setValueAtTime(r.cut[0], t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(r.cut[1], 40), t + len);

    filter.connect(env);
    feed(env);
    if (echoIn) env.connect(echoIn);

    const glide = r.glide ?? [1, 1];

    const setPitch = (o: OscillatorNode, mult: number) => {
      o.frequency.setValueAtTime(f * mult * glide[0], t);
      o.frequency.exponentialRampToValueAtTime(Math.max(f * mult * glide[1], 8), t + len);
    };

    if (r.voice === 'noise') {
      const src = ctx.createBufferSource();
      src.buffer = noise(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 0.8;
      bp.frequency.setValueAtTime(f * glide[0] * 4, t);
      bp.frequency.exponentialRampToValueAtTime(Math.max(f * glide[1] * 4, 40), t + len);
      src.connect(bp);
      bp.connect(filter);
      src.start(t, Math.random() * 2);
      src.stop(t + len + 0.05);
      return;
    }

    if (r.voice === 'saw') {
      const n = r.voices ?? 5;
      for (let v = 0; v < n; v += 1) {
        const spread = n === 1 ? 0 : (v / (n - 1)) * 2 - 1;
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.detune.value = spread * (r.detune ?? 18);
        setPitch(o, 1);
        const g = ctx.createGain();
        g.gain.value = 0.5 / Math.sqrt(n);
        const p = ctx.createStereoPanner();
        p.pan.value = spread * 0.75;
        o.connect(g);
        g.connect(p);
        p.connect(filter);
        o.start(t);
        o.stop(t + len + 0.05);
      }
      return;
    }

    if (r.voice === 'bowed') {
      const n = r.voices ?? 3;
      for (let v = 0; v < n; v += 1) {
        const spread = n === 1 ? 0 : (v / (n - 1)) * 2 - 1;
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.detune.value = spread * (r.detune ?? 10);
        setPitch(o, 1);

        // Titroq — kamon bilan chalinganda tovush qotib turmaydi
        const vib = ctx.createOscillator();
        vib.type = 'sine';
        vib.frequency.value = 4.6 + v * 0.4;
        const vibAmp = ctx.createGain();
        vibAmp.gain.value = f * 0.012;
        vib.connect(vibAmp);
        vibAmp.connect(o.frequency);
        vib.start(t);
        vib.stop(t + len + 0.05);

        const g = ctx.createGain();
        g.gain.value = 0.45 / Math.sqrt(n);
        const p = ctx.createStereoPanner();
        p.pan.value = spread * 0.6;
        o.connect(g);
        g.connect(p);
        p.connect(filter);
        o.start(t);
        o.stop(t + len + 0.05);
      }
      return;
    }

    // sine va pluck — ohanglar yig'indisi
    const partials = r.partials ?? [1, 0.4, 0.2];
    partials.forEach((level, i) => {
      if (level <= 0) return;
      const o = ctx.createOscillator();
      o.type = 'sine';
      setPitch(o, i + 1);
      // `start` HAR DOIM `stop` dan oldin. Teskarisi istisno tashlaydi,
      // istisno esa `update` ni to'xtatadi — natijada ovoz umuman
      // chiqmaydi. Bu xato o'lchov paytida topilgan edi.
      o.start(t);

      const g = ctx.createGain();
      if (r.voice === 'pluck') {
        // Chalingan tovushda har bir ohang o'z tezligida so'nadi:
        // yuqorilari tez, pastlari uzoq. Aynan shu narsa "chalindi"
        // degan taassurot beradi.
        const d = len / (1 + i * 0.9);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(level, t + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.stop(t + d + 0.05);
      } else {
        g.gain.value = level;
        o.stop(t + len + 0.05);
      }

      const p = ctx.createStereoPanner();
      p.pan.value = ((i % 3) - 1) * 0.4;
      o.connect(g);
      g.connect(p);
      p.connect(filter);
    });

    // Chalingan basda zarba tovushi — barmoq simga tekgani
    if (r.voice === 'pluck') {
      const src = ctx.createBufferSource();
      src.buffer = noise(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f * 6;
      bp.Q.value = 1.2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      src.connect(bp);
      bp.connect(g);
      g.connect(filter);
      src.start(t, Math.random() * 2);
      src.stop(t + 0.1);
    }
  };

  return {
    update(k, x) {
      if (stopped) return;
      const t = ctx.currentTime;
      const dt = Math.min(Math.max(t - lastT, 0), 0.2);
      lastT = t;

      subOsc?.frequency.setTargetAtTime(r.base * 0.5, t, 0.2);

      acc += k * PX_PER_SEC * dt;
      let guard = 0;
      while (acc >= r.every && guard < 2) {
        acc -= r.every;
        fire(t + 0.01 + guard * 0.02, k, x);
        guard += 1;
      }
      if (acc > r.every * 3) acc = 0;
    },
    stop() {
      stopped = true;
      const t = ctx.currentTime;
      bus.gain.setTargetAtTime(0, t, 0.12);
      for (const o of running) o.stop(t + 0.8);
    },
  };
}
