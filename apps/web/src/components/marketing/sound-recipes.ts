import type { Recipe } from './sound-engine';

/**
 * Qirqta boyitilgan ovoz.
 *
 * Hammasi UZLUKSIZ: elektromobil yurganda alohida "tiq"lar chiqarmaydi,
 * u to'xtovsiz g'uvillaydi va tezlik uning tovushini o'zgartiradi.
 * Avvalgi urinishlarda aynan shu narsa yetishmasdi.
 *
 * Har bir retsept `sound-engine` dagi bir xil dvigatelga beriladi, ya'ni
 * hammasida sub-bass, ko'p ovozli qatlam, havo shovqini va reverb bor.
 * Farq — nisbatlarda:
 *
 *   base/span  — chastota qayerdan boshlanadi va qancha ko'tariladi
 *   cut + q    — filtr xarakteri; yuqori `q` motorga xos chiyillash beradi
 *   sub        — pastdagi og'irlik
 *   air        — shovqin ulushi, "havo"
 *   space      — reverb; qancha ko'p bo'lsa, shuncha kengroq va uzoqroq
 *   layers     — tovush tarkibi; `voices` 1 dan katta bo'lsa supersaw
 */

/** Qisqartma: bir qatlam yozishni yengillashtiradi */
const L = (
  type: OscillatorType,
  ratio: number,
  voices: number,
  detune: number,
  level: number,
) => ({ type, ratio, voices, detune, level });

