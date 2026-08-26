import type { BigRecipe } from './sound-engine-5';

/**
 * Qirqta katta ishora.
 *
 * To'rt guruh:
 *   Akustik bas    — chalingan va kamon bilan chalingan past torlar
 *   Katta echo     — juda keng xona, chapdan o'ngga sakraydigan aks
 *   Ko'tarilish    — balandlik yuqoriga suriladi ("wooooo" yuqoriga)
 *   Tushish        — balandlik pastga tushadi va og'ir dum qoldiradi
 *
 * Har bir retseptning O'Z XONASI bor: `room: [soniya, so'nish]`.
 * Avvalgi 196 tasi bir xil 2.6 soniyalik xonadan o'tgan edi va bu
 * ularni bir-biriga o'xshatib turgan sabablardan biri.
 */

/** Past qatorlar — bas uchun */
const BASS = [0, 3, 5, 7, 10, 12];
const BASS_MINOR = [0, 2, 3, 5, 7, 8, 10];
/** Ochiq, keng — katta fazo uchun */
const WIDE = [0, 7, 12, 19, 24];
const AIRY = [0, 2, 7, 9, 14];

/** Chalingan bas ohanglari: asosiysi kuchli, yuqorilari kamayadi */
const PLUCK = [1, 0.45, 0.28, 0.16, 0.1, 0.06];
/** Yumshoqroq, ichi to'la */
const ROUND = [1, 0.3, 0.12, 0.06];
/** Toza, deyarli sinus */
const DEEP = [1, 0.18, 0.05];

