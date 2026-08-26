/**
 * Yer teksturasini sharga o'rash.
 *
 * Kirish — yoyilgan (equirectangular) dunyo xaritasi: eni bo'ylab
 * -180..180 uzunlik, bo'yi bo'ylab 90..-90 kenglik. Chiqish — aylanuvchi
 * shar tasviri.
 *
 * Butun ish teskari ortografik proyeksiya bilan bajariladi: ekrandagi
 * har bir piksel uchun u sharning qaysi nuqtasiga tegishli ekani
 * topiladi va teksturadan o'sha rang olinadi.
 *
 * Muhim nuqta — jadval. Kenglik va yorug'lik pikselga bog'liq, aylanish
 * esa yo'q: aylanganda faqat uzunlik siljiydi. Shu sababli kenglik,
 * uzunlik siljishi va soya BIR MARTA hisoblanib jadvalga yoziladi, har
 * kadrda esa faqat qidirish va rang ko'chirish qoladi.
 */

export interface GlobeLut {
  size: number;
  /** Shar ichidagi piksellar soni */
  count: number;
  /** Har bir piksel indeksi chiqish massivida (4 baytli qadam) */
  offset: Int32Array;
  /** Teksturadagi vertikal koordinata (0..1) */
  v: Float32Array;
  /** Uzunlik siljishi gradusda (-180..180) */
  lonOffset: Float32Array;
  /** Yorug'lik koeffitsienti (0..1) */
  shade: Float32Array;
}

/**
 * Piksel jadvalini bir marta quradi.
 *
 * `size` — chizish tomoni pikselda. Bu ekrandagi o'lchamdan kichik
 * bo'lishi mumkin: shar kichik element, brauzer uni cho'zib ko'rsatadi
 * va farqi bilinmaydi, hisob esa bir necha barobar yengillashadi.
 */
export function buildLut(size: number, centerLat: number): GlobeLut {
  const r = size / 2;
  const lat0 = (centerLat * Math.PI) / 180;
  const sinLat0 = Math.sin(lat0);
  const cosLat0 = Math.cos(lat0);

  // Yorug'lik manbai chap yuqorida — shar hajmli ko'rinishi uchun
  const lx = -0.42;
  const ly = -0.42;
  const lz = Math.sqrt(1 - lx * lx - ly * ly);

  const max = size * size;
  const offset = new Int32Array(max);
  const v = new Float32Array(max);
  const lonOffset = new Float32Array(max);
  const shade = new Float32Array(max);

  let count = 0;

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const x = (px + 0.5 - r) / r;
      // Ekranda y pastga o'sadi, sferada esa yuqoriga
      const y = -(py + 0.5 - r) / r;

      const rho2 = x * x + y * y;
      if (rho2 >= 1) continue;

      const z = Math.sqrt(1 - rho2);
      const rho = Math.sqrt(rho2);
      const c = Math.asin(Math.min(rho, 1));
      const sinC = Math.sin(c);
      const cosC = Math.cos(c);

      const lat = rho === 0 ? lat0 : Math.asin(cosC * sinLat0 + (y * sinC * cosLat0) / rho);
      const lon = Math.atan2(x * sinC, rho * cosC * cosLat0 - y * sinC * sinLat0);

      offset[count] = (py * size + px) * 4;
      v[count] = 0.5 - lat / Math.PI;
      lonOffset[count] = (lon * 180) / Math.PI;

      // Yorug'lik: normal (x, y, z) bilan manba yo'nalishining skalyar
      // ko'paytmasi, ustiga chekka qorayishi qo'shiladi.
      const diffuse = Math.max(0, x * lx + y * ly + z * lz);
      const ambient = 0.42;
      const limb = 0.55 + 0.45 * z;
      shade[count] = Math.min(1.25, (ambient + 0.75 * diffuse) * limb);

      count += 1;
    }
  }

  return { size, count, offset, v, lonOffset, shade };
}

/**
 * Okeanni bir oz yorug'lantiradi.
 *
 * NASA teksturasi kosmosdan olingan haqiqiy surat, va undagi chuqur suv
 * juda quyuq. Sahifaning foni ham qora kosmos bo'lgani uchun shar
 * chekkalari fonga singib ketadi — qit'alar suzib yurgandek ko'rinadi.
 *
 * Shu sababli faqat ENG chuqur piksellar sal ko'kroq tusga suriladi.
 * Aralashtirish kuchi ataylab past: teksturada okean tuslari, oqim
 * chiziqlari va sayoz suv allaqachon bor, ularni bo'yab tashlamaymiz.
 *
 * Bir marta, tekstura yuklanganda chaqiriladi.
 */
export function brightenOcean(img: ImageData): void {
  const d = img.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];

    // Okean: quyuq va ko'k ustunlik qiladi. Quruqlikda yashil yoki qizil
    // komponent kuchli bo'ladi, bulut va muzda esa hammasi yorug'.
    if (b <= r || b <= g + 4 || r + g + b > 190) continue;

    // Qanchalik quyuq bo'lsa, shunchalik ko'p ko'tariladi
    const depth = 1 - Math.min((r + g + b) / 190, 1);
    const k = 0.16 * depth;

    d[i] = r + (24 - r) * k;
    d[i + 1] = g + (78 - g) * k;
    d[i + 2] = b + (150 - b) * k;
  }
}

/**
 * Bitta kadrni chizadi.
 *
 * `centerLon` — sharning markazida turgan uzunlik. Uni sekin
 * o'zgartirish aylanish beradi.
 */
export function renderFrame(
  lut: GlobeLut,
  texture: ImageData,
  out: ImageData,
  centerLon: number,
): void {
  const { count, offset, v, lonOffset, shade } = lut;
  const tw = texture.width;
  const th = texture.height;
  const tex = texture.data;
  const dst = out.data;

  for (let i = 0; i < count; i += 1) {
    // Uzunlikni 0..360 oralig'iga keltiramiz
    let lon = lonOffset[i] + centerLon + 180;
    lon -= Math.floor(lon / 360) * 360;

    const tx = (lon / 360) * tw;
    const ty = v[i] * th;

    const sx = tx < 0 ? 0 : tx >= tw ? tw - 1 : tx | 0;
    const sy = ty < 0 ? 0 : ty >= th ? th - 1 : ty | 0;

    const s = (sy * tw + sx) * 4;
    const k = shade[i];
    const d = offset[i];

    dst[d] = tex[s] * k;
    dst[d + 1] = tex[s + 1] * k;
    dst[d + 2] = tex[s + 2] * k;
    dst[d + 3] = 255;
  }
}
