/**
 * Dunyo quruqligining nuqtali to'ri.
 *
 * Jadval — 5 gradusli to'r (72 ustun x 29 qator), har qatorda quruqlik
 * tushgan ustunlar oralig'i. Tashqi rasm ham, kutubxona ham kerak emas:
 * sahifa hech narsa yuklab olmaydi va tasvir istalgan o'lchamda tiniq
 * qoladi.
 *
 * Ustun -> uzunlik: `lon = -180 + 5 * col`
 * Qator -> kenglik:  `lat = 85 - 5 * row`
 *
 * Shu bitta manbadan ikkita ko'rinish yasaladi: tekis xarita
 * (`WorldMap`) va shar (`ConnectedGlobe`).
 */
export const LAND: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [[19, 22], [24, 31]],
  [[12, 24], [22, 32], [38, 41], [54, 58]],
  [[4, 24], [22, 32], [39, 71]],
  [[2, 24], [25, 33], [37, 71]],
  [[2, 25], [26, 28], [31, 33], [36, 71]],
  [[3, 25], [34, 35], [37, 71]],
  [[10, 25], [34, 71]],
  [[11, 23], [35, 65], [67, 69]],
  [[11, 22], [34, 62], [63, 65]],
  [[11, 21], [34, 60], [61, 64]],
  [[12, 20], [34, 60], [62, 64]],
  [[13, 20], [33, 47], [49, 60]],
  [[14, 18], [19, 21], [33, 47], [50, 58]],
  [[16, 18], [21, 23], [32, 46], [50, 57], [60, 61]],
  [[17, 19], [21, 24], [32, 45], [50, 53], [55, 57], [60, 61]],
  [[19, 24], [33, 45], [52, 52], [56, 59], [60, 61]],
  [[20, 27], [34, 46], [55, 61]],
  [[21, 29], [37, 44], [56, 64]],
  [[20, 29], [38, 44], [56, 66]],
  [[21, 29], [38, 44], [45, 45], [61, 65]],
  [[21, 28], [38, 44], [44, 46], [58, 65]],
  [[21, 28], [38, 43], [44, 45], [58, 66]],
  [[21, 25], [39, 42], [58, 66]],
  [[21, 24], [39, 42], [59, 66]],
  [[21, 24], [70, 71]],
  [[21, 23], [70, 71]],
  [[21, 22], [69, 70]],
  [[21, 22]],
  [[22, 23]],
];

/**
 * O'zbekiston tushadigan kataklar.
 *
 * Mamlakat chegarasi taxminan 56–73° uzunlik va 37–45° kenglik oralig'ida.
 * 5 gradusli to'rda bu 47–50-ustunlar va 8–9-qatorlar. Shu kataklar
 * ikkala ko'rinishda ham yashil bilan ajratiladi.
 */
export function isUzbekistan(row: number, col: number): boolean {
  return row >= 8 && row <= 9 && col >= 47 && col <= 50;
}

export interface LandCell {
  row: number;
  col: number;
  lon: number;
  lat: number;
  uz: boolean;
}

/** Jadvalni yassi ro'yxatga yoyadi — takrorlangan ustunlar tashlanadi */
export function landCells(): LandCell[] {
  const cells: LandCell[] = [];

  LAND.forEach((ranges, row) => {
    const seen = new Set<number>();

    ranges.forEach(([from, to]) => {
      for (let col = from; col <= to; col += 1) {
        if (seen.has(col)) continue;
        seen.add(col);

        cells.push({
          row,
          col,
          lon: -180 + 5 * col,
          lat: 85 - 5 * row,
          uz: isUzbekistan(row, col),
        });
      }
    });
  });

  return cells;
}

export interface LandPoint {
  lon: number;
  lat: number;
  uz: boolean;
}

/**
 * Quruqlikni maydaroq nuqtalarga bo'ladi.
 *
 * Asl jadval 5 gradusli, ya'ni bitta katak juda katta — shar yuzasida u
 * yirik kvadrat bo'lib ko'rinadi va qit'alar dag'al chiqadi. Bu funksiya
 * har bir katakni `n x n` ga bo'lib, markazlarini qaytaradi: `n = 2`
 * bo'lsa qadam 2.5 gradus, `n = 3` bo'lsa ~1.7 gradus.
 *
 * Chegara aniqligi oshmaydi (u asl jadval bilan chegaralangan), lekin
 * zichlik ortadi va shar "haqiqiy Yer" kabi o'qiladi.
 */
export function landPoints(n: number): LandPoint[] {
  const step = 5 / n;
  const points: LandPoint[] = [];

  for (const cell of landCells()) {
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        points.push({
          lon: cell.lon + (i + 0.5) * step,
          lat: cell.lat - (j + 0.5) * step,
          uz: cell.uz,
        });
      }
    }
  }

  return points;
}

/**
 * Ortografik proyeksiya — quruqlikni sharga o'raydi.
 *
 * `null` qaytsa, nuqta sharning narigi tomonida qolgan va chizilmaydi.
 * `depth` 0 dan 1 gacha: chekkaga yaqin nuqtalar 0 ga intiladi, shuning
 * uchun ularni xiraroq chizib, sferaning yumaloqligini ko'rsatish mumkin.
 */
export function orthographic(
  lon: number,
  lat: number,
  centerLon: number,
  centerLat: number,
  radius: number,
): { x: number; y: number; depth: number } | null {
  const toRad = Math.PI / 180;
  const phi = lat * toRad;
  const phi0 = centerLat * toRad;
  const dLambda = (lon - centerLon) * toRad;

  const cosC =
    Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(dLambda);

  // Sharning orqa yarmi
  if (cosC <= 0.06) return null;

  return {
    x: radius * Math.cos(phi) * Math.sin(dLambda),
    y: -radius * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(dLambda)),
    depth: cosC,
  };
}