const RAW: readonly BigRecipe[] = [
  // ═══════════════════════════════════════════ Akustik bas
  {
    id: 'b-upright', name: 'Bas — chalingan', desc: 'Barmoq zarbasi bilan, yog‘ochdek iliq',
    group: 'Akustik bas', every: 190, len: 1.6, attack: 0.004,
    base: 55, scale: BASS, voice: 'pluck', partials: PLUCK,
    cut: [3200, 600], q: 1, room: [2.2, 2.6], space: 0.34, sub: 0.2,
  },
  {
    id: 'b-deep', name: 'Bas — chuqur', desc: 'Eng past, uzoq so‘nadi',
    group: 'Akustik bas', every: 230, len: 2.4, attack: 0.004,
    base: 41, scale: BASS_MINOR, voice: 'pluck', partials: DEEP,
    cut: [2000, 340], q: 1, room: [2.8, 2.2], space: 0.3, sub: 0.3,
  },
  {
    id: 'b-round', name: 'Bas — yumaloq', desc: 'Yumshoq, ichi to‘la, kam ohangli',
    group: 'Akustik bas', every: 200, len: 1.8, attack: 0.006,
    base: 62, scale: BASS, voice: 'pluck', partials: ROUND,
    cut: [2400, 480], q: 1, room: [2.4, 2.4], space: 0.36, sub: 0.22,
  },
  {
    id: 'b-bow', name: 'Bas — kamon', desc: 'Sekin kiradi, titroq bilan',
    group: 'Akustik bas', every: 260, len: 2.6, attack: 0.35,
    base: 55, scale: BASS_MINOR, voice: 'bowed', voices: 3, detune: 9,
    cut: [900, 2600], q: 2, room: [3.2, 2], space: 0.46, sub: 0.24,
  },
  {
    id: 'b-bow-low', name: 'Bas — kamon, past', desc: 'Og‘ir, kinodagi kirish',
    group: 'Akustik bas', every: 300, len: 3.2, attack: 0.4,
    base: 38, scale: BASS_MINOR, voice: 'bowed', voices: 3, detune: 7,
    cut: [600, 1800], q: 2, room: [3.6, 1.9], space: 0.5, sub: 0.36,
  },
  {
    id: 'b-slap', name: 'Bas — qattiq', desc: 'Keskin zarba, qisqa dum',
    group: 'Akustik bas', every: 160, len: 0.9, attack: 0.003,
    base: 65, scale: BASS, voice: 'pluck', partials: PLUCK,
    cut: [4600, 900], q: 2, room: [1.4, 3], space: 0.26, sub: 0.24,
  },
  {
    id: 'b-warm', name: 'Bas — iliq', desc: 'Yumshoq zarba, keng xona',
    group: 'Akustik bas', every: 210, len: 2, attack: 0.01,
    base: 49, scale: BASS, voice: 'pluck', partials: ROUND,
    cut: [1800, 420], q: 1, room: [3, 2.1], space: 0.44, sub: 0.26,
  },
  {
    id: 'b-echo', name: 'Bas — aks bilan', desc: 'Har zarba chapdan o‘ngga qaytadi',
    group: 'Akustik bas', every: 240, len: 1.8, attack: 0.005,
    base: 58, scale: BASS, voice: 'pluck', partials: PLUCK,
    cut: [2800, 520], q: 1, room: [2.6, 2.3], space: 0.34,
    echo: { time: 0.34, feedback: 0.52, mix: 0.3 }, sub: 0.2,
  },
  {
    id: 'b-sub', name: 'Bas — faqat his', desc: 'Deyarli eshitilmaydi, faqat bosim',
    group: 'Akustik bas', every: 280, len: 2.8, attack: 0.02,
    base: 33, scale: [0, 5, 7], voice: 'sine', partials: [1, 0.1],
    cut: [420, 180], q: 1, room: [2.6, 2.4], space: 0.3, sub: 0.4,
  },
  {
    id: 'b-duo', name: 'Bas — juft', desc: 'Chalingan bas, keng stereo',
    group: 'Akustik bas', every: 200, len: 2.2, attack: 0.005,
    base: 46, scale: BASS_MINOR, voice: 'pluck', partials: PLUCK,
    cut: [2200, 400], q: 1, room: [3.4, 2], space: 0.5, sub: 0.28,
  },

  // ═══════════════════════════════════════════ Katta echo
  {
    id: 'e-cathedral', name: 'Echo — ulkan xona', desc: 'Olti soniyalik dum',
    group: 'Katta echo', every: 300, len: 2.6, attack: 0.25,
    base: 165, scale: WIDE, voice: 'sine', partials: [1, 0.5, 0.25, 0.12],
    cut: [1800, 3600], q: 1, room: [6, 1.4], space: 0.8, sub: 0.2,
  },
  {
    id: 'e-pingpong', name: 'Echo — sakrash', desc: 'Chapdan o‘ngga sakrab ketadi',
    group: 'Katta echo', every: 220, len: 1.4, attack: 0.02,
    base: 330, scale: AIRY, voice: 'sine', partials: [1, 0.3, 0.14],
    cut: [4000, 2000], q: 1, room: [3.4, 2],
    space: 0.5, echo: { time: 0.26, feedback: 0.62, mix: 0.42 },
  },
  {
    id: 'e-canyon', name: 'Echo — vodiy', desc: 'Uzoq va sekin qaytadi',
    group: 'Katta echo', every: 320, len: 2.2, attack: 0.06,
    base: 220, scale: WIDE, voice: 'saw', voices: 3, detune: 14,
    cut: [2600, 900], q: 2, room: [5, 1.6],
    space: 0.66, echo: { time: 0.62, feedback: 0.58, mix: 0.36 }, sub: 0.18,
  },
  {
    id: 'e-plate', name: 'Echo — metall plita', desc: 'Yorqin, tez, metallga xos',
    group: 'Katta echo', every: 200, len: 1.2, attack: 0.01,
    base: 440, scale: AIRY, voice: 'sine', partials: [1, 0.4, 0.3, 0.2, 0.12],
    cut: [6000, 3000], q: 1, room: [2.2, 3.4], space: 0.62,
    echo: { time: 0.14, feedback: 0.5, mix: 0.3 },
  },
  {
    id: 'e-void', name: 'Echo — bo‘shliq', desc: 'Juda uzoq, deyarli cheksiz',
    group: 'Katta echo', every: 360, len: 3.4, attack: 0.4,
    base: 130, scale: WIDE, voice: 'sine', partials: [1, 0.35, 0.16, 0.08],
    cut: [1200, 2800], q: 1, room: [8, 1.1], space: 0.86, sub: 0.24,
  },
  {
    id: 'e-choir', name: 'Echo — xor', desc: 'Ovozga o‘xshash, keng va yumshoq',
    group: 'Katta echo', every: 300, len: 3, attack: 0.3,
    base: 196, scale: AIRY, voice: 'bowed', voices: 5, detune: 16,
    cut: [1600, 3200], q: 1, room: [5.5, 1.5], space: 0.74, sub: 0.16,
  },
  {
    id: 'e-drift', name: 'Echo — suzuvchi', desc: 'Shovqin, uzoq xona',
    group: 'Katta echo', every: 280, len: 2.4, attack: 0.3,
    base: 260, scale: AIRY, voice: 'noise',
    cut: [3400, 1200], q: 1, room: [5, 1.6], space: 0.7,
  },
  {
    id: 'e-tunnel', name: 'Echo — tunnel', desc: 'Qisqa aks, zich va yopiq',
    group: 'Katta echo', every: 190, len: 1.1, attack: 0.01,
    base: 300, scale: AIRY, voice: 'saw', voices: 3, detune: 10,
    cut: [3000, 1000], q: 3, room: [1.8, 3.2],
    space: 0.44, echo: { time: 0.09, feedback: 0.66, mix: 0.4 }, sub: 0.2,
  },
  {
    id: 'e-glass-room', name: 'Echo — shisha zal', desc: 'Yuqori, tiniq, uzoq',
    group: 'Katta echo', every: 240, len: 2, attack: 0.02,
    base: 620, scale: AIRY, voice: 'sine', partials: [1, 0.2, 0.35, 0.12, 0.2],
    cut: [8000, 4000], q: 1, room: [4.4, 1.8], space: 0.78,
    echo: { time: 0.4, feedback: 0.5, mix: 0.28 },
  },
  {
    id: 'e-deep-room', name: 'Echo — chuqur zal', desc: 'Past va ulkan',
    group: 'Katta echo', every: 340, len: 3, attack: 0.2,
    base: 98, scale: WIDE, voice: 'saw', voices: 5, detune: 12,
    cut: [900, 2200], q: 2, room: [6.5, 1.3], space: 0.72, sub: 0.34,
  },

  // ═══════════════════════════════════════════ Ko'tarilish
  {
    id: 'r-rise', name: 'Ko‘tarilish — asosiy', desc: 'Pastdan yuqoriga suriladi',
    group: 'Ko‘tarilish', every: 300, len: 2.2, attack: 0.45,
    base: 110, scale: WIDE, voice: 'saw', voices: 5, detune: 20, glide: [0.5, 3],
    cut: [700, 6000], q: 3, room: [4, 1.8], space: 0.6, sub: 0.24,
  },
  {
    id: 'r-long', name: 'Ko‘tarilish — uzun', desc: 'To‘rt soniya, sekin va bosimli',
    group: 'Ko‘tarilish', every: 420, len: 4, attack: 0.55,
    base: 82, scale: WIDE, voice: 'saw', voices: 7, detune: 26, glide: [0.4, 4],
    cut: [500, 7000], q: 4, room: [5.5, 1.5], space: 0.66, sub: 0.3,
  },
  {
    id: 'r-air', name: 'Ko‘tarilish — havo', desc: 'Faqat shovqin, yuqoriga',
    group: 'Ko‘tarilish', every: 280, len: 2, attack: 0.5,
    base: 300, scale: AIRY, voice: 'noise', glide: [0.4, 3.4],
    cut: [1400, 9000], q: 1, room: [3.6, 2], space: 0.6,
  },
  {
    id: 'r-choir', name: 'Ko‘tarilish — ovoz', desc: 'Xor yuqoriga ko‘tariladi',
    group: 'Ko‘tarilish', every: 340, len: 3, attack: 0.5,
    base: 147, scale: AIRY, voice: 'bowed', voices: 5, detune: 18, glide: [0.7, 2.2],
    cut: [1200, 4400], q: 2, room: [5, 1.6], space: 0.7, sub: 0.18,
  },
  {
    id: 'r-glass', name: 'Ko‘tarilish — shisha', desc: 'Yuqori va tiniq, sovuq',
    group: 'Ko‘tarilish', every: 240, len: 1.6, attack: 0.4,
    base: 440, scale: AIRY, voice: 'sine', partials: [1, 0.3, 0.4, 0.15, 0.2],
    glide: [0.8, 2.6], cut: [3000, 10000], q: 1, room: [3.4, 2.2], space: 0.66,
  },
  {
    id: 'r-siren', name: 'Ko‘tarilish — sirena', desc: 'Tor va o‘tkir',
    group: 'Ko‘tarilish', every: 260, len: 1.8, attack: 0.3,
    base: 260, scale: [0, 12], voice: 'saw', voices: 3, detune: 8, glide: [0.6, 3.2],
    cut: [1600, 8000], q: 8, room: [3, 2.4], space: 0.5,
  },
  {
    id: 'r-echo-rise', name: 'Ko‘tarilish — aksli', desc: 'Ko‘tariladi va aks qaytaradi',
    group: 'Ko‘tarilish', every: 300, len: 2, attack: 0.4,
    base: 175, scale: WIDE, voice: 'saw', voices: 5, detune: 16, glide: [0.6, 2.8],
    cut: [1000, 6000], q: 3, room: [3.8, 2],
    space: 0.54, echo: { time: 0.3, feedback: 0.56, mix: 0.32 }, sub: 0.2,
  },
  {
    id: 'r-sub-rise', name: 'Ko‘tarilish — pastdan', desc: 'Sub bosimi bilan boshlanadi',
    group: 'Ko‘tarilish', every: 380, len: 3.4, attack: 0.55,
    base: 55, scale: BASS_MINOR, voice: 'saw', voices: 7, detune: 22, glide: [0.5, 5],
    cut: [300, 5000], q: 5, room: [5, 1.6], space: 0.58, sub: 0.42,
  },
  {
    id: 'r-soft-rise', name: 'Ko‘tarilish — yumshoq', desc: 'Sekin va tinch, bosimsiz',
    group: 'Ko‘tarilish', every: 320, len: 2.8, attack: 0.6,
    base: 196, scale: AIRY, voice: 'sine', partials: [1, 0.4, 0.18, 0.08],
    glide: [0.8, 1.9], cut: [1400, 4000], q: 1, room: [4.6, 1.7], space: 0.72,
  },
  {
    id: 'r-huge', name: 'Ko‘tarilish — ulkan', desc: 'Eng katta: uzun, past, keng',
    group: 'Ko‘tarilish', every: 460, len: 4.5, attack: 0.6,
    base: 65, scale: WIDE, voice: 'saw', voices: 7, detune: 30, glide: [0.45, 4.5],
    cut: [380, 8000], q: 5, room: [7, 1.3], space: 0.7, sub: 0.4,
  },

  // ═══════════════════════════════════════════ Tushish
  {
    id: 'd-fall', name: 'Tushish — asosiy', desc: 'Yuqoridan pastga sirg‘aladi',
    group: 'Tushish', every: 280, len: 2, attack: 0.02,
    base: 300, scale: WIDE, voice: 'saw', voices: 5, detune: 18, glide: [2.6, 0.4],
    cut: [6000, 700], q: 3, room: [4, 1.8], space: 0.6, sub: 0.26,
  },
  {
    id: 'd-impact', name: 'Tushish — zarba', desc: 'Keskin urilish va og‘ir dum',
    group: 'Tushish', every: 320, len: 2.6, attack: 0.004,
    base: 82, scale: BASS_MINOR, voice: 'pluck', partials: [1, 0.3, 0.14, 0.07],
    glide: [1.6, 0.55], cut: [5000, 400], q: 2, room: [5, 1.5], space: 0.62, sub: 0.4,
  },
  {
    id: 'd-braam', name: 'Tushish — braaam', desc: 'Kinodagi og‘ir mis tovushi',
    group: 'Tushish', every: 400, len: 3.2, attack: 0.06,
    base: 73, scale: BASS_MINOR, voice: 'saw', voices: 7, detune: 24, glide: [1.25, 0.9],
    cut: [2600, 500], q: 4, room: [5.5, 1.5], space: 0.6, sub: 0.44,
  },
  {
    id: 'd-drop', name: 'Tushish — chuqurlikka', desc: 'Uzoq va pastga',
    group: 'Tushish', every: 360, len: 3.4, attack: 0.03,
    base: 220, scale: WIDE, voice: 'sine', partials: [1, 0.35, 0.15],
    glide: [3, 0.25], cut: [5000, 300], q: 2, room: [6, 1.4], space: 0.7, sub: 0.3,
  },
  {
    id: 'd-air-fall', name: 'Tushish — havo', desc: 'Shuvillash pastga ketadi',
    group: 'Tushish', every: 260, len: 1.8, attack: 0.05,
    base: 400, scale: AIRY, voice: 'noise', glide: [3, 0.4],
    cut: [8000, 900], q: 1, room: [3.6, 2], space: 0.6,
  },
  {
    id: 'd-echo-fall', name: 'Tushish — aksli', desc: 'Tushadi va aks qaytadi',
    group: 'Tushish', every: 300, len: 2, attack: 0.02,
    base: 330, scale: AIRY, voice: 'sine', partials: [1, 0.3, 0.12],
    glide: [2.4, 0.5], cut: [6000, 1000], q: 2, room: [4, 1.9],
    space: 0.56, echo: { time: 0.36, feedback: 0.58, mix: 0.36 },
  },
  {
    id: 'd-bell-fall', name: 'Tushish — qo‘ng‘iroq', desc: 'Metall tovush pastga oqadi',
    group: 'Tushish', every: 280, len: 2.6, attack: 0.005,
    base: 520, scale: AIRY, voice: 'sine', partials: [1, 0.2, 0.45, 0.1, 0.3, 0.08],
    glide: [1.8, 0.6], cut: [9000, 1400], q: 1, room: [4.6, 1.7], space: 0.72,
  },
  {
    id: 'd-slow', name: 'Tushish — sekin', desc: 'Juda sekin, tinch tushish',
    group: 'Tushish', every: 380, len: 4, attack: 0.25,
    base: 175, scale: WIDE, voice: 'bowed', voices: 3, detune: 12, glide: [1.5, 0.6],
    cut: [3000, 800], q: 2, room: [6, 1.4], space: 0.72, sub: 0.24,
  },
  {
    id: 'd-sub-drop', name: 'Tushish — sub', desc: 'Eng pastga, faqat bosim qoladi',
    group: 'Tushish', every: 420, len: 3.6, attack: 0.02,
    base: 110, scale: [0, 3, 7], voice: 'sine', partials: [1, 0.15, 0.06],
    glide: [2, 0.3], cut: [1600, 200], q: 1, room: [4.4, 1.8], space: 0.5, sub: 0.5,
  },
  {
    id: 'd-huge-fall', name: 'Tushish — ulkan', desc: 'Eng katta tushish, uzun dum',
    group: 'Tushish', every: 460, len: 4.5, attack: 0.04,
    base: 130, scale: WIDE, voice: 'saw', voices: 7, detune: 28, glide: [2.8, 0.35],
    cut: [7000, 320], q: 4, room: [7.5, 1.2], space: 0.74, sub: 0.44,
  },
];

