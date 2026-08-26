import type { Spectral } from './sound-engine-4';

/**
 * O'ttizta FM / to'lqin jadvali / spektr ovozi.
 *
 * Avvalgi 166 tasidan farqi manbada: ular brauzerning tayyor to'rtta
 * to'lqinidan chiqqan, bular esa to'lqinning O'ZINI quradi. Filtr
 * bilan bunday tembrga yetib bo'lmaydi.
 *
 * Uch guruh:
 *   FM             — operatorlar bir-birining chastotasini boshqaradi
 *   To'lqin jadvali — tovush bir necha spektr orasida suzib yuradi
 *   Spektr         — har bir ohang darajasi qo'lda berilgan
 */

/* ── Spektrlar. Har bir raqam — navbatdagi ohangning darajasi ── */

/** Organ: faqat oktava va beshliklar */
const ORGAN = [1, 0.5, 0, 0.35, 0, 0, 0, 0.2];
/** Ichi bo'sh, klarnetga o'xshash: faqat toq ohanglar */
const HOLLOW = [1, 0, 0.33, 0, 0.2, 0, 0.14, 0, 0.11];
/** To'liq, arradek */
const FULL = [1, 0.5, 0.33, 0.25, 0.2, 0.17, 0.14, 0.12, 0.11, 0.1];
/** Yuqori ohanglar kuchli — shishasimon */
const GLASSY = [0.6, 0.2, 0.1, 0.4, 0.1, 0.5, 0.1, 0.3, 0.2, 0.25, 0.1, 0.2];
/** Metall: tarqoq, notekis */
const METALLIC = [0.5, 0.1, 0.7, 0.15, 0.3, 0.6, 0.1, 0.4, 0.2, 0.55, 0.1, 0.3];
/** Ovozga o'xshash: formant zonalarida kuchli */
const VOCAL = [0.9, 0.7, 0.3, 0.15, 0.5, 0.6, 0.3, 0.1, 0.05, 0.2, 0.3, 0.1];
/** Deyarli sof — faqat asosiy va bir oz oktava */
const PURE = [1, 0.12, 0.04];
/** Juda yorqin, tishli */
const BUZZ = [1, 0.8, 0.7, 0.6, 0.55, 0.5, 0.45, 0.4, 0.36, 0.33, 0.3, 0.28, 0.26];
/** Past ohanglar yo'q — ingichka */
const THIN = [0.1, 0.2, 0.5, 0.8, 1, 0.7, 0.4, 0.3, 0.2];

