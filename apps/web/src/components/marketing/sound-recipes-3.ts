import type { Exotic } from './sound-engine-2';

/**
 * Uchinchi qirqtalik — butunlay boshqa usullar bilan.
 *
 * Avvalgi sakson ovoz bir xil yo'l bilan yasalgan edi va shuning
 * uchun bir-biriga o'xshab qolardi. Bu yerdagilar esa o'nta TURLI
 * usuldan chiqadi: chalinadigan sim, qo'ng'iroq, halqa modulyatsiyasi,
 * taroq filtr, donachalar, formant, raqamli buzilish, ketma-ketlik,
 * rezonator va to'lqinni egish. Usullarning tavsifi
 * `sound-engine-2.ts` da.
 *
 * Muhim farq: bularning hammasi ham "g'uvillash" emas. Bir qismi
 * ZARBA va NOTALARdan iborat — sichqoncha tezligi ohangning temposini
 * boshqaradi. Bu quloqqa mutlaqo boshqacha ta'sir qiladi.
 */

const RAW: readonly Exotic[] = [
  // ═══════════════════════════════════════════ Metall va zarba
  {
    id: 'x-string', name: 'Sim — chalinish', desc: 'Fizik model: shovqindan tug‘ilgan ohang',
    group: 'Metall va zarba', kind: 'karplus', base: 220, span: 340, cut: [3000, 8000],
    space: 0.4, rate: [1.5, 14], p: { fb: 0.85, damp: 2800, hit: 1.5 },
  },
  {
    id: 'x-steel', name: 'Sim — po‘lat', desc: 'Uzoq yangraydi, sovuq va aniq',
    group: 'Metall va zarba', kind: 'karplus', base: 330, span: 520, cut: [4000, 9000],
    space: 0.5, rate: [1, 10], p: { fb: 0.84, damp: 4200, hit: 1.5 },
  },
  {
    id: 'x-wire', name: 'Sim — ingichka', desc: 'Yuqori, tez, quruq',
    group: 'Metall va zarba', kind: 'karplus', base: 520, span: 900, cut: [5000, 10000],
    space: 0.3, rate: [3, 22], p: { fb: 0.86, damp: 5200, burst: 0.004, hit: 1.5 },
  },
  {
    id: 'x-bass-string', name: 'Sim — past', desc: 'Qalin, og‘ir, sekin so‘nadi',
    group: 'Metall va zarba', kind: 'karplus', base: 82, span: 130, cut: [1400, 4200],
    space: 0.42, sub: 0.3, rate: [0.8, 7], p: { fb: 0.85, damp: 1600, hit: 1.5 },
  },
  {
    id: 'x-harp', name: 'Sim — arfa', desc: 'Tez ketma-ket zarbalar, keng fazo',
    group: 'Metall va zarba', kind: 'karplus', base: 300, span: 700, cut: [3600, 9000],
    space: 0.62, rate: [4, 26], p: { fb: 0.84, damp: 3400, hit: 1.5 },
  },
  {
    id: 'x-bell', name: 'Qo‘ng‘iroq', desc: 'Nomutanosib ohanglar — sof metall',
    group: 'Metall va zarba', kind: 'bell', base: 240, span: 380, cut: [4000, 9000],
    space: 0.56, rate: [0.8, 7], p: { decay: 2.2, lvl: 0.32 },
  },
  {
    id: 'x-gong', name: 'Gong', desc: 'Past, keng, uzoq so‘nadi',
    group: 'Metall va zarba', kind: 'bell', base: 96, span: 140, cut: [2000, 5600],
    space: 0.68, sub: 0.24, rate: [0.4, 4], p: { decay: 3.6, lvl: 0.36 },
  },
  {
    id: 'x-glass', name: 'Shisha', desc: 'Juda yuqori, tiniq, mo‘rt',
    group: 'Metall va zarba', kind: 'bell', base: 620, span: 900, cut: [6000, 12000],
    space: 0.5, rate: [2, 16], p: { decay: 1.1, lvl: 0.24 },
  },
  {
    id: 'x-anvil', name: 'Sandon', desc: 'Qattiq zarba, qisqa va o‘tkir',
    group: 'Metall va zarba', kind: 'bell', base: 380, span: 300, cut: [3400, 8000],
    space: 0.3, rate: [1.2, 12], p: { decay: 0.45, lvl: 0.4 },
  },
  {
    id: 'x-temple', name: 'Ma‘bad qo‘ng‘irog‘i', desc: 'Sekin, tinch, uzoq aks',
    group: 'Metall va zarba', kind: 'bell', base: 160, span: 200, cut: [2400, 6000],
    space: 0.74, rate: [0.35, 3], p: { decay: 4, lvl: 0.34 },
  },

  // ═══════════════════════════════════════════ Begona elektron
  {
    id: 'x-ring', name: 'Halqa — begona', desc: 'Ikki tovush ko‘paytmasi, tabiatda yo‘q',
    group: 'Begona elektron', kind: 'ring', base: 140, span: 420, cut: [3000, 8000],
    space: 0.42, p: { ratio: 1.71 },
  },
  {
    id: 'x-ring-low', name: 'Halqa — past', desc: 'Qalin, tebranuvchi, notinch',
    group: 'Begona elektron', kind: 'ring', base: 72, span: 200, cut: [1600, 5000],
    space: 0.38, sub: 0.34, p: { ratio: 1.26 },
  },
  {
    id: 'x-ring-metal', name: 'Halqa — metall', desc: 'Yuqori nisbat, po‘latdek chiyillash',
    group: 'Begona elektron', kind: 'ring', base: 190, span: 620, cut: [4000, 10000],
    space: 0.34, p: { ratio: 3.41, square: 1 },
  },
  {
    id: 'x-ring-wide', name: 'Halqa — keng', desc: 'Stereo yoyilgan, uzoq fazo',
    group: 'Begona elektron', kind: 'ring', base: 118, span: 380, cut: [2600, 7000],
    space: 0.66, p: { ratio: 2.11 },
  },
  {
    id: 'x-crush', name: 'Buzilish — 6 pog‘ona', desc: 'Raqamli, qo‘pol, eski kompyuter',
    group: 'Begona elektron', kind: 'crush', base: 110, span: 380, cut: [3000, 8000],
    space: 0.3, p: { steps: 6, echo: 0.09, fb: 0.5 },
  },
  {
    id: 'x-crush-fine', name: 'Buzilish — mayin', desc: 'Yumshoqroq, lekin baribir raqamli',
    group: 'Begona elektron', kind: 'crush', base: 150, span: 500, cut: [3600, 9000],
    space: 0.44, p: { steps: 14, echo: 0.13, fb: 0.58 },
  },
  {
    id: 'x-crush-hard', name: 'Buzilish — 3 pog‘ona', desc: 'Deyarli kvadrat, eng qo‘pol',
    group: 'Begona elektron', kind: 'crush', base: 88, span: 300, cut: [2400, 6600],
    space: 0.26, sub: 0.3, p: { steps: 3, echo: 0.06, fb: 0.44 },
  },
  {
    id: 'x-growl', name: 'O‘kirish', desc: 'To‘lqin egilgan — kuchli, qattiq',
    group: 'Begona elektron', kind: 'shaper', base: 76, span: 260, cut: [1800, 6000],
    space: 0.34, sub: 0.4, p: { drive: 9, ratio: 1.5, bite: 2.6, post: 0.42 },
  },
  {
    id: 'x-roar', name: 'O‘kirish — chuqur', desc: 'Eng past, hayvoniy',
    group: 'Begona elektron', kind: 'shaper', base: 52, span: 160, cut: [1200, 4000],
    space: 0.4, sub: 0.5, p: { drive: 12, ratio: 1.01, bite: 3, post: 0.38 },
  },
  {
    id: 'x-bright-drive', name: 'Egilgan — yorqin', desc: 'Yuqori, o‘tkir, elektr',
    group: 'Begona elektron', kind: 'shaper', base: 170, span: 620, cut: [3400, 9000],
    space: 0.36, p: { drive: 7, ratio: 2.01, bite: 2.2, post: 0.44 },
  },

  // ═══════════════════════════════════════════ Bulut va shamol
  {
    id: 'x-cloud', name: 'Bulut', desc: 'Yuzlab qisqa donacha, tasodifiy sochilgan',
    group: 'Bulut va shamol', kind: 'granular', base: 300, span: 500, cut: [4000, 9000],
    space: 0.6, rate: [6, 45], p: { spread: 0.55, grain: 0.085, lvl: 0.2 },
  },
  {
    id: 'x-swarm', name: 'To‘da', desc: 'Zichroq, past, tirik',
    group: 'Bulut va shamol', kind: 'granular', base: 160, span: 300, cut: [2600, 7000],
    space: 0.5, rate: [10, 60], p: { spread: 0.7, grain: 0.06, lvl: 0.16, saw: 1 },
  },
  {
    id: 'x-sparkle', name: 'Uchqun', desc: 'Yuqori, siyrak, yaltiroq',
    group: 'Bulut va shamol', kind: 'granular', base: 900, span: 1400, cut: [6000, 12000],
    space: 0.68, rate: [4, 30], p: { spread: 0.4, grain: 0.05, lvl: 0.16 },
  },
  {
    id: 'x-dust', name: 'Chang', desc: 'Juda mayda, deyarli shovqin',
    group: 'Bulut va shamol', kind: 'granular', base: 520, span: 900, cut: [5000, 11000],
    space: 0.56, rate: [20, 90], p: { spread: 0.85, grain: 0.03, lvl: 0.1 },
  },
  {
    id: 'x-whistle', name: 'Hushtak', desc: 'Shovqindan tor filtr ajratgan ohang',
    group: 'Bulut va shamol', kind: 'noiseres', base: 420, span: 900, cut: [5000, 11000],
    space: 0.54, p: { q: 38, lvl: 3, r2: 1.5, r3: 2.24 },
  },
  {
    id: 'x-radio', name: 'Radio', desc: 'Notekis, uzoqdan, xira',
    group: 'Bulut va shamol', kind: 'noiseres', base: 260, span: 520, cut: [2600, 6400],
    space: 0.46, p: { q: 22, lvl: 2.6, r2: 1.33, r3: 1.98 },
  },
  {
    id: 'x-cave', name: 'G‘or shamoli', desc: 'Past, bo‘g‘iq, keng fazo',
    group: 'Bulut va shamol', kind: 'noiseres', base: 130, span: 260, cut: [1400, 4200],
    space: 0.7, sub: 0.28, p: { q: 26, lvl: 3.2, r2: 1.5, r3: 2.99 },
  },
  {
    id: 'x-jet', name: 'Reaktiv', desc: 'Taroq filtr — samolyot shuvillashi',
    group: 'Bulut va shamol', kind: 'comb', base: 100, span: 200, cut: [4000, 10000],
    space: 0.34, p: { time: 0.005, fb: 0.7, sweep: 0.3, depth: 0.003, pre: 7000 },
  },
  {
    id: 'x-flange', name: 'Taroq — sekin', desc: 'Sekin suzuvchi, metallga moyil',
    group: 'Bulut va shamol', kind: 'comb', base: 100, span: 200, cut: [3000, 8000],
    space: 0.5, p: { time: 0.008, fb: 0.76, sweep: 0.12, depth: 0.005, pre: 5000 },
  },
  {
    id: 'x-tunnel', name: 'Tunnel', desc: 'Qisqa taroq — quvur ichida',
    group: 'Bulut va shamol', kind: 'comb', base: 100, span: 200, cut: [2400, 7000],
    space: 0.42, sub: 0.24, p: { time: 0.0022, fb: 0.78, sweep: 0.6, depth: 0.0012, pre: 4200 },
  },

  // ═══════════════════════════════════════════ Mashina tili
  {
    id: 'x-vowel', name: 'Unli — gapiruvchi', desc: 'Kursor chapdan o‘ngga: u → o → a → e → i',
    group: 'Mashina tili', kind: 'formant', base: 110, span: 180, cut: [3400, 7000],
    space: 0.4, p: { q: 9 },
  },
  {
    id: 'x-vowel-low', name: 'Unli — past ovoz', desc: 'Qalin, sekin, odamga yaqin',
    group: 'Mashina tili', kind: 'formant', base: 78, span: 120, cut: [2600, 6000],
    space: 0.46, sub: 0.26, p: { q: 11 },
  },
  {
    id: 'x-vowel-high', name: 'Unli — yuqori', desc: 'Ingichka, robotga xos',
    group: 'Mashina tili', kind: 'formant', base: 190, span: 300, cut: [4000, 9000],
    space: 0.36, p: { q: 13 },
  },
  {
    id: 'x-vowel-choir', name: 'Unli — xor', desc: 'Keng fazo, ko‘p ovozli tuyuladi',
    group: 'Mashina tili', kind: 'formant', base: 130, span: 220, cut: [3200, 7400],
    space: 0.72, p: { q: 7 },
  },
  {
    id: 'x-vowel-robot', name: 'Unli — robot', desc: 'Juda tor filtr, sun‘iy',
    group: 'Mashina tili', kind: 'formant', base: 96, span: 160, cut: [3000, 6800],
    space: 0.3, p: { q: 18 },
  },
  {
    id: 'x-arp', name: 'Ketma-ketlik', desc: 'Notalar. Tezlik tempo‘ni boshqaradi',
    group: 'Mashina tili', kind: 'arp', base: 220, span: 160, cut: [4000, 9000],
    space: 0.5, rate: [2, 16], p: { q: 9, bright: 4, len: 0.26, lvl: 0.3 },
  },
  {
    id: 'x-arp-fast', name: 'Ketma-ketlik — tez', desc: 'Mayda, shoshqaloq, elektron',
    group: 'Mashina tili', kind: 'arp', base: 330, span: 220, cut: [4600, 10000],
    space: 0.44, rate: [4, 30], p: { q: 12, bright: 5, len: 0.13, lvl: 0.26, square: 1 },
  },
  {
    id: 'x-arp-deep', name: 'Ketma-ketlik — past', desc: 'Bass chizig‘i, og‘ir qadam',
    group: 'Mashina tili', kind: 'arp', base: 82, span: 60, cut: [1600, 5000],
    space: 0.34, sub: 0.3, rate: [1.5, 11], p: { q: 8, bright: 6, len: 0.3, lvl: 0.34 },
  },
  {
    id: 'x-arp-wide', name: 'Ketma-ketlik — keng', desc: 'Notalar chapdan o‘ngga sochiladi',
    group: 'Mashina tili', kind: 'arp', base: 260, span: 180, cut: [4200, 9600],
    space: 0.7, rate: [2.5, 20], p: { q: 10, bright: 4.5, len: 0.4, lvl: 0.26 },
  },
  {
    id: 'x-arp-slow', name: 'Ketma-ketlik — sekin', desc: 'Kamdan-kam, tinch, o‘ychan',
    group: 'Mashina tili', kind: 'arp', base: 175, span: 120, cut: [3000, 7000],
    space: 0.66, rate: [0.8, 6], p: { q: 7, bright: 3.4, len: 0.7, lvl: 0.3, up: 2 },
  },
];

