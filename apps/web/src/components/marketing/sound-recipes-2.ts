import type { Recipe } from './sound-engine';

/**
 * Ikkinchi qirqtalik — "neon + kosmik + elektromobil".
 *
 * Nega yana qirqta: birinchi to'plamda hamma ovoz bir xil qoliptan
 * chiqqan edi — sub, supersaw, havo, reverb. Ular boy, lekin QOTIB
 * turadi: ichida harakat yo'q. Elektromobil yurganda esa tovush
 * doim o'zgaradi.
 *
 * Shuning uchun dvigatelga to'rtta yangi imkoniyat qo'shildi va bu
 * yerdagilarning deyarli hammasi ulardan foydalanadi:
 *
 *   whine — motorning ingichka chiyillashi. Faqat harakatda paydo
 *           bo'ladi va tezlik bilan yuqoriga chiqadi. Elektromobilni
 *           benzin mashinadan ayirib turadigan asosiy tovush shu.
 *   lfo   — filtrni tebratadi. Ovoz "nafas oladi", neon tusi shundan.
 *   echo  — aks-sado. Reverb fazo bersa, aks-sado ritm beradi:
 *           tovush uzoq devordan qaytib keladi.
 *   fm    — metall tus. Sof generator iliq eshitiladi, FM esa uni
 *           po'latga o'xshatadi.
 *
 * Balandliklar oxirida o'lchov bo'yicha tenglashtiriladi —
 * `sound-recipes.ts` dagi kabi.
 */

const L = (
  type: OscillatorType,
  ratio: number,
  voices: number,
  detune: number,
  level: number,
) => ({ type, ratio, voices, detune, level });

