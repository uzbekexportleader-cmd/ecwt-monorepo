import type { ShotRecipe } from './sound-engine-3';

/**
 * Yigirmata alohida tovush.
 *
 * Avvalgi 146 tasidan farqi tamoyilda: bular fon emas, JAVOB. Har
 * necha piksel harakatda bitta qisqa tovush chiqadi va u qatordagi
 * notaga tushiriladi — shuning uchun sichqoncha yurishi shovqin emas,
 * ohangga o'xshaydi.
 *
 * To'rt guruh:
 *   Interfeys      — qimmat qurilma tugmasi bosilgandek
 *   Havo va bosim  — gidravlika, havo chiqishi, shuvillash
 *   Kino           — sci-fi: skaner, portal, zaryad
 *   Yumshoq        — deyarli sezilmaydigan, kunlik foydalanish uchun
 */

/** Pentatonik — hech qachon falshi eshitilmaydi */
const PENTA = [0, 3, 5, 7, 10];
/** Kengaytirilgan, ikki oktava */
const PENTA2 = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22];
/** Ochiq, "kosmik" tus */
const AIRY = [0, 2, 7, 9, 14, 16];
/** Minor — jiddiyroq */
const MINOR = [0, 2, 3, 7, 8, 10, 12];

const RAW: readonly ShotRecipe[] = [
  // ═══════════════════════════════════════════ Interfeys
  {
    id: 's-tap', name: 'Interfeys — teginish', desc: 'Qisqa, toza, qimmat qurilma tugmasidek',
    group: 'Interfeys', every: 155, base: 660, scale: PENTA2, space: 0.34, spread: 0.5,
    click: { level: 0.5, freq: 2600, q: 1.2, decay: 0.012 },
    partials: [[1, 0.3], [2.01, 0.1]], decay: 0.16,
  },
  {
    id: 's-glass-tap', name: 'Interfeys — shisha', desc: 'Yuqori, tiniq, mo‘rt',
    group: 'Interfeys', every: 135, base: 990, scale: PENTA2, space: 0.44, spread: 0.6,
    click: { level: 0.34, freq: 5200, q: 1.6, decay: 0.008 },
    partials: [[1, 0.26], [2.76, 0.09], [5.4, 0.04]], decay: 0.3,
  },
  {
    id: 's-key', name: 'Interfeys — tugma', desc: 'Past zarba bilan, qattiq va aniq',
    group: 'Interfeys', every: 170, base: 440, scale: PENTA, space: 0.24, spread: 0.4,
    click: { level: 0.44, freq: 1900, q: 1, decay: 0.014 },
    partials: [[1, 0.24], [1.5, 0.08]], decay: 0.12,
    thump: { level: 0.3, freq: 92, decay: 0.09 },
  },
  {
    id: 's-metal-tap', name: 'Interfeys — metall', desc: 'Nomutanosib ohanglar, po‘lat tusi',
    group: 'Interfeys', every: 160, base: 520, scale: PENTA2, space: 0.42, spread: 0.55,
    click: { level: 0.36, freq: 3800, q: 1.4, decay: 0.01 },
    partials: [[1, 0.24], [2.76, 0.12], [5.4, 0.05], [8.93, 0.02]], decay: 0.42,
  },
  {
    id: 's-blip', name: 'Interfeys — signal', desc: 'Elektron, sof, ohangdor',
    group: 'Interfeys', every: 145, base: 740, scale: PENTA2, space: 0.36, spread: 0.6,
    partials: [[1, 0.32], [2, 0.08]], decay: 0.1, type: 'triangle',
    click: { level: 0.16, freq: 4200, q: 2, decay: 0.005 },
  },

  // ═══════════════════════════════════════════ Havo va bosim
  {
    id: 's-hiss', name: 'Havo — chiqish', desc: 'Bosim chiqadi, qisqa shuvillash',
    group: 'Havo va bosim', every: 205, base: 300, scale: PENTA, space: 0.4, spread: 0.6,
    air: { level: 0.4, from: 900, to: 4200, q: 1.1, decay: 0.2 },
    partials: [[1, 0.08]], decay: 0.12,
  },
  {
    id: 's-hydraulic', name: 'Havo — gidravlika', desc: 'Og‘ir, bosimli, pastdan',
    group: 'Havo va bosim', every: 240, base: 180, scale: MINOR, space: 0.34, spread: 0.4,
    air: { level: 0.34, from: 2200, to: 460, q: 1.4, decay: 0.3 },
    partials: [[1, 0.14], [1.5, 0.05]], decay: 0.22,
    thump: { level: 0.26, freq: 70, decay: 0.16 },
  },
  {
    id: 's-whoosh', name: 'Havo — shuvillash', desc: 'Yon tomondan o‘tib ketadi',
    group: 'Havo va bosim', every: 220, base: 260, scale: AIRY, space: 0.52, spread: 0.85,
    air: { level: 0.42, from: 500, to: 6000, q: 0.7, decay: 0.34 },
    decay: 0.2,
  },
  {
    id: 's-valve', name: 'Havo — klapan', desc: 'Juda qisqa, quruq, mexanik',
    group: 'Havo va bosim', every: 180, base: 420, scale: PENTA, space: 0.22, spread: 0.45,
    click: { level: 0.42, freq: 3200, q: 2.4, decay: 0.02 },
    air: { level: 0.2, from: 3000, to: 1200, q: 2, decay: 0.09 },
    partials: [[1, 0.1]], decay: 0.07,
  },
  {
    id: 's-steam', name: 'Havo — bug‘', desc: 'Uzunroq, yumshoq, keng',
    group: 'Havo va bosim', every: 255, base: 220, scale: AIRY, space: 0.62, spread: 0.8,
    air: { level: 0.3, from: 1400, to: 3600, q: 0.6, decay: 0.5 },
    partials: [[1, 0.07], [2, 0.03]], decay: 0.3,
  },

  // ═══════════════════════════════════════════ Kino
  {
    id: 's-scan', name: 'Kino — skaner', desc: 'Yuqoriga sirpanadi, o‘tkir',
    group: 'Kino', every: 185, base: 380, scale: PENTA2, space: 0.5, spread: 0.7,
    partials: [[1, 0.26], [2, 0.08]], sweep: [1, 3.2], decay: 0.24, type: 'sawtooth',
    click: { level: 0.2, freq: 3400, q: 2, decay: 0.006 },
  },
  {
    id: 's-charge', name: 'Kino — zaryad', desc: 'Yig‘iladi va tugaydi',
    group: 'Kino', every: 270, base: 210, scale: MINOR, space: 0.46, spread: 0.6,
    partials: [[1, 0.26], [1.5, 0.1]], sweep: [0.55, 1.8], decay: 0.42, type: 'sawtooth',
    thump: { level: 0.2, freq: 64, decay: 0.2 },
  },
  {
    id: 's-portal', name: 'Kino — portal', desc: 'Pastga tushadi, chuqur aks',
    group: 'Kino', every: 255, base: 520, scale: AIRY, space: 0.7, spread: 0.75,
    partials: [[1, 0.24], [2.01, 0.08]], sweep: [2.4, 0.6], decay: 0.5,
    air: { level: 0.16, from: 4000, to: 800, q: 1.2, decay: 0.4 },
  },
  {
    id: 's-laser', name: 'Kino — nur', desc: 'Juda qisqa, keskin, yuqori',
    group: 'Kino', every: 170, base: 880, scale: PENTA2, space: 0.4, spread: 0.8,
    partials: [[1, 0.3]], sweep: [1.6, 0.4], decay: 0.1, type: 'square',
    click: { level: 0.24, freq: 6000, q: 2.4, decay: 0.005 },
  },
  {
    id: 's-impact', name: 'Kino — zarba', desc: 'Og‘ir, past, kinodagi urg‘u',
    group: 'Kino', every: 325, base: 130, scale: MINOR, space: 0.62, spread: 0.35,
    click: { level: 0.3, freq: 1400, q: 0.9, decay: 0.03 },
    partials: [[1, 0.2], [2.76, 0.06]], decay: 0.6,
    thump: { level: 0.42, freq: 52, decay: 0.34 },
  },

  // ═══════════════════════════════════════════ Yumshoq
  {
    id: 's-soft', name: 'Yumshoq — tomchi', desc: 'Kichkina, tinch, xalaqit bermaydi',
    group: 'Yumshoq', every: 185, base: 590, scale: PENTA2, space: 0.5, spread: 0.5,
    partials: [[1, 0.2], [2, 0.05]], decay: 0.22,
  },
  {
    id: 's-wood', name: 'Yumshoq — yog‘och', desc: 'Iliq, quruq, mayin',
    group: 'Yumshoq', every: 180, base: 330, scale: PENTA, space: 0.3, spread: 0.45,
    click: { level: 0.22, freq: 1500, q: 1.1, decay: 0.016 },
    partials: [[1, 0.2], [3.1, 0.05]], decay: 0.16, type: 'triangle',
  },
  {
    id: 's-breath', name: 'Yumshoq — nafas', desc: 'Deyarli faqat havo',
    group: 'Yumshoq', every: 220, base: 400, scale: AIRY, space: 0.58, spread: 0.7,
    air: { level: 0.2, from: 1800, to: 3000, q: 0.9, decay: 0.26 },
    partials: [[1, 0.06]], decay: 0.2,
  },
  {
    id: 's-chime', name: 'Yumshoq — qo‘ng‘iroqcha', desc: 'Uzoq yangraydi, keng fazo',
    group: 'Yumshoq', every: 240, base: 780, scale: AIRY, space: 0.72, spread: 0.65,
    partials: [[1, 0.2], [2, 0.06], [3, 0.03]], decay: 0.9,
    click: { level: 0.1, freq: 5000, q: 2, decay: 0.004 },
  },
  {
    id: 's-pad', name: 'Yumshoq — bulut', desc: 'Eng tinchi, ustma-ust qo‘shiladi',
    group: 'Yumshoq', every: 205, base: 300, scale: AIRY, space: 0.78, spread: 0.7,
    partials: [[1, 0.16], [1.5, 0.06], [2, 0.04]], decay: 1.1, type: 'triangle',
  },
];

