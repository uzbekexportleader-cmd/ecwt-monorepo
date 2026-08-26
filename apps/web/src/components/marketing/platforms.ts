/**
 * Lentaga qo'shiladigan qo'shimcha MARKETPLACE'lar.
 *
 * ── Nega ro'yxat qisqargan ──────────────────────────────────────────
 * Ilgari bu yerda API2Cart qo'llab-quvvatlaydigan ellik ikkita tizim
 * bor edi: WooCommerce, Magento, Wix, Shopware, Zen Cart, Squarespace
 * va hokazo. Ular lentada chiройli ko'rinardi, lekin ularning
 * ko'pchiligi MARKETPLACE EMAS — ular do'kon qurish dvigatellari.
 * Wix da o'z saytingizni qurasiz; u yerda "sotuvchi bo'lib
 * ro'yxatdan o'tib bo'lmaydi".
 *
 * ECWT ning va'dasi esa aniq: mahsulotni xaridor allaqachon turgan
 * joyga chiqarish. Amazon xaridorlari bor, Wix da xaridor yo'q.
 * Shuning uchun ro'yxatda faqat haqiqiy savdo maydonchalari qoldi —
 * ya'ni O'zbek ishlab chiqaruvchisi rostdan ham sotuvchi bo'lib
 * chiqishi mumkin bo'lgan joylar.
 *
 * Bu shunchaki tozalash emas: Amazon yoki investor bilan ishlaydigan
 * odam ro'yxatdagi Zen Cart ni bir qarashda payqaydi va butun sahifaga
 * ishonchi pasayadi.
 *
 * ── Bu fayldagilar ──────────────────────────────────────────────────
 * Ro'yxatning asosiy qismi `MarketplaceMark` da qo'lda chizilgan.
 * Bu yerda faqat belgisi chizilmaganlari qoladi — brend rangidagi
 * so'z belgisi sifatida.
 *
 * ── Uchtasi haqida eslatma ──────────────────────────────────────────
 * Google Shopping, AliExpress va Taobao egasi so'rovi bilan qo'shildi.
 * Ular haqida bilib qo'yish kerak bo'lgan narsalar bor:
 *
 *   Google Shopping — bu marketplace emas, MAHSULOT KO'RSATKICHI.
 *       Xaridor u yerda sotib olmaydi, sizning do'koningizga o'tadi.
 *       ("Buy on Google" xaridi 2023 yilda yopilgan.)
 *   Taobao — Xitoyning ichki bozori; sotuvchi bo'lish uchun odatda
 *       Xitoyda ro'yxatdan o'tgan yuridik shaxs talab qilinadi.
 *   AliExpress — xalqaro sotuvchilarni qabul qiladi, lekin har bir
 *       davlat uchun shartlari alohida.
 *
 * Ya'ni ularni ro'yxatda ushlab turish mumkin, lekin savol berilsa
 * javob tayyor bo'lishi kerak.
 */

export interface Platform {
  name: string;
  /** Brendning asosiy rangi. Qorong'i fonda ko'rinishi tekshirilgan. */
  color: string;
  /**
   * Harflarning o'z ranglari — brend ko'p rangli bo'lsa.
   *
   * Ro'yxatdagi ranglar nomning BOSHIDAN boshlab qo'llanadi, qolgan
   * harflar `color` ni oladi. Google uchun: "Google" olti harf, olti
   * rang; "marketplace" esa neytral qoladi.
   */
  letterColors?: readonly string[];
  /**
   * Yorug'lik bo'yicha tenglashtirishdan CHETLATISH.
   *
   * Odatda ranglar bir darajaga keltiriladi (pastdagi izohga qarang),
   * lekin ba'zi brendning rangi o'zgarmasligi kerak — u shu holida
   * taniladi.
   */
  exact?: boolean;
}

/* ─────────────────────────── Ranglarni yorug'lik bo'yicha tenglash */

/**
 * Nega kerak.
 *
 * Brend ranglari bir-biridan juda farq qiladi. O'lchov (nisbiy
 * yorug'lik, 0 dan 1 gacha):
 *
 *   Facebook  #0866ff  0.168
 *   Google    #4285f4  0.245
 *   AliExpress #ff4747 0.262
 *   Taobao    #ff6a00  0.316
 *
 * Ya'ni Taobao Facebook'dan deyarli ikki barobar yorug'. Qorong'i
 * fonda bu darrov sezilади: biri ko'zni oladi, ikkinchisi xira
 * bo'lib qoladi. Egasi aynan shundan shikoyat qilgan edi.
 *
 * Yechim: rangni O'ZGARTIRMAYMIZ, faqat yorug'ligini nishonga
 * keltiramiz — rang oqqa qarab aralashtiriladi. Tusi saqlanadi
 * (ko'k ko'kligicha qoladi), lekin qator tekis ko'rinadi.
 */
const TARGET_LUM = 0.34;

const srgb = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = ([r, g, b]: number[]) =>
  0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);

const hexToRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

const toHex = (rgb: number[]) =>
  '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/**
 * Rangni nishon yorug'ligiga keltiradi.
 *
 * Oqqa qarab aralashtirish ulushi ikkilik qidiruv bilan topiladi —
 * formula bilan yechib bo'lmaydi, chunki sRGB egri chiziqli.
 */
function balance(hex: string) {
  const base = hexToRgb(hex);
  if (luminance(base) >= TARGET_LUM) return hex;

  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i += 1) {
    const t = (lo + hi) / 2;
    const mixed = base.map((v) => v + (255 - v) * t);
    if (luminance(mixed) < TARGET_LUM) lo = t;
    else hi = t;
  }
  return toHex(base.map((v) => v + (255 - v) * hi));
}

/** Google ning rasmiy to'rt rangi — "G o o g l e" tartibida */
const GOOGLE = ['#4285f4', '#ea4335', '#fbbc05', '#4285f4', '#34a853', '#ea4335'] as const;

export const PLATFORMS: readonly Platform[] = (
  [
    { name: 'Facebook Marketplace', color: '#0866ff' },
    // Rangi TENGLASHTIRILMAYDI: Google aynan shu ranglaridan taniladi.
    { name: 'Google marketplace', color: '#e8eefc', letterColors: GOOGLE, exact: true },
    { name: 'AliExpress', color: '#ff4747' },
    { name: 'Taobao', color: '#ff6a00' },
  ] as Platform[]
).map((p) => (p.exact ? p : { ...p, color: balance(p.color) }));