const RAW: readonly Recipe[] = [
  // ═══════════════════════════════════════════ Neon shahar
  // Kechqurun, ho'l asfalt, vitrinalar aksi. Aks-sado va tebranish.
  {
    id: 'n2-boulevard', name: 'Neon — xiyobon', desc: 'Aks-sadoli keng lenta, sekin tebranish',
    group: 'Neon shahar', base: 116, span: 420, cut: [520, 3600], q: 5, filter: 'lowpass',
    sub: 0.42, air: 0.06, space: 0.42,
    lfo: { rate: 0.7, depth: 620, track: 3 },
    echo: { time: 0.34, feedback: 0.45, mix: 0.22 },
    whine: { from: 700, to: 2600, level: 0.07 },
    layers: [L('sawtooth', 1, 5, 18, 0.44), L('sawtooth', 2, 3, 24, 0.16)],
  },
  {
    id: 'n2-rain', name: 'Neon — yomg‘irdan keyin', desc: 'Yumshoq, nam, uzoq aks',
    group: 'Neon shahar', base: 98, span: 300, cut: [380, 2400], q: 3, filter: 'lowpass',
    sub: 0.5, air: 0.1, space: 0.56,
    lfo: { rate: 0.45, depth: 380, track: 2 },
    echo: { time: 0.46, feedback: 0.55, mix: 0.26 },
    whine: { from: 520, to: 1800, level: 0.05 },
    layers: [L('triangle', 1, 5, 14, 0.5), L('sawtooth', 2, 3, 20, 0.12)],
  },
  {
    id: 'n2-signal', name: 'Neon — reklama', desc: 'Tez pulsatsiya, o‘tkir chekka',
    group: 'Neon shahar', base: 150, span: 560, cut: [700, 5200], q: 9, filter: 'lowpass',
    sub: 0.34, air: 0.08, space: 0.3,
    lfo: { rate: 3.6, depth: 900, track: 4 },
    echo: { time: 0.22, feedback: 0.4, mix: 0.2 },
    whine: { from: 900, to: 3400, level: 0.08 },
    layers: [L('square', 1, 3, 12, 0.3), L('sawtooth', 1.5, 4, 22, 0.22)],
  },
  {
    id: 'n2-underpass', name: 'Neon — yer osti', desc: 'Beton aks-sado, past va tor',
    group: 'Neon shahar', base: 74, span: 260, cut: [260, 1900], q: 7, filter: 'lowpass',
    sub: 0.62, air: 0.05, space: 0.34,
    lfo: { rate: 0.9, depth: 300, track: 2 },
    echo: { time: 0.28, feedback: 0.62, mix: 0.3 },
    whine: { from: 420, to: 1500, level: 0.06 },
    layers: [L('sawtooth', 1, 5, 16, 0.46), L('triangle', 2, 2, 10, 0.14)],
  },
  {
    id: 'n2-tram', name: 'Neon — tramvay', desc: 'Metall g‘ildirak, elektr chiyillashi',
    group: 'Neon shahar', base: 132, span: 480, cut: [600, 4600], q: 10, filter: 'lowpass',
    sub: 0.36, air: 0.12, space: 0.28,
    fm: { ratio: 2.4, depth: 0.35 },
    lfo: { rate: 1.8, depth: 700, track: 5 },
    whine: { from: 1100, to: 4200, level: 0.09 },
    layers: [L('sawtooth', 1, 5, 24, 0.38), L('square', 3, 2, 14, 0.1)],
  },
  {
    id: 'n2-glass', name: 'Neon — oyna', desc: 'Yorqin, shishasimon, uzoq aks',
    group: 'Neon shahar', base: 180, span: 620, cut: [900, 6200], q: 6, filter: 'lowpass',
    sub: 0.26, air: 0.07, space: 0.5,
    fm: { ratio: 3.5, depth: 0.22 },
    echo: { time: 0.38, feedback: 0.5, mix: 0.24 },
    whine: { from: 1400, to: 4800, level: 0.07 },
    layers: [L('triangle', 1, 5, 10, 0.42), L('sine', 4, 2, 6, 0.12)],
  },
  {
    id: 'n2-pulse', name: 'Neon — puls', desc: 'Ritmik, yurak urishiga o‘xshash',
    group: 'Neon shahar', base: 104, span: 380, cut: [440, 3400], q: 8, filter: 'lowpass',
    sub: 0.48, air: 0.06, space: 0.36,
    lfo: { rate: 2.4, depth: 1100, track: 6 },
    echo: { time: 0.3, feedback: 0.42, mix: 0.18 },
    whine: { from: 640, to: 2400, level: 0.06 },
    layers: [L('sawtooth', 1, 7, 20, 0.4), L('sawtooth', 2, 3, 26, 0.14)],
  },
  {
    id: 'n2-highway', name: 'Neon — yo‘l', desc: 'Tezyurar, ochiq, uzoqqa cho‘zilgan',
    group: 'Neon shahar', base: 122, span: 780, cut: [560, 6400], q: 5, filter: 'lowpass',
    sub: 0.44, air: 0.09, space: 0.4,
    lfo: { rate: 0.6, depth: 500, track: 8 },
    whine: { from: 800, to: 5200, level: 0.1 },
    layers: [L('sawtooth', 1, 7, 22, 0.42), L('sawtooth', 1.5, 3, 18, 0.14)],
  },
  {
    id: 'n2-arcade', name: 'Neon — arkada', desc: 'O‘yinxona tusi, elektr va metall',
    group: 'Neon shahar', base: 140, span: 520, cut: [720, 5000], q: 12, filter: 'lowpass',
    sub: 0.32, air: 0.1, space: 0.32,
    fm: { ratio: 1.5, depth: 0.4 },
    lfo: { rate: 5.2, depth: 800, track: 3 },
    echo: { time: 0.18, feedback: 0.48, mix: 0.22 },
    whine: { from: 1000, to: 3600, level: 0.08, type: 'square' },
    layers: [L('square', 1, 3, 16, 0.28), L('sawtooth', 2, 4, 28, 0.18)],
  },
  {
    id: 'n2-dusk', name: 'Neon — shom', desc: 'Sokin, iliq, uzoqdan eshitiladi',
    group: 'Neon shahar', base: 88, span: 240, cut: [320, 2000], q: 3, filter: 'lowpass',
    sub: 0.56, air: 0.05, space: 0.62,
    lfo: { rate: 0.35, depth: 260, track: 1.5 },
    echo: { time: 0.52, feedback: 0.5, mix: 0.2 },
    whine: { from: 460, to: 1400, level: 0.04 },
    layers: [L('triangle', 1, 5, 12, 0.52), L('sine', 2, 2, 8, 0.16)],
  },

  // ═══════════════════════════════════════════ Orbita
  // Kosmik + elektromobil: bo'shliqda ovoz tarqalmaydi, shuning uchun
  // reverb keng, aks-sado uzun, motor esa uzoqdan eshitilgandek.
  {
    id: 'o2-shuttle', name: 'Orbita — kema', desc: 'Keng bo‘shliq, past dvigatel',
    group: 'Orbita', base: 82, span: 340, cut: [300, 2600], q: 4, filter: 'lowpass',
    sub: 0.6, air: 0.08, space: 0.66,
    lfo: { rate: 0.28, depth: 340, track: 2 },
    whine: { from: 520, to: 2200, level: 0.06 },
    layers: [L('sawtooth', 1, 5, 14, 0.44), L('triangle', 2, 3, 10, 0.16)],
  },
  {
    id: 'o2-dock', name: 'Orbita — ulanish', desc: 'Metall, sekin, og‘ir',
    group: 'Orbita', base: 66, span: 220, cut: [220, 1800], q: 6, filter: 'lowpass',
    sub: 0.7, air: 0.06, space: 0.58,
    fm: { ratio: 2.02, depth: 0.28 },
    lfo: { rate: 0.4, depth: 220, track: 1 },
    whine: { from: 380, to: 1200, level: 0.05 },
    layers: [L('sawtooth', 1, 5, 12, 0.4), L('square', 2, 2, 8, 0.1)],
  },
  {
    id: 'o2-ion', name: 'Orbita — ion tortishi', desc: 'Ingichka, uzluksiz, elektr',
    group: 'Orbita', base: 190, span: 900, cut: [800, 6800], q: 9, filter: 'lowpass',
    sub: 0.3, air: 0.14, space: 0.52,
    lfo: { rate: 1.2, depth: 900, track: 6 },
    whine: { from: 1600, to: 6000, level: 0.1 },
    layers: [L('sawtooth', 1, 5, 20, 0.34), L('sine', 3, 2, 6, 0.1)],
  },
  {
    id: 'o2-belt', name: 'Orbita — asteroid', desc: 'Notekis, shovqinli, uzoq aks',
    group: 'Orbita', base: 94, span: 300, cut: [340, 2800], q: 5, filter: 'lowpass',
    sub: 0.52, air: 0.2, space: 0.6,
    lfo: { rate: 0.55, depth: 480, track: 2.5 },
    echo: { time: 0.62, feedback: 0.52, mix: 0.2 },
    whine: { from: 560, to: 1900, level: 0.05 },
    layers: [L('sawtooth', 1, 5, 26, 0.36), L('triangle', 2.5, 3, 18, 0.12)],
  },
  {
    id: 'o2-signal', name: 'Orbita — signal', desc: 'Uzoqdan qaytgan takroriy tovush',
    group: 'Orbita', base: 160, span: 480, cut: [700, 4600], q: 8, filter: 'lowpass',
    sub: 0.34, air: 0.08, space: 0.7,
    echo: { time: 0.72, feedback: 0.66, mix: 0.3 },
    lfo: { rate: 1.6, depth: 600, track: 3 },
    whine: { from: 1200, to: 3800, level: 0.07 },
    layers: [L('sine', 1, 3, 8, 0.4), L('triangle', 2, 3, 12, 0.18)],
  },
  {
    id: 'o2-gravity', name: 'Orbita — tortishish', desc: 'Juda past, bosim hissi',
    group: 'Orbita', base: 54, span: 180, cut: [180, 1400], q: 5, filter: 'lowpass',
    sub: 0.8, air: 0.05, space: 0.5,
    lfo: { rate: 0.22, depth: 160, track: 1 },
    whine: { from: 300, to: 900, level: 0.04 },
    layers: [L('sine', 1, 3, 8, 0.5), L('sawtooth', 2, 3, 14, 0.14)],
  },
  {
    id: 'o2-solarwind', name: 'Orbita — quyosh shamoli', desc: 'Shovqinli, ohangsiz, keng',
    group: 'Orbita', base: 108, span: 260, cut: [420, 3200], q: 2, filter: 'bandpass',
    sub: 0.4, air: 0.3, space: 0.68,
    lfo: { rate: 0.32, depth: 700, track: 2 },
    whine: { from: 640, to: 2000, level: 0.05 },
    layers: [L('triangle', 1, 5, 16, 0.34), L('sawtooth', 3, 3, 24, 0.1)],
  },
  {
    id: 'o2-warp', name: 'Orbita — sakrash', desc: 'Keskin ko‘tarilish, metall tus',
    group: 'Orbita', base: 100, span: 1200, cut: [340, 7400], q: 10, filter: 'lowpass',
    sub: 0.46, air: 0.1, space: 0.44,
    fm: { ratio: 1.5, depth: 0.45 },
    whine: { from: 700, to: 6800, level: 0.12 },
    layers: [L('sawtooth', 1, 7, 26, 0.4), L('square', 2, 2, 12, 0.1)],
  },
  {
    id: 'o2-station', name: 'Orbita — stansiya', desc: 'Doimiy g‘uvillash, hayot belgisi',
    group: 'Orbita', base: 72, span: 200, cut: [240, 1700], q: 4, filter: 'lowpass',
    sub: 0.66, air: 0.12, space: 0.54,
    lfo: { rate: 0.5, depth: 200, track: 1.5 },
    echo: { time: 0.44, feedback: 0.4, mix: 0.14 },
    whine: { from: 420, to: 1300, level: 0.05 },
    layers: [L('triangle', 1, 5, 10, 0.46), L('sawtooth', 2, 3, 16, 0.12)],
  },
  {
    id: 'o2-silence', name: 'Orbita — sukunat', desc: 'Deyarli jim, faqat fazo',
    group: 'Orbita', base: 120, span: 200, cut: [500, 2200], q: 2, filter: 'lowpass',
    sub: 0.44, air: 0.06, space: 0.78,
    lfo: { rate: 0.18, depth: 180, track: 1 },
    echo: { time: 0.9, feedback: 0.6, mix: 0.22 },
    whine: { from: 700, to: 1600, level: 0.03 },
    layers: [L('sine', 1, 3, 6, 0.44), L('sine', 2, 2, 5, 0.14)],
  },

  // ═══════════════════════════════════════════ Giper
  // Sof tezlik. Chiyillash bu yerda asosiy qahramon.
  {
    id: 'g2-launch', name: 'Giper — start', desc: 'Noldan yuqoriga, keskin',
    group: 'Giper', base: 86, span: 900, cut: [280, 7200], q: 8, filter: 'lowpass',
    sub: 0.5, air: 0.08, space: 0.26,
    whine: { from: 500, to: 7000, level: 0.14 },
    layers: [L('sawtooth', 1, 7, 24, 0.42), L('sawtooth', 2, 3, 18, 0.14)],
  },
  {
    id: 'g2-rail', name: 'Giper — relsda', desc: 'Metall, tekis, to‘xtovsiz',
    group: 'Giper', base: 130, span: 820, cut: [560, 6600], q: 11, filter: 'lowpass',
    sub: 0.4, air: 0.1, space: 0.3,
    fm: { ratio: 2.5, depth: 0.3 },
    whine: { from: 900, to: 6200, level: 0.12 },
    layers: [L('sawtooth', 1, 5, 20, 0.38), L('square', 1.5, 2, 12, 0.1)],
  },
  {
    id: 'g2-tube', name: 'Giper — quvur', desc: 'Yopiq fazo, bosim, aks',
    group: 'Giper', base: 104, span: 700, cut: [400, 5400], q: 9, filter: 'lowpass',
    sub: 0.54, air: 0.12, space: 0.38,
    echo: { time: 0.16, feedback: 0.58, mix: 0.24 },
    whine: { from: 700, to: 5000, level: 0.11 },
    layers: [L('sawtooth', 1, 7, 22, 0.4), L('triangle', 2, 3, 14, 0.12)],
  },
  {
    id: 'g2-turbine', name: 'Giper — turbina', desc: 'Yuqori aylanish, o‘tkir',
    group: 'Giper', base: 240, span: 1500, cut: [900, 8000], q: 13, filter: 'lowpass',
    sub: 0.28, air: 0.16, space: 0.24,
    fm: { ratio: 3.02, depth: 0.25 },
    whine: { from: 1800, to: 8000, level: 0.13 },
    layers: [L('sawtooth', 1, 5, 28, 0.34), L('sawtooth', 1.5, 3, 20, 0.14)],
  },
  {
    id: 'g2-drift', name: 'Giper — sirg‘alish', desc: 'Yon tomonga suzilgan, keng',
    group: 'Giper', base: 112, span: 600, cut: [460, 4800], q: 6, filter: 'lowpass',
    sub: 0.48, air: 0.09, space: 0.46,
    lfo: { rate: 0.8, depth: 640, track: 5 },
    whine: { from: 760, to: 4200, level: 0.09 },
    layers: [L('sawtooth', 1, 7, 26, 0.4), L('sawtooth', 2, 3, 22, 0.13)],
  },
  {
    id: 'g2-boost', name: 'Giper — quvvat', desc: 'Bosim ortadi, keyin ochiladi',
    group: 'Giper', base: 92, span: 1000, cut: [300, 7600], q: 14, filter: 'lowpass',
    sub: 0.56, air: 0.07, space: 0.28,
    fm: { ratio: 1.01, depth: 0.2 },
    whine: { from: 560, to: 6400, level: 0.13 },
    layers: [L('sawtooth', 1, 7, 20, 0.44), L('square', 2, 2, 10, 0.1)],
  },
  {
    id: 'g2-blade', name: 'Giper — tig‘', desc: 'Ingichka, o‘tkir, sovuq',
    group: 'Giper', base: 200, span: 1100, cut: [1000, 7800], q: 15, filter: 'lowpass',
    sub: 0.24, air: 0.12, space: 0.34,
    fm: { ratio: 4.5, depth: 0.18 },
    whine: { from: 1600, to: 7200, level: 0.12 },
    layers: [L('triangle', 1, 5, 14, 0.34), L('sawtooth', 2, 3, 20, 0.12)],
  },
  {
    id: 'g2-mag', name: 'Giper — magnit', desc: 'Osilgan, ishqalanishsiz',
    group: 'Giper', base: 76, span: 640, cut: [260, 5200], q: 7, filter: 'lowpass',
    sub: 0.66, air: 0.06, space: 0.42,
    lfo: { rate: 0.6, depth: 380, track: 6 },
    whine: { from: 460, to: 4600, level: 0.1 },
    layers: [L('sine', 1, 3, 8, 0.42), L('sawtooth', 2, 5, 24, 0.2)],
  },
  {
    id: 'g2-corner', name: 'Giper — burilish', desc: 'Kuch pasayadi va qaytadi',
    group: 'Giper', base: 118, span: 560, cut: [480, 4400], q: 10, filter: 'lowpass',
    sub: 0.46, air: 0.1, space: 0.36,
    lfo: { rate: 1.4, depth: 820, track: 4 },
    whine: { from: 820, to: 3800, level: 0.1 },
    layers: [L('sawtooth', 1, 5, 22, 0.4), L('sawtooth', 3, 3, 26, 0.1)],
  },
  {
    id: 'g2-silent', name: 'Giper — jimjit', desc: 'Tez, lekin deyarli ovozsiz',
    group: 'Giper', base: 96, span: 520, cut: [300, 3000], q: 4, filter: 'lowpass',
    sub: 0.6, air: 0.04, space: 0.5,
    whine: { from: 520, to: 2800, level: 0.06 },
    layers: [L('triangle', 1, 5, 10, 0.5), L('sine', 2, 2, 6, 0.14)],
  },

  // ═══════════════════════════════════════════ Reaktor
  // Og'ir, chuqur, metall. Kuch bor, lekin u shoshmaydi.
  {
    id: 'r2-core', name: 'Reaktor — yadro', desc: 'Chuqur, barqaror, kuchli',
    group: 'Reaktor', base: 58, span: 260, cut: [200, 2200], q: 6, filter: 'lowpass',
    sub: 0.8, air: 0.06, space: 0.4,
    fm: { ratio: 2.01, depth: 0.22 },
    lfo: { rate: 0.3, depth: 180, track: 2 },
    whine: { from: 340, to: 1400, level: 0.05 },
    layers: [L('sawtooth', 1, 5, 12, 0.42), L('sine', 2, 2, 6, 0.14)],
  },
  {
    id: 'r2-coil', name: 'Reaktor — g‘altak', desc: 'Elektr zaryadi, titroq',
    group: 'Reaktor', base: 128, span: 460, cut: [520, 4200], q: 12, filter: 'lowpass',
    sub: 0.44, air: 0.14, space: 0.36,
    fm: { ratio: 5.5, depth: 0.3 },
    lfo: { rate: 6.5, depth: 700, track: 4 },
    whine: { from: 900, to: 3400, level: 0.09 },
    layers: [L('sawtooth', 1, 5, 24, 0.34), L('square', 2, 2, 14, 0.1)],
  },
  {
    id: 'r2-forge', name: 'Reaktor — quyish', desc: 'Og‘ir metall, issiq',
    group: 'Reaktor', base: 68, span: 300, cut: [220, 2600], q: 8, filter: 'lowpass',
    sub: 0.76, air: 0.12, space: 0.34,
    fm: { ratio: 1.41, depth: 0.35 },
    whine: { from: 400, to: 1700, level: 0.06 },
    layers: [L('sawtooth', 1, 5, 18, 0.4), L('square', 3, 2, 12, 0.08)],
  },
  {
    id: 'r2-pressure', name: 'Reaktor — bosim', desc: 'Ko‘tarilayotgan kuch',
    group: 'Reaktor', base: 50, span: 420, cut: [170, 3400], q: 9, filter: 'lowpass',
    sub: 0.85, air: 0.08, space: 0.32,
    lfo: { rate: 0.25, depth: 140, track: 4 },
    whine: { from: 300, to: 2400, level: 0.07 },
    layers: [L('sine', 1, 3, 8, 0.46), L('sawtooth', 2, 5, 20, 0.18)],
  },
  {
    id: 'r2-hum', name: 'Reaktor — g‘uvillash', desc: 'Sekin, doimiy, tinch emas',
    group: 'Reaktor', base: 62, span: 200, cut: [200, 1600], q: 5, filter: 'lowpass',
    sub: 0.78, air: 0.1, space: 0.44,
    lfo: { rate: 0.9, depth: 200, track: 2 },
    echo: { time: 0.5, feedback: 0.45, mix: 0.16 },
    whine: { from: 320, to: 1100, level: 0.05 },
    layers: [L('triangle', 1, 5, 10, 0.46), L('sawtooth', 2, 3, 14, 0.12)],
  },
  {
    id: 'r2-plasma', name: 'Reaktor — plazma', desc: 'Notekis, tirik, metall',
    group: 'Reaktor', base: 110, span: 520, cut: [420, 4800], q: 11, filter: 'lowpass',
    sub: 0.5, air: 0.18, space: 0.4,
    fm: { ratio: 3.33, depth: 0.4 },
    lfo: { rate: 2.2, depth: 900, track: 5 },
    whine: { from: 780, to: 3600, level: 0.09 },
    layers: [L('sawtooth', 1, 7, 28, 0.36), L('triangle', 2, 3, 16, 0.12)],
  },
  {
    id: 'r2-shield', name: 'Reaktor — qalqon', desc: 'Yopiq, bosimli, uzoq',
    group: 'Reaktor', base: 84, span: 340, cut: [300, 2800], q: 7, filter: 'lowpass',
    sub: 0.64, air: 0.09, space: 0.6,
    lfo: { rate: 1.1, depth: 420, track: 3 },
    echo: { time: 0.36, feedback: 0.54, mix: 0.2 },
    whine: { from: 500, to: 2000, level: 0.06 },
    layers: [L('sawtooth', 1, 5, 16, 0.4), L('sine', 3, 2, 8, 0.1)],
  },
  {
    id: 'r2-drill', name: 'Reaktor — burg‘u', desc: 'Qattiq, ishqalanish, kuch',
    group: 'Reaktor', base: 96, span: 600, cut: [340, 5000], q: 13, filter: 'lowpass',
    sub: 0.58, air: 0.2, space: 0.28,
    fm: { ratio: 2.7, depth: 0.5 },
    whine: { from: 620, to: 4000, level: 0.1 },
    layers: [L('sawtooth', 1, 7, 30, 0.36), L('square', 2, 2, 14, 0.1)],
  },
  {
    id: 'r2-vault', name: 'Reaktor — zirh', desc: 'Eng past, deyarli faqat his',
    group: 'Reaktor', base: 44, span: 160, cut: [150, 1200], q: 4, filter: 'lowpass',
    sub: 0.9, air: 0.05, space: 0.46,
    lfo: { rate: 0.2, depth: 120, track: 1 },
    whine: { from: 260, to: 800, level: 0.04 },
    layers: [L('sine', 1, 3, 6, 0.5), L('triangle', 2, 3, 10, 0.14)],
  },
  {
    id: 'r2-charge', name: 'Reaktor — zaryad', desc: 'Yig‘iladi, keyin bo‘shaydi',
    group: 'Reaktor', base: 72, span: 780, cut: [240, 6000], q: 12, filter: 'lowpass',
    sub: 0.7, air: 0.1, space: 0.36,
    fm: { ratio: 1.99, depth: 0.28 },
    lfo: { rate: 0.5, depth: 300, track: 9 },
    whine: { from: 420, to: 5200, level: 0.11 },
    layers: [L('sawtooth', 1, 7, 22, 0.4), L('sawtooth', 2, 3, 18, 0.12)],
  },
];

