import { type Drone, impulse, noise } from './sound-engine';

/**
 * Ikkinchi dvigatel — BOSHQA SINTEZ USULLARI.
 *
 * ── Nega birinchi dvigatel yetarli emas edi ─────────────────────────
 * Undagi barcha sakson ovoz bitta yo'l bilan yasalgan: generator →
 * filtr → reverb. Sozlamalarni qanchalik o'zgartirmang, natija bir
 * oilaga mansub bo'lib qolaveradi — hammasi "g'uvillagan drone".
 *
 * Haqiqatan boshqacha ovoz uchun boshqa USUL kerak. Bu yerda o'nta
 * usul bor va ularning har biri tovushni butunlay boshqa yo'l bilan
 * hosil qiladi:
 *
 *   karplus  — chalinadigan sim. Shovqin qisqa kechikish halqasiga
 *              yuboriladi va o'zi bilan o'zi qo'shilib, ohangga
 *              aylanadi. Fizik modellashtirish, generatorsiz.
 *   bell     — qo'ng'iroq. Ohangga MOS KELMAYDIGAN nisbatlardagi sof
 *              tovushlar (1 : 2.76 : 5.4 …). Metall shundan chiqadi.
 *   ring     — halqa modulyatsiyasi. Ikki tovush ko'paytiriladi va
 *              ularning yig'indisi hamda ayirmasi paydo bo'ladi —
 *              tabiatda uchramaydigan, "begona" tovush.
 *   comb     — taroq filtr. Ovoz o'zining bir necha millisekund
 *              kechikkan nusxasi bilan qo'shiladi: reaktiv shovqin.
 *   granular — donachalar. Yuzlab juda qisqa bo'laklar tasodifiy
 *              balandlik va o'ringa sochiladi — bulut, to'da.
 *   formant  — inson tovush yo'li. Uchta tor filtr unli tovushlarni
 *              taqlid qiladi: mashina "gapiradi".
 *   crush    — raqamli buzilish. To'lqin pog'onalarga bo'linadi —
 *              eski kompyuter tovushi.
 *   arp      — ketma-ketlik. Uzluksiz emas, NOTALAR. Tezlik ohangning
 *              temposini boshqaradi.
 *   noiseres — rezonator. Faqat shovqin, lekin juda tor filtrlardan
 *              o'tgan: hushtak, shamol, radio.
 *   shaper   — to'lqinni egish. Sof tovush qattiq egiladi va o'ndan
 *              ortiq yangi ohang paydo bo'ladi — "o'kirish".
 *
 * ── Ritmli usullar qanday ishlaydi ──────────────────────────────────
 * karplus, bell, granular va arp uzluksiz emas — ular VOQEALAR
 * ketma-ketligi. Voqealar `update` chaqirilganda oldindan, qisqa
 * gorizontga (0.2 s) rejalashtiriladi. Sahifada `update` har 40 ms da
 * chaqiriladi, ya'ni reja hech qachon tugab qolmaydi.
 */

export type Kind =
  | 'karplus'
  | 'bell'
  | 'ring'
  | 'comb'
  | 'granular'
  | 'formant'
  | 'crush'
  | 'arp'
  | 'noiseres'
  | 'shaper';

export interface Exotic {
  id: string;
  name: string;
  desc: string;
  group: string;
  kind: Kind;
  /** Asosiy chastota: sokin -> tez */
  base: number;
  span: number;
  /** Umumiy chiqish filtri: sokin -> tez */
  cut: [number, number];
  /** Reverbga yuboriladigan ulush 0..1 */
  space: number;
  /** Pastdagi og'irlik. Ritmli usullarda odatda kerak emas. */
  sub?: number;
  /** Voqealar chastotasi (sekundiga): sokin -> tez */
  rate?: [number, number];
  /** Usulga xos sozlamalar — har bir usul o'zinikini o'qiydi */
  p?: Record<string, number>;
  /** Balandlikni tenglashtirish ko'paytmasi, o'lchov bo'yicha */
  trim?: number;
}

const GLIDE = 0.08;
/** Voqealar shuncha vaqt oldinga rejalashtiriladi */
const AHEAD = 0.2;

/** Pog'onali to'lqin egrisi — raqamli buzilish uchun */
function stepCurve(steps: number) {
  const n = 2048;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.round(x * steps) / steps;
  }
  return c;
}

