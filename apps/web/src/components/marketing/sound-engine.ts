/**
 * Boyitilgan ovoz dvigateli.
 *
 * ── Nega avvalgi ovozlar "o'yinchoq" bo'lib eshitilardi ─────────────
 * Ular bitta-ikkita generatordan iborat edi: quruq, tor, chuqurliksiz.
 * Shu narsa ovozni arzon qiladi. Premium ovozda to'rtta qatlam bor va
 * ularning har biri o'z ishini bajaradi:
 *
 *   SUB     — 40–70 Hz. Eshitilmaydi, HIS QILINADI. Busiz ovoz "yupqa".
 *   BODY    — asosiy tovush. Bitta generator emas, bir nechta biroz
 *             ko'chirilgan (detune) nusxa — "supersaw". Aynan shu narsa
 *             kenglik va boylik beradi.
 *   AIR     — juda past darajadagi shovqin. Sintetik tozalikni buzadi
 *             va ovozni "tirik" qiladi.
 *   REVERB  — fazo. Bu eng muhimi: quruq ovoz har doim arzon eshitiladi,
 *             chunki tabiatda quruq ovoz yo'q.
 *
 * ── Reverb qanday yasalgan ──────────────────────────────────────────
 * Tayyor fayl kerak emas: impuls javobi shovqindan hisoblab chiqariladi.
 * Shovqin eksponensial so'nadi, chap va o'ng kanallar mustaqil — shundan
 * stereo kenglik chiqadi.
 */

export interface Layer {
  type: OscillatorType;
  /** Asosiy chastotaga nisbatan (1 = asosiy, 2 = oktava, 1.5 = beshlik) */
  ratio: number;
  /** Nechta ko'chirilgan nusxa. 1 dan katta bo'lsa — supersaw. */
  voices: number;
  /** Ko'chirish kengligi, sentda */
  detune: number;
  level: number;
}

export interface Recipe {
  id: string;
  name: string;
  desc: string;
  group: string;
  /** Sokin va eng tez holatdagi asosiy chastota */
  base: number;
  span: number;
  /** Filtr kesimi: sokin -> tez */
  cut: [number, number];
  /** Filtr rezonansi. Yuqori bo'lsa — "chiyillagan", motorga xos. */
  q: number;
  filter: BiquadFilterType;
  sub: number;
  air: number;
  /** Reverbga yuboriladigan ulush 0..1 */
  space: number;
  layers: Layer[];

  /* ── Quyidagilari majburiy emas. Ular ikkinchi to'plam uchun
        qo'shildi: birinchi qirqtasi ularsiz, avvalgidek ishlaydi. ── */

  /**
   * Filtrni tebratuvchi past chastotali generator.
   *
   * Nima beradi: ovoz qotib qolmaydi, u "nafas oladi". Neon va kosmik
   * tuslar aynan shundan chiqadi. `track` — tezlik oshganda tebranish
   * qanchaga tezlashadi.
   */
  lfo?: { rate: number; depth: number; track?: number };

  /**
   * Aks-sado.
   *
   * Reverbdan farqi: reverb fazo beradi, aks-sado esa RITM beradi —
   * ovoz uzoqdan qaytib keladi. Neon shaharga xos.
   */
  echo?: { time: number; feedback: number; mix: number };

  /**
   * Chastota modulyatsiyasi — metall tus.
   *
   * Sof generatorlar "iliq" eshitiladi. FM esa ohangga nomutanosib
   * qo'shimcha tovushlar qo'shadi va ovoz metallga o'xshab qoladi.
   */
  fm?: { ratio: number; depth: number };

  /**
   * Elektromotor chiyillashi.
   *
   * Elektromobilni benzin mashinadan ayirib turadigan asosiy narsa —
   * tezlik bilan yuqoriga chiquvchi ingichka tovush. U faqat harakatda
   * paydo bo'ladi: `level` tezlikka ko'paytiriladi.
   */
  whine?: { from: number; to: number; level: number; type?: OscillatorType };

  /**
   * Balandlikni tenglashtirish ko'paytmasi.
   *
   * Retseptlar tarkibi har xil: chuqur sub bergani tabiiy ravishda
   * balandroq chiqadi. Solishtirish sahifasida bu adolatsiz — quloq
   * balandroq ovozni "yaxshiroq" deb qabul qiladi. Shuning uchun har
   * bir retsept o'lchanadi va shu yerda tenglashtiriladi.
   * `sound-recipes.ts` ga qarang.
   */
  trim?: number;
}