const RAW: readonly Recipe[] = [
  // ══════════════════════════════════ Elektromobil — yurish
  {
    id: 'ev-cruise', name: 'EV — tekis yurish', desc: 'Keng supersaw, chuqur sub, yumshoq fazo',
    group: 'Elektromobil', base: 120, span: 420, cut: [420, 3200], q: 3, filter: 'lowpass',
    sub: 0.5, air: 0.05, space: 0.34,
    layers: [L('sawtooth', 1, 5, 16, 0.5), L('sawtooth', 2, 3, 22, 0.22)],
  },
  {
    id: 'ev-launch', name: 'EV — tezlanish', desc: 'Keskin ko‘tarilish, ochiq filtr',
    group: 'Elektromobil', base: 90, span: 720, cut: [300, 5200], q: 6, filter: 'lowpass',
    sub: 0.45, air: 0.07, space: 0.26,
    layers: [L('sawtooth', 1, 7, 22, 0.5), L('square', 2, 2, 12, 0.14)],
  },
  {
    id: 'ev-glide', name: 'EV — sirg‘alish', desc: 'Sokin, keng, deyarli jimjit',
    group: 'Elektromobil', base: 100, span: 240, cut: [340, 1800], q: 2, filter: 'lowpass',
    sub: 0.55, air: 0.04, space: 0.5,
    layers: [L('triangle', 1, 5, 12, 0.55), L('sine', 2, 2, 8, 0.2)],
  },
  {
    id: 'ev-turbo', name: 'EV — turbina', desc: 'Yuqori aylanish, metall tus',
    group: 'Elektromobil', base: 260, span: 1400, cut: [800, 7000], q: 11, filter: 'lowpass',
    sub: 0.3, air: 0.12, space: 0.22,
    layers: [L('sawtooth', 1, 5, 26, 0.42), L('sawtooth', 1.5, 3, 18, 0.2)],
  },
  {
    id: 'ev-heavy', name: 'EV — og‘ir yuk', desc: 'Past, kuchli, sekin javob beradi',
    group: 'Elektromobil', base: 62, span: 260, cut: [200, 2000], q: 5, filter: 'lowpass',
    sub: 0.75, air: 0.05, space: 0.3,
    layers: [L('sawtooth', 1, 4, 14, 0.5), L('square', 1, 2, 9, 0.18)],
  },
  {
    id: 'ev-regen', name: 'EV — rekuperatsiya', desc: 'Tezlashganda PASAYADI — teskari',
    group: 'Elektromobil', base: 420, span: -260, cut: [900, 3000], q: 4, filter: 'lowpass',
    sub: 0.35, air: 0.05, space: 0.32,
    layers: [L('triangle', 1, 4, 14, 0.5), L('sine', 2, 2, 10, 0.2)],
  },
  {
    id: 'ev-pod', name: 'EV — kapsula', desc: 'Yopiq salon, bo‘g‘iq va keng',
    group: 'Elektromobil', base: 88, span: 300, cut: [240, 1500], q: 4, filter: 'lowpass',
    sub: 0.6, air: 0.06, space: 0.55,
    layers: [L('sawtooth', 1, 6, 18, 0.45), L('triangle', 2, 3, 12, 0.18)],
  },
  {
    id: 'ev-hyper', name: 'EV — hiperkar', desc: 'Eng keng supersaw, yorqin',
    group: 'Elektromobil', base: 140, span: 860, cut: [500, 6200], q: 8, filter: 'lowpass',
    sub: 0.42, air: 0.09, space: 0.28,
    layers: [L('sawtooth', 1, 7, 28, 0.46), L('sawtooth', 2, 5, 20, 0.2), L('square', 4, 2, 10, 0.07)],
  },
  {
    id: 'ev-silent', name: 'EV — sokin rejim', desc: 'Juda past daraja, faqat his qilinadi',
    group: 'Elektromobil', base: 70, span: 150, cut: [180, 900], q: 2, filter: 'lowpass',
    sub: 0.7, air: 0.03, space: 0.42,
    layers: [L('sine', 1, 3, 8, 0.5), L('triangle', 2, 2, 6, 0.14)],
  },
  {
    id: 'ev-track', name: 'EV — poyga', desc: 'Tajovuzkor, tishli, tez javob',
    group: 'Elektromobil', base: 160, span: 1100, cut: [600, 7800], q: 14, filter: 'lowpass',
    sub: 0.38, air: 0.1, space: 0.18,
    layers: [L('sawtooth', 1, 6, 30, 0.48), L('square', 1.5, 3, 16, 0.16)],
  },

  // ══════════════════════════════════ Neon
  {
    id: 'neon-drive', name: 'Neon — drive', desc: '80-yillar sintezi, keng va issiq',
    group: 'Neon', base: 130, span: 460, cut: [500, 4200], q: 7, filter: 'lowpass',
    sub: 0.5, air: 0.05, space: 0.4,
    layers: [L('sawtooth', 1, 7, 24, 0.42), L('sawtooth', 1.5, 3, 16, 0.2), L('triangle', 2, 2, 10, 0.14)],
  },
  {
    id: 'neon-pulse', name: 'Neon — puls', desc: 'Kvadrat to‘lqin, tor rezonans',
    group: 'Neon', base: 110, span: 520, cut: [400, 4600], q: 13, filter: 'lowpass',
    sub: 0.45, air: 0.06, space: 0.36,
    layers: [L('square', 1, 5, 20, 0.4), L('sawtooth', 2, 3, 14, 0.18)],
  },
  {
    id: 'neon-glow', name: 'Neon — porlash', desc: 'Yumshoq, uzun aks, tiniq',
    group: 'Neon', base: 180, span: 420, cut: [700, 3600], q: 4, filter: 'lowpass',
    sub: 0.3, air: 0.05, space: 0.62,
    layers: [L('triangle', 1, 5, 14, 0.45), L('sine', 3, 3, 10, 0.16)],
  },
  {
    id: 'neon-grid', name: 'Neon — to‘r', desc: 'Beshlik akkord, kengaygan',
    group: 'Neon', base: 120, span: 380, cut: [450, 3400], q: 5, filter: 'lowpass',
    sub: 0.48, air: 0.05, space: 0.44,
    layers: [L('sawtooth', 1, 4, 18, 0.36), L('sawtooth', 1.5, 4, 18, 0.28), L('sawtooth', 2, 2, 12, 0.14)],
  },
  {
    id: 'neon-blade', name: 'Neon — tig‘', desc: 'O‘tkir, yuqori, sovuq',
    group: 'Neon', base: 220, span: 900, cut: [900, 6800], q: 12, filter: 'lowpass',
    sub: 0.24, air: 0.1, space: 0.3,
    layers: [L('sawtooth', 1, 6, 26, 0.4), L('square', 3, 2, 12, 0.1)],
  },
  {
    id: 'neon-haze', name: 'Neon — tuman', desc: 'Ko‘p shovqin, yumshoq chegara',
    group: 'Neon', base: 96, span: 300, cut: [300, 2600], q: 3, filter: 'lowpass',
    sub: 0.55, air: 0.2, space: 0.55,
    layers: [L('triangle', 1, 5, 16, 0.4), L('sawtooth', 2, 3, 12, 0.14)],
  },
  {
    id: 'neon-arc', name: 'Neon — yoy', desc: 'Bandpass — tor va yo‘naltirilgan',
    group: 'Neon', base: 150, span: 700, cut: [600, 4000], q: 9, filter: 'bandpass',
    sub: 0.4, air: 0.08, space: 0.38,
    layers: [L('sawtooth', 1, 5, 22, 0.5), L('triangle', 2, 2, 10, 0.16)],
  },
  {
    id: 'neon-chrome', name: 'Neon — xrom', desc: 'Metall yorqinlik, yuqori obertonlar',
    group: 'Neon', base: 165, span: 780, cut: [800, 7400], q: 10, filter: 'lowpass',
    sub: 0.3, air: 0.07, space: 0.34,
    layers: [L('square', 1, 4, 20, 0.34), L('sawtooth', 2.5, 3, 16, 0.2), L('sine', 5, 2, 8, 0.08)],
  },
  {
    id: 'neon-dusk', name: 'Neon — shom', desc: 'Past, issiq, uzun fazo',
    group: 'Neon', base: 84, span: 260, cut: [260, 2000], q: 3, filter: 'lowpass',
    sub: 0.66, air: 0.05, space: 0.6,
    layers: [L('sawtooth', 1, 5, 14, 0.42), L('triangle', 1.5, 3, 10, 0.18)],
  },
  {
    id: 'neon-signal', name: 'Neon — signal', desc: 'Tor bandpass, "radio" tusi',
    group: 'Neon', base: 200, span: 640, cut: [1000, 3800], q: 16, filter: 'bandpass',
    sub: 0.28, air: 0.12, space: 0.3,
    layers: [L('sawtooth', 1, 4, 18, 0.5), L('square', 2, 2, 10, 0.12)],
  },

  // ══════════════════════════════════ Kosmik
  {
    id: 'cos-drift', name: 'Kosmos — suzish', desc: 'Juda keng fazo, sekin javob',
    group: 'Kosmik', base: 74, span: 220, cut: [220, 2200], q: 2, filter: 'lowpass',
    sub: 0.6, air: 0.1, space: 0.75,
    layers: [L('triangle', 1, 5, 12, 0.45), L('sine', 2, 3, 8, 0.2), L('sine', 3, 2, 6, 0.1)],
  },
  {
    id: 'cos-nebula', name: 'Kosmos — tumanlik', desc: 'Akkord, shovqin bilan aralashgan',
    group: 'Kosmik', base: 110, span: 200, cut: [320, 2400], q: 2, filter: 'lowpass',
    sub: 0.45, air: 0.24, space: 0.7,
    layers: [L('sine', 1, 4, 10, 0.4), L('sine', 1.5, 3, 9, 0.26), L('sine', 2, 2, 7, 0.16)],
  },
  {
    id: 'cos-void', name: 'Kosmos — bo‘shliq', desc: 'Deyarli faqat sub va aks',
    group: 'Kosmik', base: 46, span: 120, cut: [140, 800], q: 2, filter: 'lowpass',
    sub: 0.85, air: 0.08, space: 0.8,
    layers: [L('sine', 1, 3, 7, 0.5), L('sine', 2, 2, 5, 0.12)],
  },
  {
    id: 'cos-station', name: 'Kosmos — stansiya', desc: 'Mexanik g‘uvillash, uzoq aks',
    group: 'Kosmik', base: 92, span: 280, cut: [260, 2600], q: 6, filter: 'lowpass',
    sub: 0.58, air: 0.14, space: 0.6,
    layers: [L('sawtooth', 1, 4, 12, 0.38), L('square', 2, 2, 8, 0.12)],
  },
  {
    id: 'cos-solar', name: 'Kosmos — quyosh shamoli', desc: 'Shovqin ustun, yorqin',
    group: 'Kosmik', base: 130, span: 340, cut: [500, 5000], q: 2, filter: 'bandpass',
    sub: 0.32, air: 0.42, space: 0.66,
    layers: [L('triangle', 1, 4, 14, 0.3), L('sine', 3, 2, 8, 0.12)],
  },
  {
    id: 'cos-pulsar', name: 'Kosmos — pulsar', desc: 'Tor rezonans, ritmik tus',
    group: 'Kosmik', base: 150, span: 520, cut: [700, 4400], q: 18, filter: 'bandpass',
    sub: 0.36, air: 0.12, space: 0.55,
    layers: [L('sawtooth', 1, 3, 16, 0.44), L('sine', 2, 2, 8, 0.14)],
  },
  {
    id: 'cos-orbit', name: 'Kosmos — orbita', desc: 'Beshlik, tinch va toza',
    group: 'Kosmik', base: 98, span: 250, cut: [300, 2800], q: 3, filter: 'lowpass',
    sub: 0.5, air: 0.07, space: 0.68,
    layers: [L('sine', 1, 4, 9, 0.42), L('triangle', 1.5, 3, 11, 0.24)],
  },
  {
    id: 'cos-comet', name: 'Kosmos — kometa', desc: 'Tez ko‘tariluvchi, uzun quyruq',
    group: 'Kosmik', base: 120, span: 880, cut: [400, 6000], q: 7, filter: 'lowpass',
    sub: 0.34, air: 0.18, space: 0.7,
    layers: [L('sawtooth', 1, 5, 20, 0.4), L('sine', 3, 2, 8, 0.12)],
  },
  {
    id: 'cos-ice', name: 'Kosmos — muz', desc: 'Yuqori, tiniq, sovuq',
    group: 'Kosmik', base: 240, span: 520, cut: [1200, 6600], q: 5, filter: 'lowpass',
    sub: 0.2, air: 0.14, space: 0.72,
    layers: [L('sine', 1, 4, 10, 0.4), L('triangle', 2, 3, 8, 0.2), L('sine', 4, 2, 6, 0.1)],
  },
  {
    id: 'cos-deep', name: 'Kosmos — chuqurlik', desc: 'Eng past, eng keng',
    group: 'Kosmik', base: 38, span: 90, cut: [110, 620], q: 2, filter: 'lowpass',
    sub: 0.9, air: 0.06, space: 0.85,
    layers: [L('sine', 1, 3, 6, 0.5), L('sine', 1.5, 2, 5, 0.14)],
  },

  // ══════════════════════════════════ Futuristik
  {
    id: 'fut-core', name: 'Futuristik — yadro', desc: 'Zich, kuchli, boy obertonlar',
    group: 'Futuristik', base: 116, span: 520, cut: [420, 4800], q: 8, filter: 'lowpass',
    sub: 0.52, air: 0.08, space: 0.36,
    layers: [L('sawtooth', 1, 6, 22, 0.44), L('square', 2, 3, 14, 0.16), L('sine', 4, 2, 8, 0.08)],
  },
  {
    id: 'fut-hover', name: 'Futuristik — hover', desc: 'Havoda turgan apparat',
    group: 'Futuristik', base: 104, span: 340, cut: [340, 3000], q: 5, filter: 'lowpass',
    sub: 0.58, air: 0.16, space: 0.5,
    layers: [L('triangle', 1, 5, 16, 0.42), L('sawtooth', 2, 3, 12, 0.16)],
  },
  {
    id: 'fut-reactor', name: 'Futuristik — reaktor', desc: 'Og‘ir, tebranuvchi',
    group: 'Futuristik', base: 58, span: 300, cut: [180, 2400], q: 9, filter: 'lowpass',
    sub: 0.8, air: 0.1, space: 0.4,
    layers: [L('square', 1, 4, 16, 0.36), L('sawtooth', 1.5, 3, 12, 0.2)],
  },
  {
    id: 'fut-scan', name: 'Futuristik — skaner', desc: 'Juda tor filtr, sirg‘alish eshitiladi',
    group: 'Futuristik', base: 170, span: 420, cut: [500, 5400], q: 22, filter: 'bandpass',
    sub: 0.3, air: 0.16, space: 0.34,
    layers: [L('sawtooth', 1, 4, 18, 0.5), L('square', 2, 2, 10, 0.12)],
  },
  {
    id: 'fut-shield', name: 'Futuristik — qalqon', desc: 'Barqaror gul, yengil titroq',
    group: 'Futuristik', base: 132, span: 300, cut: [420, 3200], q: 6, filter: 'lowpass',
    sub: 0.44, air: 0.2, space: 0.52,
    layers: [L('triangle', 1, 5, 20, 0.4), L('sine', 2.5, 3, 12, 0.16)],
  },
  {
    id: 'fut-jet', name: 'Futuristik — reaktiv', desc: 'Shovqin ustun, kuchli oqim',
    group: 'Futuristik', base: 140, span: 700, cut: [500, 6800], q: 3, filter: 'bandpass',
    sub: 0.4, air: 0.5, space: 0.32,
    layers: [L('sawtooth', 1, 4, 20, 0.26), L('triangle', 2, 2, 10, 0.1)],
  },
  {
    id: 'fut-drive', name: 'Futuristik — dvigatel', desc: 'Uch qatlam, keng spektr',
    group: 'Futuristik', base: 108, span: 620, cut: [380, 5600], q: 10, filter: 'lowpass',
    sub: 0.5, air: 0.09, space: 0.3,
    layers: [L('sawtooth', 1, 7, 26, 0.4), L('square', 1.5, 3, 14, 0.16), L('sawtooth', 3, 2, 10, 0.08)],
  },
  {
    id: 'fut-plasma', name: 'Futuristik — plazma', desc: 'Beqaror, tirik, tebranuvchi',
    group: 'Futuristik', base: 126, span: 560, cut: [460, 5200], q: 15, filter: 'lowpass',
    sub: 0.42, air: 0.26, space: 0.42,
    layers: [L('sawtooth', 1, 5, 34, 0.4), L('square', 2, 3, 22, 0.14)],
  },
  {
    id: 'fut-mono', name: 'Futuristik — mono', desc: 'Bitta toza ovoz, keng aks',
    group: 'Futuristik', base: 150, span: 400, cut: [600, 3400], q: 4, filter: 'lowpass',
    sub: 0.4, air: 0.04, space: 0.58,
    layers: [L('triangle', 1, 3, 8, 0.55)],
  },
  {
    id: 'fut-swarm', name: 'Futuristik — to‘da', desc: 'Ko‘p ovozli, "olomon" tusi',
    group: 'Futuristik', base: 112, span: 480, cut: [400, 4400], q: 6, filter: 'lowpass',
    sub: 0.46, air: 0.12, space: 0.46,
    layers: [L('sawtooth', 1, 7, 40, 0.34), L('sawtooth', 2, 5, 30, 0.18), L('triangle', 4, 3, 16, 0.08)],
  },
];