/* ──────────────────────────────────── Balandlikni tenglashtirish */

/**
 * O'lchangan CHO'QQI qiymatlari.
 *
 * Bu yerda ham cho'qqi bo'yicha tenglashtiriladi, `sound-recipes-4.ts`
 * dagi kabi: ishoralar orasida jimlik bor va uning ulushi retseptga
 * qarab juda farq qiladi.
 */
const MEASURED: Record<string, number> = {
  'b-upright': 1.5983, 'b-deep': 1.4719, 'b-round': 1.6486, 'b-bow': 1.0962,
  'b-bow-low': 1.4863, 'b-slap': 1.5947, 'b-warm': 1.7465, 'b-echo': 1.7773,
  'b-sub': 2.1681, 'b-duo': 1.8962,
  'e-cathedral': 3.7844, 'e-pingpong': 2.9472, 'e-canyon': 1.0192, 'e-plate': 3.2693,
  'e-void': 4.0688, 'e-choir': 1.2348, 'e-drift': 1.4458, 'e-tunnel': 1.2325,
  'e-glass-room': 3.2856, 'e-deep-room': 1.207,
  'r-rise': 1.4694, 'r-long': 1.8192, 'r-air': 1.7362, 'r-choir': 1.5313,
  'r-glass': 4.5836, 'r-siren': 1.4057, 'r-echo-rise': 1.5044, 'r-sub-rise': 1.9236,
  'r-soft-rise': 5.3869, 'r-huge': 2.2203,
  'd-fall': 1.1165, 'd-impact': 1.8096, 'd-braam': 1.2072, 'd-drop': 3.6929,
  'd-air-fall': 1.4059, 'd-echo-fall': 3.0918, 'd-bell-fall': 3.3713, 'd-slow': 1.3878,
  'd-sub-drop': 2.6248, 'd-huge-fall': 1.865,
};

/**
 * Nishon cho'qqi.
 *
 * Bu to'plamda tuzatish kuchli: xom cho'qqilar birdan besh yarimgacha
 * chiqdi. Sabab ishoralarning USTMA-UST tushishida — ular uzun, va
 * keyingisi oldingisi tugamasdan boshlanadi. Bu ataylab shunday, katta
 * fazo tuyg'usi shundan; balandlikni esa tuzatish hal qiladi.
 */
const TARGET = 0.3;

export const RECIPES_6: readonly BigRecipe[] = RAW.map((r) => {
  const m = MEASURED[r.id];
  const trim = m ? Math.min(Math.max(TARGET / m, 0.04), 5) : 1;
  return { ...r, trim };
});