/** Yumshoq to'yinish egrisi — "o'kirish" uchun */
function driveCurve(amount: number) {
  const n = 2048;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(x * amount) / Math.tanh(amount);
  }
  return c;
}

/** Unli tovushlarning formant chastotalari */
const VOWELS: Record<string, [number, number, number]> = {
  a: [730, 1090, 2440],
  e: [530, 1840, 2480],
  i: [270, 2290, 3010],
  o: [570, 840, 2410],
  u: [300, 870, 2240],
};
const VOWEL_PATH = ['u', 'o', 'a', 'e', 'i'] as const;

/** Pentatonik qator — ketma-ketlik uchun. Har doim ohangdor chiqadi. */
const SCALE = [0, 3, 5, 7, 10, 12, 15, 12, 10, 7, 5, 3];

export function startExotic(ctx: AudioContext, out: GainNode, r: Exotic): Drone {
  const now = ctx.currentTime;
  const P = (key: string, fallback: number) => r.p?.[key] ?? fallback;

  const bus = ctx.createGain();
  bus.gain.value = 0;

  // Xavfsizlik cheklovchisi.
  //
  // Bu dvigatelda teskari aloqa halqalari bor (chalinadigan sim, taroq
  // filtr, raqamli aks). Ular sozlash xatosida kuchayib ketishi mumkin
  // va bu quloqqa zarar. Cheklovchi odatdagi ishda umuman sezilmaydi —
  // u faqat cho'qqi chegaradan oshganda ishga tushadi.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.12;
  bus.connect(limiter);
  limiter.connect(out);

  const conv = ctx.createConvolver();
  conv.buffer = impulse(ctx);
  const wet = ctx.createGain();
  wet.gain.value = r.space;
  conv.connect(wet);
  wet.connect(bus);

  const dry = ctx.createGain();
  dry.gain.value = 1 - r.space * 0.45;
  dry.connect(bus);

  /** Umumiy chiqish nuqtasi — hamma usul shu yerga ulanadi */
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.Q.value = P('toneq', 1);
  tone.frequency.value = r.cut[0];
  tone.connect(dry);
  tone.connect(conv);

  /** To'xtatilishi kerak bo'lgan uzluksiz manbalar */
  const running: Array<OscillatorNode | AudioBufferSourceNode> = [];
  let stopped = false;
  /** Joriy asosiy chastota — voqealar shundan foydalanadi */
  let freq = r.base;

  /* ─────────────────────────────────────────── Uzluksiz qismlar */

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

  /** Har bir usul o'z yangilash ishini shu yerga qo'yadi */
  let tick: (k: number, x: number, t: number) => void = () => {};
  /** Ritmli usullar uchun: bitta voqeani yaratadi */
  let spawn: ((t: number, i: number) => void) | null = null;

  const loopNoise = () => {
    const src = ctx.createBufferSource();
    src.buffer = noise(ctx);
    src.loop = true;
    src.start(now);
    running.push(src);
    return src;
  };

  const osc = (type: OscillatorType, f: number, detune = 0) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.detune.value = detune;
    o.start(now);
    running.push(o);
    return o;
  };

  switch (r.kind) {
    /* ── Chalinadigan sim ─────────────────────────────────────── */
    case 'karplus': {
      const delay = ctx.createDelay(0.08);
      delay.delayTime.value = 1 / r.base;

      const damp = ctx.createBiquadFilter();
      damp.type = 'lowpass';
      damp.frequency.value = P('damp', 2600);
      // Q ataylab 0.5 — SUKUT BO'YICHA 1 va bu kesim atrofida ovozni
      // ~1.15 barobar KUCHAYTIRADI. Teskari aloqa halqasida shu narsa
      // kuchni 1 dan oshirib yuboradi va ovoz cheksizlikka ketadi.
      // O'lchovda aynan shu xato chiqqan edi.
      damp.Q.value = 0.5;

      // Halqa kuchi 0.92 dan oshmasin: uzluksiz zarbalarda barqaror
      // holat 1/(1-kuch) ga teng, ya'ni 0.97 da o'ttiz barobar bo'ladi.
      const fb = ctx.createGain();
      fb.gain.value = Math.min(P('fb', 0.9), 0.92);

      delay.connect(damp);
      damp.connect(fb);
      fb.connect(delay);
      damp.connect(tone);

      // Zarba kuchi halqa kuchiga qarab me'yorlanadi.
      //
      // Halqa o'zi so'nmaydi, u faqat SEKIN so'nadi. Ketma-ket
      // zarbalarda quvvat to'planadi va barqaror daraja
      // zarba/(1-halqa) ga teng bo'ladi — 0.92 da o'n ikki barobar.
      // O'lchovda aynan shu chiqqan edi. Zarbani (1-halqa) ga
      // ko'paytirsak, barqaror daraja `hit` ning o'ziga teng bo'ladi
      // va halqa kuchini o'zgartirish balandlikni buzmaydi.
      const inject = P('hit', 0.3) * (1 - fb.gain.value);

      spawn = (t) => {
        const src = ctx.createBufferSource();
        src.buffer = noise(ctx);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(inject, t + 0.0015);
        g.gain.linearRampToValueAtTime(0, t + P('burst', 0.006));
        src.connect(g);
        g.connect(delay);
        src.start(t, Math.random() * 2);
        src.stop(t + 0.05);
      };

      tick = (_k, _x, t) => delay.delayTime.setTargetAtTime(1 / freq, t, GLIDE);
      break;
    }

    /* ── Qo'ng'iroq ───────────────────────────────────────────── */
    case 'bell': {
      // Nisbatlar ataylab butun son emas — aynan shu narsa metall
      // tovushini beradi. Butun nisbatlar ohangdor, "musiqiy" chiqadi.
      const RATIOS = [1, 2.0, 2.76, 5.4, 8.93];
      const decay = P('decay', 1.8);

      spawn = (t) => {
        RATIOS.forEach((rt, i) => {
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.value = freq * rt;
          const g = ctx.createGain();
          // Yuqori qismlar tezroq so'nadi — tabiiy qo'ng'iroq shunday
          const d = decay / (1 + i * 0.8);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(P('lvl', 0.34) / (i + 1), t + 0.004);
          g.gain.exponentialRampToValueAtTime(0.0001, t + d);
          o.connect(g);
          g.connect(tone);
          o.start(t);
          o.stop(t + d + 0.05);
        });
      };
      break;
    }

    /* ── Halqa modulyatsiyasi ─────────────────────────────────── */
    case 'ring': {
      const ratio = P('ratio', 1.71);
      const carrier = osc(P('square', 0) ? 'square' : 'sine', r.base);
      const mod = osc('sine', r.base * ratio);

      // Ko'paytirish: modulyator gain ni boshqaradi, gain ning o'z
      // qiymati nol — shuning uchun natija sof ko'paytma bo'ladi.
      const ring = ctx.createGain();
      ring.gain.value = 0;
      mod.connect(ring.gain);
      carrier.connect(ring);
      ring.connect(tone);

      // Ikkinchi juftlik biroz surilgan — stereo kenglik
      const c2 = osc('sine', r.base * 1.005);
      const m2 = osc('sine', r.base * ratio * 0.997);
      const ring2 = ctx.createGain();
      ring2.gain.value = 0;
      m2.connect(ring2.gain);
      c2.connect(ring2);
      const pan = ctx.createStereoPanner();
      pan.pan.value = 0.6;
      ring2.connect(pan);
      pan.connect(tone);

      tick = (_k, _x, t) => {
        carrier.frequency.setTargetAtTime(freq, t, GLIDE);
        mod.frequency.setTargetAtTime(freq * ratio, t, GLIDE);
        c2.frequency.setTargetAtTime(freq * 1.005, t, GLIDE);
        m2.frequency.setTargetAtTime(freq * ratio * 0.997, t, GLIDE);
      };
      break;
    }

    /* ── Taroq filtr ──────────────────────────────────────────── */
    case 'comb': {
      const src = loopNoise();
      const pre = ctx.createBiquadFilter();
      pre.type = 'lowpass';
      pre.frequency.value = P('pre', 6000);
      // Karplus dagi bilan bir xil sabab: halqa ichidagi filtr
      // ovozni kuchaytirmasligi kerak
      pre.Q.value = 0.5;

      const delay = ctx.createDelay(0.05);
      delay.delayTime.value = P('time', 0.004);

      const fb = ctx.createGain();
      fb.gain.value = Math.min(P('fb', 0.7), 0.8);

      // Kechikishni tebratamiz — reaktiv "shuvillash" shundan
      const lfo = osc('sine', P('sweep', 0.3));
      const lfoAmp = ctx.createGain();
      lfoAmp.gain.value = P('depth', 0.0028);
      lfo.connect(lfoAmp);
      lfoAmp.connect(delay.delayTime);

      src.connect(pre);
      pre.connect(delay);
      delay.connect(fb);
      fb.connect(delay);
      delay.connect(tone);
      pre.connect(tone);

      tick = (k, _x, t) => {
        // Tezlik oshganda taroq tishlari siqiladi — ovoz yuqoriga chiqadi
        delay.delayTime.setTargetAtTime(P('time', 0.004) / (1 + k * 2.5), t, GLIDE);
        lfo.frequency.setTargetAtTime(P('sweep', 0.3) * (1 + k * 6), t, GLIDE);
      };
      break;
    }

    /* ── Donachalar ───────────────────────────────────────────── */
    case 'granular': {
      const spread = P('spread', 0.55);
      const grain = P('grain', 0.085);

      spawn = (t) => {
        const o = ctx.createOscillator();
        o.type = P('saw', 0) ? 'sawtooth' : 'sine';
        // Har donacha o'z balandligiga ega — bulut hissi shundan
        o.frequency.value = freq * (1 + (Math.random() * 2 - 1) * spread);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(P('lvl', 0.2), t + grain * 0.35);
        g.gain.linearRampToValueAtTime(0, t + grain);

        const pan = ctx.createStereoPanner();
        pan.pan.value = Math.random() * 1.7 - 0.85;

        o.connect(g);
        g.connect(pan);
        pan.connect(tone);
        o.start(t);
        o.stop(t + grain + 0.02);
      };
      break;
    }

    /* ── Formant, "gapiruvchi" ovoz ───────────────────────────── */
    case 'formant': {
      const src1 = osc('sawtooth', r.base);
      const src2 = osc('sawtooth', r.base, 9);
      const mix = ctx.createGain();
      mix.gain.value = 0.5;
      src1.connect(mix);
      src2.connect(mix);

      const bands = [0, 1, 2].map((i) => {
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.Q.value = P('q', 9) / (1 + i * 0.3);
        f.frequency.value = VOWELS.u[i];
        const g = ctx.createGain();
        g.gain.value = [1, 0.6, 0.35][i];
        mix.connect(f);
        f.connect(g);
        g.connect(tone);
        return f;
      });

      tick = (_k, x, t) => {
        // Kursorning gorizontal o'rni unlini tanlaydi:
        // chapdan o'ngga — "u → o → a → e → i"
        const pos = Math.min(Math.max(x, 0), 0.999) * (VOWEL_PATH.length - 1);
        const i = Math.floor(pos);
        const frac = pos - i;
        const a = VOWELS[VOWEL_PATH[i]];
        const b = VOWELS[VOWEL_PATH[Math.min(i + 1, VOWEL_PATH.length - 1)]];
        bands.forEach((f, j) => {
          f.frequency.setTargetAtTime(a[j] + (b[j] - a[j]) * frac, t, GLIDE * 1.5);
        });
        src1.frequency.setTargetAtTime(freq, t, GLIDE);
        src2.frequency.setTargetAtTime(freq, t, GLIDE);
      };
      break;
    }

    /* ── Raqamli buzilish ─────────────────────────────────────── */
    case 'crush': {
      const o1 = osc('sawtooth', r.base);
      const o2 = osc('square', r.base * 0.5);
      const pre = ctx.createGain();
      pre.gain.value = 0.5;
      o1.connect(pre);
      o2.connect(pre);

      const shaper = ctx.createWaveShaper();
      shaper.curve = stepCurve(Math.max(P('steps', 6), 2));

      // Qisqa aks — raqamli, "kompyuterga xos" takror
      const delay = ctx.createDelay(0.4);
      delay.delayTime.value = P('echo', 0.09);
      const fb = ctx.createGain();
      fb.gain.value = Math.min(P('fb', 0.5), 0.8);

      pre.connect(shaper);
      shaper.connect(tone);
      shaper.connect(delay);
      delay.connect(fb);
      fb.connect(delay);
      delay.connect(tone);

      tick = (_k, _x, t) => {
        o1.frequency.setTargetAtTime(freq, t, GLIDE);
        o2.frequency.setTargetAtTime(freq * 0.5, t, GLIDE);
      };
      break;
    }

    /* ── Ketma-ketlik ─────────────────────────────────────────── */
    case 'arp': {
      const up = P('up', 1);
      spawn = (t, i) => {
        const semi = SCALE[Math.floor(i * up) % SCALE.length];
        const f = freq * 2 ** (semi / 12);

        const o = ctx.createOscillator();
        o.type = P('square', 0) ? 'square' : 'sawtooth';
        o.frequency.value = f;

        const bp = ctx.createBiquadFilter();
        bp.type = 'lowpass';
        bp.Q.value = P('q', 9);
        bp.frequency.value = f * P('bright', 4);

        const g = ctx.createGain();
        const d = P('len', 0.26);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(P('lvl', 0.3), t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);

        const pan = ctx.createStereoPanner();
        pan.pan.value = ((i % 4) / 3) * 1.2 - 0.6;

        o.connect(bp);
        bp.connect(g);
        g.connect(pan);
        pan.connect(tone);
        o.start(t);
        o.stop(t + d + 0.03);
      };
      break;
    }

    /* ── Rezonator ────────────────────────────────────────────── */
    case 'noiseres': {
      const src = loopNoise();
      const ratios = [1, P('r2', 1.5), P('r3', 2.24)];
      // Q juda yuqori: shovqindan aniq balandlikdagi hushtak qoladi
      const bands = ratios.map((rt, i) => {
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.Q.value = P('q', 34);
        f.frequency.value = r.base * rt;
        const g = ctx.createGain();
        g.gain.value = P('lvl', 3) / (i + 1);
        const pan = ctx.createStereoPanner();
        pan.pan.value = (i - 1) * 0.6;
        src.connect(f);
        f.connect(g);
        g.connect(pan);
        pan.connect(tone);
        return { f, rt };
      });

      tick = (_k, _x, t) => {
        for (const b of bands) b.f.frequency.setTargetAtTime(freq * b.rt, t, GLIDE);
      };
      break;
    }

    /* ── To'lqinni egish ──────────────────────────────────────── */
    case 'shaper': {
      const o1 = osc('sine', r.base);
      const o2 = osc('sine', r.base * P('ratio', 1.5));
      const pre = ctx.createGain();
      pre.gain.value = 1;
      o1.connect(pre);
      o2.connect(pre);

      const shaper = ctx.createWaveShaper();
      shaper.curve = driveCurve(P('drive', 8));
      shaper.oversample = '2x';

      const post = ctx.createGain();
      post.gain.value = P('post', 0.5);

      pre.connect(shaper);
      shaper.connect(post);
      post.connect(tone);

      tick = (k, _x, t) => {
        o1.frequency.setTargetAtTime(freq, t, GLIDE);
        o2.frequency.setTargetAtTime(freq * P('ratio', 1.5), t, GLIDE);
        // Tezlik oshgani sari kuchliroq egiladi — ovoz "o'kiradi"
        pre.gain.setTargetAtTime(0.4 + k * P('bite', 2.2), t, GLIDE);
      };
      break;
    }
  }

  /* ────────────────────────────────────── Voqealarni rejalashtirish */

  let nextAt = now + 0.03;
  let step = 0;

  const schedule = (k: number) => {
    if (!spawn || !r.rate) return;
    const per = 1 / Math.max(r.rate[0] + (r.rate[1] - r.rate[0]) * k, 0.05);
    const until = ctx.currentTime + AHEAD;
    // Uzoq to'xtab qolgandan keyin o'tmishdagi voqealarni quvib
    // yetishga urinmaymiz — hozirdan boshlaymiz
    if (nextAt < ctx.currentTime) nextAt = ctx.currentTime + 0.01;
    let guard = 0;
    while (nextAt < until && guard < 32) {
      spawn(nextAt, step);
      nextAt += per;
      step += 1;
      guard += 1;
    }
  };

  return {
    update(k, x) {
      if (stopped) return;
      const t = ctx.currentTime;
      const pos = 0.88 + x * 0.26;
      freq = (r.base + r.span * Math.sqrt(k)) * pos;

      tone.frequency.setTargetAtTime(r.cut[0] + (r.cut[1] - r.cut[0]) * k, t, GLIDE);
      subOsc?.frequency.setTargetAtTime(freq * 0.5, t, GLIDE * 1.6);
      tick(k, x, t);
      schedule(k);

      bus.gain.setTargetAtTime(k * (r.trim ?? 1), t, k > 0.05 ? 0.06 : 0.25);
    },
    stop() {
      stopped = true;
      const t = ctx.currentTime;
      bus.gain.setTargetAtTime(0, t, 0.1);
      for (const n of running) n.stop(t + 0.6);
    },
  };
}