/* ──────────────────────────────────── Balandlikni tenglashtirish */

/**
 * O'lchangan RMS qiymatlari — `sound-recipes.ts` dagi kabi usul bilan:
 * har bir retsept `OfflineAudioContext` da chizilib, o'rtacha kvadratik
 * quvvati o'lchandi. Retsept o'zgarsa, qayta o'lchash kerak.
 */
const MEASURED: Record<string, number> = {
  'n2-boulevard': 0.1975, 'n2-rain': 0.2233, 'n2-signal': 0.1983, 'n2-underpass': 0.2941,
  'n2-tram': 0.1998, 'n2-glass': 0.158, 'n2-pulse': 0.2275, 'n2-highway': 0.2098,
  'n2-arcade': 0.2047, 'n2-dusk': 0.2437,
  'o2-shuttle': 0.2301, 'o2-dock': 0.2721, 'o2-ion': 0.1542, 'o2-belt': 0.2061,
  'o2-signal': 0.1631, 'o2-gravity': 0.3336, 'o2-solarwind': 0.1395, 'o2-warp': 0.2311,
  'o2-station': 0.2714, 'o2-silence': 0.2037,
  'g2-launch': 0.2546, 'g2-rail': 0.2252, 'g2-tube': 0.2564, 'g2-turbine': 0.1973,
  'g2-drift': 0.2116, 'g2-boost': 0.3134, 'g2-blade': 0.2085, 'g2-mag': 0.2973,
  'g2-corner': 0.2279, 'g2-silent': 0.2659,
  'r2-core': 0.3367, 'r2-coil': 0.2203, 'r2-forge': 0.3367, 'r2-pressure': 0.3934,
  'r2-hum': 0.3326, 'r2-plasma': 0.2341, 'r2-shield': 0.2601, 'r2-drill': 0.2952,
  'r2-vault': 0.3913, 'r2-charge': 0.3243,
};

const TARGET = 0.22;

export const RECIPES_2: readonly Recipe[] = RAW.map((r) => {
  const m = MEASURED[r.id];
  const trim = m ? Math.min(Math.max(TARGET / m, 0.6), 1.6) : 1;
  return { ...r, trim };
});