const RAW: readonly Spectral[] = [
  // ═══════════════════════════════════════════ FM
  {
    id: 'f-bell', name: 'FM — qo‘ng‘iroq', desc: 'Butun bo‘lmagan nisbat: sof metall',
    group: 'FM', kind: 'fm', algo: 'parallel', base: 220, span: 380,
    cut: [4000, 9000], q: 1, space: 0.56, sub: 0.2,
    ops: [{ ratio: 3.51, index: 2.2 }],
  },
  {
    id: 'f-epiano', name: 'FM — elektro pianino', desc: 'Sakson yillar raqamli tovushi',
    group: 'FM', kind: 'fm', algo: 'parallel', base: 180, span: 260,
    cut: [3400, 7000], q: 1, space: 0.42, sub: 0.28,
    ops: [{ ratio: 1, index: 1.1 }, { ratio: 14, index: 0.18 }],
  },
  {
    id: 'f-brass', name: 'FM — mis', desc: 'Tezlik bilan ochiladi, kuchli',
    group: 'FM', kind: 'fm', algo: 'stack', base: 130, span: 320,
    cut: [2600, 8000], q: 2, space: 0.36, sub: 0.34,
    ops: [{ ratio: 1, index: 2.4 }, { ratio: 2, index: 1.2 }],
  },
  {
    id: 'f-glass', name: 'FM — shisha', desc: 'Yuqori, tiniq, sovuq',
    group: 'FM', kind: 'fm', algo: 'parallel', base: 340, span: 620,
    cut: [5000, 11000], q: 1, space: 0.62,
    ops: [{ ratio: 7.02, index: 0.9 }],
  },
  {
    id: 'f-deep', name: 'FM — chuqur', desc: 'Uch operator zanjiri, murakkab',
    group: 'FM', kind: 'fm', algo: 'stack', base: 72, span: 220,
    cut: [1600, 6000], q: 3, space: 0.44, sub: 0.5,
    ops: [{ ratio: 1, index: 1.8 }, { ratio: 1.41, index: 1.4 }, { ratio: 3, index: 0.9 }],
  },
  {
    id: 'f-wide', name: 'FM — keng', desc: 'Ikki mustaqil juftlik, stereoga yoyilgan',
    group: 'FM', kind: 'fm', algo: 'two', base: 150, span: 340,
    cut: [3000, 8000], q: 2, space: 0.5, sub: 0.26,
    ops: [{ ratio: 2.01, index: 1.6 }],
  },
  {
    id: 'f-alien', name: 'FM — begona', desc: 'Juda nomutanosib nisbat',
    group: 'FM', kind: 'fm', algo: 'parallel', base: 190, span: 420,
    cut: [3400, 9000], q: 4, space: 0.54,
    ops: [{ ratio: 1.73, index: 3.2 }],
  },
  {
    id: 'f-motor', name: 'FM — motor', desc: 'Past nisbat, g‘uvillash bilan',
    group: 'FM', kind: 'fm', algo: 'parallel', base: 96, span: 300,
    cut: [1800, 6400], q: 5, space: 0.3, sub: 0.46,
    ops: [{ ratio: 0.5, index: 2.6 }, { ratio: 2.02, index: 0.7 }],
  },
  {
    id: 'f-choir', name: 'FM — xor', desc: 'Yumshoq, ovozga yaqin',
    group: 'FM', kind: 'fm', algo: 'parallel', base: 160, span: 240,
    cut: [2800, 6000], q: 1, space: 0.72, sub: 0.24,
    carrier: 'triangle', ops: [{ ratio: 1, index: 0.6 }, { ratio: 3, index: 0.25 }],
  },
  {
    id: 'f-scream', name: 'FM — o‘tkir', desc: 'Chuqurlik tezlik bilan keskin ortadi',
    group: 'FM', kind: 'fm', algo: 'stack', base: 210, span: 700,
    cut: [3000, 10000], q: 6, space: 0.34,
    ops: [{ ratio: 1, index: 4 }, { ratio: 5.03, index: 1.6 }],
  },

  // ═══════════════════════════════════════════ To'lqin jadvali
  {
    id: 'w-morph', name: 'Jadval — suzish', desc: 'Sof → to‘liq → metall, doim harakatda',
    group: 'To‘lqin jadvali', kind: 'wt', base: 120, span: 340,
    cut: [2400, 8000], q: 3, space: 0.5, sub: 0.34, morph: 0.5, morphSpeed: 0.4,
    tables: [PURE, FULL, METALLIC],
  },
  {
    id: 'w-neon', name: 'Jadval — neon', desc: 'Yorqin spektrlar orasida tez suzadi',
    group: 'To‘lqin jadvali', kind: 'wt', base: 150, span: 480,
    cut: [3000, 9000], q: 4, space: 0.44, sub: 0.24, morph: 1.4, morphSpeed: 0.5,
    tables: [BUZZ, GLASSY, THIN],
  },
  {
    id: 'w-deep', name: 'Jadval — chuqur', desc: 'Past va sekin, og‘ir harakat',
    group: 'To‘lqin jadvali', kind: 'wt', base: 62, span: 180,
    cut: [1200, 4600], q: 3, space: 0.46, sub: 0.6, morph: 0.22, morphSpeed: 0.3,
    tables: [PURE, HOLLOW, FULL],
  },
  {
    id: 'w-vocal', name: 'Jadval — ovoz', desc: 'Ovozga o‘xshash spektrlar oralig‘i',
    group: 'To‘lqin jadvali', kind: 'wt', base: 130, span: 260,
    cut: [2600, 6600], q: 5, space: 0.56, sub: 0.26, morph: 0.7, morphSpeed: 0.6,
    tables: [VOCAL, HOLLOW, GLASSY],
  },
  {
    id: 'w-glass', name: 'Jadval — shisha', desc: 'Yuqori, tiniq, sovuq suzish',
    group: 'To‘lqin jadvali', kind: 'wt', base: 260, span: 620,
    cut: [4400, 11000], q: 2, space: 0.66, morph: 0.9, morphSpeed: 0.45,
    tables: [GLASSY, THIN, PURE],
  },
  {
    id: 'w-metal', name: 'Jadval — metall', desc: 'Notekis spektrlar, po‘lat tusi',
    group: 'To‘lqin jadvali', kind: 'wt', base: 175, span: 420,
    cut: [3200, 9000], q: 6, space: 0.42, sub: 0.22, morph: 1.1, morphSpeed: 0.55,
    tables: [METALLIC, BUZZ, GLASSY],
  },
  {
    id: 'w-organ', name: 'Jadval — organ', desc: 'Toza va keng, cherkov tusi',
    group: 'To‘lqin jadvali', kind: 'wt', base: 110, span: 200,
    cut: [2200, 5600], q: 1, space: 0.74, sub: 0.3, morph: 0.3, morphSpeed: 0.35,
    tables: [ORGAN, HOLLOW, FULL],
  },
  {
    id: 'w-drive', name: 'Jadval — quvvat', desc: 'Tezlik suzishni oldinga suradi',
    group: 'To‘lqin jadvali', kind: 'wt', base: 100, span: 560,
    cut: [1800, 9000], q: 5, space: 0.36, sub: 0.44, morph: 0.4, morphSpeed: 0.9,
    tables: [PURE, FULL, BUZZ, METALLIC],
  },
  {
    id: 'w-ghost', name: 'Jadval — soya', desc: 'Sokin, ingichka, sekin o‘zgaradi',
    group: 'To‘lqin jadvali', kind: 'wt', base: 200, span: 260,
    cut: [2600, 6000], q: 2, space: 0.78, morph: 0.18, morphSpeed: 0.25,
    tables: [THIN, PURE, VOCAL],
  },
  {
    id: 'w-storm', name: 'Jadval — bo‘ron', desc: 'Eng notinch, doim o‘zgarib turadi',
    group: 'To‘lqin jadvali', kind: 'wt', base: 88, span: 400,
    cut: [1600, 8000], q: 7, space: 0.4, sub: 0.4, morph: 2.2, morphSpeed: 0.6,
    tables: [FULL, METALLIC, BUZZ, HOLLOW],
  },

  // ═══════════════════════════════════════════ Spektr
  {
    id: 'p-organ', name: 'Spektr — organ', desc: 'Oktava va beshliklar, boshqa hech narsa',
    group: 'Spektr', kind: 'spec', base: 116, span: 220,
    cut: [2400, 6000], q: 1, space: 0.62, sub: 0.34, wave: ORGAN, voices: 3, detune: 8,
  },
  {
    id: 'p-hollow', name: 'Spektr — ichi bo‘sh', desc: 'Faqat toq ohanglar, klarnetdek',
    group: 'Spektr', kind: 'spec', base: 140, span: 280,
    cut: [2600, 6400], q: 2, space: 0.48, sub: 0.28, wave: HOLLOW, voices: 3, detune: 10,
  },
  {
    id: 'p-vocal', name: 'Spektr — ovoz', desc: 'Formant zonalarida kuchli',
    group: 'Spektr', kind: 'spec', base: 124, span: 240,
    cut: [2800, 6200], q: 3, space: 0.6, sub: 0.26, wave: VOCAL, voices: 5, detune: 14,
  },
  {
    id: 'p-glass', name: 'Spektr — shisha', desc: 'Yuqori ohanglar ustun',
    group: 'Spektr', kind: 'spec', base: 230, span: 520,
    cut: [4400, 11000], q: 1, space: 0.68, wave: GLASSY, voices: 3, detune: 9,
  },
  {
    id: 'p-metal', name: 'Spektr — metall', desc: 'Tarqoq, notekis ohanglar',
    group: 'Spektr', kind: 'spec', base: 168, span: 400,
    cut: [3400, 9000], q: 4, space: 0.44, sub: 0.22, wave: METALLIC, voices: 5, detune: 18,
  },
  {
    id: 'p-buzz', name: 'Spektr — tishli', desc: 'Juda yorqin, hamma ohang kuchli',
    group: 'Spektr', kind: 'spec', base: 104, span: 360,
    cut: [1800, 8000], q: 6, space: 0.36, sub: 0.42, wave: BUZZ, voices: 7, detune: 24,
  },
  {
    id: 'p-thin', name: 'Spektr — ingichka', desc: 'Past ohanglar yo‘q — havoda osilgan',
    group: 'Spektr', kind: 'spec', base: 190, span: 340,
    cut: [3600, 9000], q: 2, space: 0.7, wave: THIN, voices: 5, detune: 16,
  },
  {
    id: 'p-pure', name: 'Spektr — sof', desc: 'Deyarli sinus, eng tinchi',
    group: 'Spektr', kind: 'spec', base: 132, span: 200,
    cut: [2000, 5000], q: 1, space: 0.72, sub: 0.4, wave: PURE, voices: 3, detune: 6,
  },
  {
    id: 'p-wide', name: 'Spektr — keng', desc: 'Yetti ovoz, kuchli tarqalgan',
    group: 'Spektr', kind: 'spec', base: 96, span: 300,
    cut: [1600, 7000], q: 4, space: 0.5, sub: 0.46, wave: FULL, voices: 7, detune: 30,
  },
  {
    id: 'p-low', name: 'Spektr — past', desc: 'Eng chuqur, deyarli faqat his',
    group: 'Spektr', kind: 'spec', base: 54, span: 140,
    cut: [900, 3400], q: 3, space: 0.5, sub: 0.7, wave: ORGAN, voices: 3, detune: 7,
  },
];