/* ──────────────────────────────────── Balandlikni tenglashtirish */

/**
 * O'lchangan RMS qiymatlari.
 *
 * Bu to'plamda o'lchov murakkabroq: ritmli usullar bir marta
 * `update` chaqirilgandan keyin atigi 0.2 soniyaga reja tuzadi.
 * Shuning uchun o'lchashda `OfflineAudioContext.suspend()` ishlatildi
 * — chizish har 50 ms da to'xtatilib, `update` qayta chaqirildi.
 * Ya'ni o'lchov haqiqiy foydalanishdagidek bo'ldi.
 *
 * Bundan tashqari har biri UCH xil tezlikda (0.35 / 0.7 / 1.0)
 * o'lchanib, o'rtachasi olindi: notalar va zarbalardan iborat
 * ovozlarda bitta nuqta ishonchsiz natija beradi.
 */
const MEASURED: Record<string, number> = {
  'x-string': 0.3878, 'x-steel': 0.0347, 'x-wire': 0.1733, 'x-bass-string': 0.359,
  'x-harp': 0.0377, 'x-bell': 0.1208, 'x-gong': 0.1468, 'x-glass': 0.1351,
  'x-anvil': 0.1174, 'x-temple': 0.1356,
  'x-ring': 0.3461, 'x-ring-low': 0.3366, 'x-ring-metal': 0.3471, 'x-ring-wide': 0.3328,
  'x-crush': 0.3751, 'x-crush-fine': 0.3444, 'x-crush-hard': 0.4128, 'x-growl': 0.321,
  'x-roar': 0.3241, 'x-bright-drive': 0.3065,
  'x-cloud': 0.0644, 'x-swarm': 0.0366, 'x-sparkle': 0.0321, 'x-dust': 0.0284,
  'x-whistle': 0.0496, 'x-radio': 0.0439, 'x-cave': 0.1177, 'x-jet': 0.2998,
  'x-flange': 0.2863, 'x-tunnel': 0.29,
  'x-vowel': 0.047, 'x-vowel-low': 0.1285, 'x-vowel-high': 0.0445, 'x-vowel-choir': 0.0753,
  'x-vowel-robot': 0.0341, 'x-arp': 0.0426, 'x-arp-fast': 0.0685, 'x-arp-deep': 0.1551,
  'x-arp-wide': 0.0465, 'x-arp-slow': 0.0378,
};

const TARGET = 0.22;

export const RECIPES_3: readonly Exotic[] = RAW.map((r) => {
  const m = MEASURED[r.id];
  const trim = m ? Math.min(Math.max(TARGET / m, 0.15), 9) : 1;
  return { ...r, trim };
});