export interface Drone {
  /** `k` — tezlik 0..1, `x` — kursorning gorizontal o'rni 0..1 */
  update(k: number, x: number): void;
  stop(): void;
}

/* ─────────────────────────────────────────────────────── Yordamchilar */

let irCache: AudioBuffer | null = null;

/**
 * Reverb uchun impuls javobi.
 *
 * Shovqin + eksponensial so'nish — eng oddiy, lekin ishonchli usul.
 * Boshida qisqa "oldingi aks" (pre-delay) qoldiriladi: busiz reverb
 * ovozga yopishib qoladi va fazo hissi bermaydi.
 */
export function impulse(ctx: AudioContext, seconds = 2.6, decay = 2.4) {
  if (irCache && irCache.sampleRate === ctx.sampleRate) return irCache;

  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const pre = Math.floor(rate * 0.02);
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

  irCache = buf;
  return buf;
}

let noiseCache: AudioBuffer | null = null;
export function noise(ctx: AudioContext) {
  if (!noiseCache || noiseCache.sampleRate !== ctx.sampleRate) {
    const len = ctx.sampleRate * 3;
    noiseCache = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseCache.getChannelData(0);
    for (let i = 0; i < len; i += 1) d[i] = Math.random() * 2 - 1;
  }
  return noiseCache;
}

/** Yumshoq o'zgarish. Busiz har o'zgarishda "chiq" eshitiladi. */
const GLIDE = 0.08;

/* ───────────────────────────────────────────────────────── Dvigatel */