/* ──────────────────────────────────── Balandlikni tenglashtirish */

/**
 * O'lchangan RMS qiymatlari.
 *
 * Har bir retsept `OfflineAudioContext` da 1.2 soniya chizilib,
 * o'rtacha kvadratik quvvati o'lchandi (tezlik 0.7 da ushlab turildi,
 * ko'tarilish qismi hisobga olinmadi). Natija: eng tinchi 0.117, eng
 * balandi 0.357 — deyarli o'n desibel farq.
 *
 * Nega bu muhim: quloq balandroq ovozni beixtiyor "yaxshiroq" deb
 * baholaydi. Solishtirish sahifasida bu tanlovni buzadi — chuqur sub
 * bergan retsept mazmunan yaxshi bo'lmasa ham yutib chiqadi.
 *
 * Nega formula emas, o'lchov: balandlikka qatlamlar darajasi emas,
 * ko'proq filtr kesimi ta'sir qiladi — uni qog'ozda hisoblab
 * bo'lmaydi. Retsept o'zgarsa, qayta o'lchash kerak.
 */
const MEASURED: Record<string, number> = {
  'ev-cruise': 0.2404, 'ev-launch': 0.239, 'ev-glide': 0.2574, 'ev-turbo': 0.1895,
  'ev-heavy': 0.3399, 'ev-regen': 0.2046, 'ev-pod': 0.2492, 'ev-hyper': 0.2229,
  'ev-silent': 0.3184, 'ev-track': 0.2452,
  'neon-arc': 0.1655, 'neon-glow': 0.1589, 'neon-pulse': 0.2564, 'neon-drive': 0.2312,
  'neon-haze': 0.2221, 'neon-blade': 0.1604, 'neon-grid': 0.2173, 'neon-dusk': 0.2538,
  'neon-chrome': 0.2005, 'neon-signal': 0.1217,
  'cos-drift': 0.2204, 'cos-orbit': 0.2146, 'cos-deep': 0.3012, 'cos-solar': 0.1174,
  'cos-pulsar': 0.1342, 'cos-nebula': 0.2026, 'cos-void': 0.2867, 'cos-comet': 0.1517,
  'cos-ice': 0.144, 'cos-station': 0.2297,
  'fut-core': 0.2568, 'fut-drive': 0.2482, 'fut-plasma': 0.2327, 'fut-scan': 0.1259,
  'fut-hover': 0.2488, 'fut-reactor': 0.3571, 'fut-jet': 0.1756, 'fut-shield': 0.2005,
  'fut-mono': 0.1889, 'fut-swarm': 0.2012,
};

/** Hammasi shu darajaga keltiriladi */
const TARGET = 0.22;

/**
 * Tuzatish chegaralangan: juda tinch retseptni kuchli ko'tarish shovqinni
 * ham ko'taradi va ovozni buzadi. Shuning uchun 0.6..1.6 oralig'i.
 */
export const RECIPES: readonly Recipe[] = RAW.map((r) => {
  const m = MEASURED[r.id];
  const trim = m ? Math.min(Math.max(TARGET / m, 0.6), 1.6) : 1;
  return { ...r, trim };
});