/* ──────────────────────────────────── Balandlikni tenglashtirish */

/**
 * O'lchangan CHO'QQI qiymatlari.
 *
 * Uzluksiz ovozlar o'rtacha quvvat (RMS) bo'yicha tenglashtirilgan
 * edi. Bu yerda u ishlamaydi: tovushlar orasida jimlik bor va uning
 * ulushi retseptga qarab 0.03 dan 0.68 gacha farq qiladi. O'rtachaga
 * qarab tenglashtirilsa, siyrak tovushlar haddan tashqari
 * kuchaytirilib yuborilardi.
 *
 * Quloq esa bunday tovushlarni cho'qqi bo'yicha baholaydi — bitta
 * "tiq" qanchalik baland eshitilgani muhim, jimlik emas. Shuning
 * uchun har biri konvert (envelope) cho'qqisi bo'yicha o'lchandi,
 * ikki tezlikda (0.7 va 1.0), kattasi olindi.
 */
const MEASURED: Record<string, number> = {
  's-tap': 0.3661, 's-glass-tap': 0.3787, 's-key': 0.5103, 's-metal-tap': 0.4689,
  's-blip': 0.2997,
  's-hiss': 0.2142, 's-hydraulic': 0.4017, 's-whoosh': 0.2217, 's-valve': 0.1677,
  's-steam': 0.2339,
  's-scan': 0.2873, 's-charge': 0.4573, 's-portal': 0.3803, 's-laser': 0.3037,
  's-impact': 0.6363,
  's-soft': 0.2208, 's-wood': 0.1957, 's-breath': 0.122, 's-chime': 0.3316,
  's-pad': 0.3004,
};

/** Hamma tovush shu cho'qqiga keltiriladi */
const TARGET = 0.3;

export const RECIPES_4: readonly ShotRecipe[] = RAW.map((r) => {
  const m = MEASURED[r.id];
  const trim = m ? Math.min(Math.max(TARGET / m, 0.3), 3) : 1;
  return { ...r, trim };
});