/* ──────────────────────────────────── Balandlikni tenglashtirish */

/**
 * O'lchangan RMS qiymatlari — avvalgi to'plamlardagi usul bilan.
 *
 * Bu yerda tarqalish katta bo'lishi kutilgan edi: FM chuqurligi va
 * spektrdagi ohanglar soni quvvatga to'g'ridan-to'g'ri ta'sir qiladi.
 */
const MEASURED: Record<string, number> = {
  'f-bell': 0.2469, 'f-epiano': 0.2388, 'f-brass': 0.2805, 'f-glass': 0.2803,
  'f-deep': 0.3185, 'f-wide': 0.3392, 'f-alien': 0.2906, 'f-motor': 0.3787,
  'f-choir': 0.2301, 'f-scream': 0.2784,
  'w-morph': 0.1707, 'w-neon': 0.1346, 'w-deep': 0.3032, 'w-vocal': 0.1592,
  'w-glass': 0.1184, 'w-metal': 0.1406, 'w-organ': 0.2228, 'w-drive': 0.2147,
  'w-ghost': 0.1559, 'w-storm': 0.2186,
  'p-organ': 0.1979, 'p-hollow': 0.2406, 'p-vocal': 0.1343, 'p-glass': 0.0864,
  'p-metal': 0.1308, 'p-buzz': 0.1923, 'p-thin': 0.0793, 'p-pure': 0.2076,
  'p-wide': 0.2122, 'p-low': 0.3014,
};

const TARGET = 0.22;

export const RECIPES_5: readonly Spectral[] = RAW.map((r) => {
  const m = MEASURED[r.id];
  const trim = m ? Math.min(Math.max(TARGET / m, 0.2), 6) : 1;
  return { ...r, trim };
});