export function startRich(ctx: AudioContext, out: GainNode, r: Recipe): Drone {
  const now = ctx.currentTime;

  // Umumiy chiqish
  const bus = ctx.createGain();
  bus.gain.value = 0;
  bus.connect(out);

  // Reverb yo'li. Quruq ovoz ham qoladi — faqat aks bo'lsa, ovoz
  // uzoqda va noaniq bo'lib qoladi.
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
  filter.type = r.filter;
  filter.Q.value = r.q;
  filter.frequency.value = r.cut[0];
  filter.connect(dry);
  filter.connect(conv);

  const oscs: OscillatorNode[] = [];
  const srcs: AudioBufferSourceNode[] = [];

  // Aks-sado. Teskari aloqa ataylab cheklangan: 0.85 dan yuqorisi
  // o'z-o'zidan kuchayib ketadi va ovoz portlaydi.
  if (r.echo) {
    const delay = ctx.createDelay(1.5);
    delay.delayTime.value = Math.min(r.echo.time, 1.4);

    const fb = ctx.createGain();
    fb.gain.value = Math.min(r.echo.feedback, 0.82);

    // Qaytgan ovoz har safar biroz xiralashsin — tabiiy aks shunday
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 2600;

    const mix = ctx.createGain();
    mix.gain.value = r.echo.mix;

    filter.connect(delay);
    delay.connect(damp);
    damp.connect(fb);
    fb.connect(delay);
    delay.connect(mix);
    mix.connect(bus);
  }

  // Filtrni tebratuvchi LFO. `filter.frequency` ga ULANADI, ya'ni
  // `update` dagi qiymat ustiga QO'SHILADI — ikkalasi bir-biriga
  // xalaqit qilmaydi.
  let lfoOsc: OscillatorNode | null = null;
  if (r.lfo) {
    lfoOsc = ctx.createOscillator();
    lfoOsc.type = 'sine';
    lfoOsc.frequency.value = r.lfo.rate;
    const g = ctx.createGain();
    g.gain.value = r.lfo.depth;
    lfoOsc.connect(g);
    g.connect(filter.frequency);
    lfoOsc.start(now);
    oscs.push(lfoOsc);
  }

  /** Har bir generator va uning asosiy chastotaga nisbati */
  const voices: Array<{ osc: OscillatorNode; ratio: number }> = [];

  for (const L of r.layers) {
    // Har bir ovoz o'z stereo o'rniga ega — bu kenglik beradi
    for (let v = 0; v < L.voices; v += 1) {
      const osc = ctx.createOscillator();
      osc.type = L.type;
      osc.frequency.value = r.base * L.ratio;

      // Nusxalar simmetrik ko'chiriladi: -detune .. +detune
      const spread = L.voices === 1 ? 0 : (v / (L.voices - 1)) * 2 - 1;
      osc.detune.value = spread * L.detune;

      const g = ctx.createGain();
      g.gain.value = L.level / Math.sqrt(L.voices);

      const pan = ctx.createStereoPanner();
      pan.pan.value = spread * 0.7;

      osc.connect(g);
      g.connect(pan);
      pan.connect(filter);
      osc.start(now);

      oscs.push(osc);
      voices.push({ osc, ratio: L.ratio });
    }
  }

  // FM — metall tus. Modulyator hamma ovozlarning chastotasiga
  // ulanadi, ya'ni ularni birdek "titratadi".
  let fmOsc: OscillatorNode | null = null;
  let fmGain: GainNode | null = null;
  if (r.fm) {
    fmOsc = ctx.createOscillator();
    fmOsc.type = 'sine';
    fmOsc.frequency.value = r.base * r.fm.ratio;
    fmGain = ctx.createGain();
    fmGain.gain.value = r.base * r.fm.depth;
    fmOsc.connect(fmGain);
    for (const v of voices) fmGain.connect(v.osc.frequency);
    fmOsc.start(now);
    oscs.push(fmOsc);
  }

  // Elektromotor chiyillashi — faqat harakatda paydo bo'ladi
  let whineOsc: OscillatorNode | null = null;
  let whineGain: GainNode | null = null;
  if (r.whine) {
    whineOsc = ctx.createOscillator();
    whineOsc.type = r.whine.type ?? 'triangle';
    whineOsc.frequency.value = r.whine.from;
    whineGain = ctx.createGain();
    whineGain.gain.value = 0;
    whineOsc.connect(whineGain);
    whineGain.connect(filter);
    whineOsc.start(now);
    oscs.push(whineOsc);
  }

  // Sub — alohida yo'l, filtrga kirmaydi: uni kesish ma'nosiz
  let subOsc: OscillatorNode | null = null;
  if (r.sub > 0) {
    subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = r.base * 0.5;
    const g = ctx.createGain();
    g.gain.value = r.sub;
    subOsc.connect(g);
    g.connect(dry);
    subOsc.start(now);
    oscs.push(subOsc);
  }

  // Air — shovqin qatlami
  let airFilter: BiquadFilterNode | null = null;
  if (r.air > 0) {
    const src = ctx.createBufferSource();
    src.buffer = noise(ctx);
    src.loop = true;

    airFilter = ctx.createBiquadFilter();
    airFilter.type = 'bandpass';
    airFilter.Q.value = 0.8;
    airFilter.frequency.value = 1200;

    const g = ctx.createGain();
    g.gain.value = r.air;

    src.connect(airFilter);
    airFilter.connect(g);
    g.connect(filter);
    src.start(now);
    srcs.push(src);
  }

  return {
    update(k, x) {
      const t = ctx.currentTime;
      // Kursorning o'rni tovushni sal suradi — harakat "yo'nalishga" ega
      const pos = 0.88 + x * 0.26;
      const f = (r.base + r.span * Math.sqrt(k)) * pos;

      for (const v of voices) v.osc.frequency.setTargetAtTime(f * v.ratio, t, GLIDE);
      subOsc?.frequency.setTargetAtTime(f * 0.5, t, GLIDE * 1.6);
      airFilter?.frequency.setTargetAtTime(700 + 4200 * k, t, GLIDE);

      if (r.fm && fmOsc && fmGain) {
        fmOsc.frequency.setTargetAtTime(f * r.fm.ratio, t, GLIDE);
        // Tezlik oshgani sari metall tus kuchayadi
        fmGain.gain.setTargetAtTime(f * r.fm.depth * (0.35 + 0.65 * k), t, GLIDE);
      }

      if (r.whine && whineOsc && whineGain) {
        // Chiyillash chastotasi chiziqli emas: boshida tez ko'tariladi,
        // keyin sekinlashadi — haqiqiy motor shunday.
        whineOsc.frequency.setTargetAtTime(
          r.whine.from + (r.whine.to - r.whine.from) * k ** 0.75,
          t,
          GLIDE,
        );
        whineGain.gain.setTargetAtTime(r.whine.level * k, t, GLIDE);
      }

      if (r.lfo && lfoOsc) {
        lfoOsc.frequency.setTargetAtTime(r.lfo.rate * (1 + (r.lfo.track ?? 0) * k), t, GLIDE * 2);
      }

      filter.frequency.setTargetAtTime(r.cut[0] + (r.cut[1] - r.cut[0]) * k, t, GLIDE);
      // Ko'tarilish tez, so'nish sekin — tabiiy xatti-harakat
      bus.gain.setTargetAtTime(k * (r.trim ?? 1), t, k > 0.05 ? 0.06 : 0.25);
    },
    stop() {
      const t = ctx.currentTime;
      bus.gain.setTargetAtTime(0, t, 0.1);
      for (const o of oscs) o.stop(t + 0.6);
      for (const s of srcs) s.stop(t + 0.6);
    },
  };
}
