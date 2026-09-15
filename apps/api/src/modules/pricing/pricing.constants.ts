/**
 * ECWT tariflari — BITTA MANBA.
 *
 * Bu raqamlar ilgari faqat tarjima matnlari ichida yozilgan edi. Natijada
 * bir joyda o'zgartirilsa, boshqa joyda eski qiymat qolib ketardi va
 * hunarmandga ikki xil narx ko'rsatilardi. Endi hisob-kitob ham,
 * ekrandagi yozuv ham shu yerdan oziqlanadi.
 *
 * O'zgartirish kerak bo'lsa — FAQAT shu fayl.
 */

/** Subsidiya orqali kelgan hunarmand ECWT ga sotuvdan foiz to'lamaydi */
export const SUBSIDY_COMMISSION_PERCENT = 0;

/**
 * O'zi to'laydigan tadbirkor uchun to'liq xizmat haqi.
 * Jo'natish va shtrix-kod BUNGA KIRMAYDI — ular alohida.
 */
export const SELF_PAY_SERVICE_FEE_UZS = 13_200_000;

/** Yirik tadbirkorlar uchun muqobil: sotuvdan foiz */
export const SELF_PAY_COMMISSION_PERCENT = 15;

/** Subsidiya yo'lida ECWT qoplaydigan jo'natma og'irligi (gramm) */
export const COVERED_SHIPPING_GRAMS = 5_000;

/** Qoplangan chegaradan ortig'iga: har 0,5 kg uchun narx */
export const EXTRA_SHIPPING_STEP_GRAMS = 500;
export const EXTRA_SHIPPING_STEP_UZS = 205_000;

/** AQSH omborida bepul saqlash muddati */
export const FREE_STORAGE_YEARS = 2;

/**
 * Shtrix-kod (GTIN) narxi — hunarmand zimmasida.
 *
 * DIQQAT: GS1 Uzbekistan o'z tariflarini ochiq e'lon qilmagan (saytda
 * faqat "a'zolik badali to'lanadi, kodlar a'zolarga bepul" deyilgan;
 * aniq summa uchun +998 71 252-66-05). Shu sababli bu yerda GS1 US ning
 * OCHIQ e'lon qilingan narxi turibdi: bitta GTIN — 30 dollar, yillik
 * to'lovsiz.
 *
 * GS1 Uzbekistandan aniq raqam olingach, shu yerni yangilash kifoya.
 */
export const BARCODE_PRICE_USD = 30;
export const BARCODE_PRICE_SOURCE = 'GS1 US, 1 ta GTIN';

/**
 * Marketplace komissiyasi (Amazon).
 *
 * Toifaga qarab farq qiladi; bu yerda hunarmandchilik mollari uchun
 * eng ko'p uchraydigan stavka turibdi. Aniq toifa stavkasi ma'lum
 * bo'lgach toifaga bog'lanadi.
 */
export const MARKETPLACE_COMMISSION_PERCENT = 15;
