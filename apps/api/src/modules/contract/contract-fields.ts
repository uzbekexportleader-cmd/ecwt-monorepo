/**
 * Shartnoma shablonidagi o'rin egallar.
 *
 * Shablon matnida `{{fullName}}` ko'rinishida yoziladi va hunarmand
 * ma'lumotidan to'ldiriladi. Ro'yxat YOPIQ: shablonga notanish nom
 * yozilsa, u to'ldirilmay qoladi va shu haqda ochiq aytiladi — jimgina
 * bo'sh qoldirilgan shartnoma eng yomon variant.
 *
 * Yangi maydon kerak bo'lsa shu yerga qo'shiladi.
 */

export interface ContractFieldSource {
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  birthDate: Date | null;
  pinfl: string | null;
  passportSeries: string | null;
  passportNumber: string | null;
  region: string | null;
  district: string | null;
  mahalla: string | null;
  street: string | null;
  houseNumber: string | null;
  contactPhone: string | null;
  businessType: string;
  organizationName: string | null;
  stir: string | null;
  bankAccount: string | null;
  bankMfo: string | null;
  bankName: string | null;
  /** Tanlangan savdo maydonchalari kodlari */
  selectedMarketplaces: string[];
  /** Kirish raqami — aloqa raqami bo'lmasa ishlatiladi */
  loginPhone: string;
}

export interface FieldDefinition {
  key: string;
  label: string;
  /** Qiymat yo'q bo'lsa ilovada qayerda to'ldiriladi */
  fixRoute: string | null;
  /**
   * Majburiymi.
   *
   * Majburiy bo'lmagan maydon (masalan tashkilot nomi jismoniy shaxsda)
   * bo'sh bo'lsa shartnoma baribir tayyor hisoblanadi.
   */
  required: boolean;
  value: (p: ContractFieldSource) => string | null;
}

const fullName = (p: ContractFieldSource): string | null => {
  const parts = [p.lastName, p.firstName, p.middleName].filter(Boolean);
  return parts.length ? parts.join(' ') : null;
};

const address = (p: ContractFieldSource): string | null => {
  const parts = [p.region, p.district, p.mahalla, p.street, p.houseNumber].filter(Boolean);
  // Yarim manzil shartnomaga yaramaydi — hammasi bo'lishi kerak
  return parts.length === 5 ? parts.join(', ') : null;
};

const passport = (p: ContractFieldSource): string | null =>
  p.passportSeries && p.passportNumber ? `${p.passportSeries} ${p.passportNumber}` : null;

const formatDate = (d: Date | null): string | null =>
  d ? `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}` : null;

export const CONTRACT_FIELDS: FieldDefinition[] = [
  { key: 'fullName', label: 'F.I.Sh.', fixRoute: '/profile/personal', required: true, value: fullName },
  {
    key: 'birthDate',
    label: 'Tug‘ilgan sana',
    fixRoute: '/profile/personal',
    required: true,
    value: (p) => formatDate(p.birthDate),
  },
  { key: 'passport', label: 'Pasport', fixRoute: '/profile/personal', required: false, value: passport },
  { key: 'pinfl', label: 'JSHSHIR (PINFL)', fixRoute: '/profile/personal', required: false, value: (p) => p.pinfl },
  { key: 'address', label: 'Manzil', fixRoute: '/profile/personal', required: true, value: address },
  {
    key: 'phone',
    label: 'Telefon',
    fixRoute: '/profile/personal',
    required: true,
    value: (p) => p.contactPhone ?? (p.loginPhone.startsWith('+') ? p.loginPhone : `+${p.loginPhone}`),
  },
  {
    key: 'organizationName',
    label: 'Tashkilot nomi',
    fixRoute: '/profile/craft',
    // Jismoniy shaxsda bo'lmaydi — yo'qligi xato emas
    required: false,
    value: (p) => p.organizationName,
  },
  { key: 'stir', label: 'STIR', fixRoute: '/profile/craft', required: false, value: (p) => p.stir },
  {
    key: 'bankAccount',
    label: 'Hisob raqami',
    fixRoute: '/profile/bank',
    required: true,
    value: (p) => p.bankAccount,
  },
  { key: 'bankMfo', label: 'MFO', fixRoute: '/profile/bank', required: true, value: (p) => p.bankMfo },
  { key: 'bankName', label: 'Bank nomi', fixRoute: '/profile/bank', required: true, value: (p) => p.bankName },
  {
    key: 'marketplace',
    label: 'Tanlangan savdo maydonchasi',
    fixRoute: '/profile/craft',
    /*
     * Shartnomada sakkiz maydonchadan BITTASI tanlanadi. Hunarmand
     * anketada tanlagan birinchisi qo'yiladi; keyin operator bilan
     * kelishib o'zgartirilishi mumkin.
     */
    required: false,
    value: (p) => (p.selectedMarketplaces.length ? p.selectedMarketplaces[0].toUpperCase() : null),
  },
  {
    key: 'today',
    label: 'Shartnoma sanasi',
    fixRoute: null,
    required: true,
    value: () => formatDate(new Date()),
  },
];

/**
 * Tizim o'zi to'ldiradigan o'rin egallar.
 *
 * Ular profil ma'lumotiga bog'liq emas (masalan shartnoma raqami yozuv
 * yaratilgandan keyin ma'lum bo'ladi), shuning uchun `CONTRACT_FIELDS`
 * da yo'q va "notanish" deb hisoblanmaydi.
 */
export const SYSTEM_PLACEHOLDERS = ['contractNumber'];

/** Shablonda ishlatilgan o'rin egallar nomlari */
export function extractPlaceholders(body: string): string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g)) {
    found.add(match[1]);
  }
  return [...found];
}

/**
 * Matnni to'ldiradi.
 *
 * Qiymati yo'q o'rin egalar ATAYLAB `{{key}}` holida qoladi: bo'sh joy
 * qoldirilsa, shartnomada nima yetishmayotgani ko'rinmay qoladi.
 */
export function fillTemplate(body: string, values: Map<string, string | null>): string {
  return body.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (whole, key: string) => {
    const value = values.get(key);
    return value ?? whole;
  });
}
