import type { Ionicons } from '@expo/vector-icons';
import type { ActivityType } from '@ecwt/types';

import type { TranslationKey } from '../i18n';

/**
 * Ro'yxatdan o'tish oqimining ma'lumot ro'yxatlari.
 *
 * Matnlar bu yerda emas, lug'at kalitlari orqali beriladi — shu sababli
 * hamma narsa to'rt tilda ishlaydi.
 */

type IconName = keyof typeof Ionicons.glyphMap;

/* ------------------------------ 7. Siz kimsiz? --------------------------- */

export interface ActivityOption {
  value: ActivityType;
  labelKey: TranslationKey;
  hintKey: TranslationKey;
  icon: IconName;
}

export const ACTIVITY_TYPES: ActivityOption[] = [
  { value: 'HUNARMAND', labelKey: 'activity.hunarmand', hintKey: 'activity.hunarmandHint', icon: 'color-palette-outline' },
  { value: 'AGRO_HOLDING', labelKey: 'activity.agro', hintKey: 'activity.agroHint', icon: 'leaf-outline' },
  { value: 'TADBIRKOR', labelKey: 'activity.tadbirkor', hintKey: 'activity.tadbirkorHint', icon: 'briefcase-outline' },
  { value: 'TEXTILE', labelKey: 'activity.textile', hintKey: 'activity.textileHint', icon: 'shirt-outline' },
  { value: 'ISHLAB_CHIQARUVCHI', labelKey: 'activity.manufacturer', hintKey: 'activity.manufacturerHint', icon: 'construct-outline' },
];

/* --------------------------- 8. Faoliyat haqida -------------------------- */

/** Tajriba — barcha faoliyat turlari uchun bir xil */
export const EXPERIENCE_OPTIONS: { value: number; labelKey: TranslationKey }[] = [
  { value: 0, labelKey: 'exp.under1' },
  { value: 2, labelKey: 'exp.1to3' },
  { value: 4, labelKey: 'exp.3to5' },
  { value: 7, labelKey: 'exp.5to10' },
  { value: 12, labelKey: 'exp.over10' },
];

/** Hunarmandchilik turlari — faqat HUNARMAND tanlanganda so'raladi */
export const CRAFT_KINDS: { value: string; labelKey: TranslationKey }[] = [
  { value: 'kulolchilik', labelKey: 'craft.pottery' },
  { value: 'zargarlik', labelKey: 'craft.jewellery' },
  { value: 'kashtachilik', labelKey: 'craft.embroidery' },
  { value: 'yogoch-oymakorligi', labelKey: 'craft.woodcarving' },
  { value: 'toqimachilik', labelKey: 'craft.weaving' },
  { value: 'charm', labelKey: 'craft.leather' },
  { value: 'boshqa', labelKey: 'craft.other' },
];

/** Qolgan faoliyat turlari uchun yo'nalish ro'yxatlari */
export const SECTOR_KINDS: Record<Exclude<ActivityType, 'HUNARMAND'>, { value: string; labelKey: TranslationKey }[]> = {
  AGRO_HOLDING: [
    { value: 'meva-sabzavot', labelKey: 'sector.agro.fruit' },
    { value: 'quruq-meva', labelKey: 'sector.agro.dried' },
    { value: 'gallakorlik', labelKey: 'sector.agro.grain' },
    { value: 'chorvachilik', labelKey: 'sector.agro.livestock' },
    { value: 'boshqa', labelKey: 'craft.other' },
  ],
  TEXTILE: [
    { value: 'tayyor-kiyim', labelKey: 'sector.textile.garment' },
    { value: 'gazlama', labelKey: 'sector.textile.fabric' },
    { value: 'ip-kalava', labelKey: 'sector.textile.yarn' },
    { value: 'uy-tekstili', labelKey: 'sector.textile.home' },
    { value: 'boshqa', labelKey: 'craft.other' },
  ],
  TADBIRKOR: [
    { value: 'savdo', labelKey: 'sector.business.trade' },
    { value: 'xizmat', labelKey: 'sector.business.services' },
    { value: 'logistika', labelKey: 'sector.business.logistics' },
    { value: 'boshqa', labelKey: 'craft.other' },
  ],
  ISHLAB_CHIQARUVCHI: [
    { value: 'oziq-ovqat', labelKey: 'sector.maker.food' },
    { value: 'qurilish', labelKey: 'sector.maker.construction' },
    { value: 'mebel', labelKey: 'sector.maker.furniture' },
    { value: 'kimyo', labelKey: 'sector.maker.chemical' },
    { value: 'boshqa', labelKey: 'craft.other' },
  ],
};

/* --------------------------- 9. Marketplace'lar -------------------------- */

export interface MarketplaceOption {
  code: string;
  name: string;
  /** Font Awesome 6 brands glifi bo'lsa — haqiqiy logotip ko'rsatiladi */
  brand?: 'amazon' | 'ebay' | 'tiktok' | 'facebook';
  color: string;
  /**
   * Haqiqiy integratsiya ulanganmi.
   *
   * Hozir faqat Amazon va eBay — ECWT'da ularda seller akkaunt bor.
   * Qolganlari ustida "Tez orada" belgisi turadi.
   *
   * Foydalanuvchi buni bilishi SHART: aks holda u mahsulotim o'sha yerda
   * sotilyapti deb o'ylab, haqiqatda hech narsa bo'lmaydi.
   *
   * Yangi platforma ulangach shu yerda `connected: true` qilinadi.
   */
  connected?: boolean;
}

/**
 * Sakkizta marketplace.
 *
 * Amazon, eBay, TikTok va Facebook uchun rasmiy brend glifi bor. Qolganlari
 * uchun bepul rasmiy glif yo'q — ular nomining bosh harfi bilan ko'rsatiladi.
 * Rasmiy logotip fayllari berilsa, shu ro'yxatga qo'shiladi.
 */
export const MARKETPLACES: MarketplaceOption[] = [
  { code: 'amazon', name: 'Amazon', brand: 'amazon', color: '#FF9900', connected: true },
  { code: 'ebay', name: 'eBay', brand: 'ebay', color: '#E53238', connected: true },
  { code: 'walmart', name: 'Walmart', color: '#0071CE' },
  { code: 'tiktok_shop', name: 'TikTok Shop', brand: 'tiktok', color: '#111111' },
  { code: 'poshmark', name: 'Poshmark', color: '#7F0353' },
  { code: 'mercari', name: 'Mercari', color: '#5B62F4' },
  { code: 'bonanza', name: 'Bonanza', color: '#2E8B57' },
  { code: 'facebook_marketplace', name: 'Facebook Marketplace', brand: 'facebook', color: '#1877F2' },
];
