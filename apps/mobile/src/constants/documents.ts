import type { DocumentType } from '@ecwt/types';

/**
 * Hujjat turlarining o'zbekcha nomlari.
 * UI da hech qachon texnik enum (RECEIPT, CONTRACT ...) ko'rinmasligi kerak.
 */
export const DOCUMENT_LABEL: Record<DocumentType, string> = {
  PASSPORT: 'Pasport / ID karta',
  MEMBERSHIP_CERTIFICATE: 'Uyushma a’zolik guvohnomasi',
  BUSINESS_REGISTRATION: 'Tadbirkorlik guvohnomasi',
  BANK_DETAILS: 'Bank rekvizitlari ma’lumotnomasi',
  CONTRACT: 'Shartnoma',
  INVOICE: 'Hisob-faktura',
  RECEIPT: 'Kvitansiya / to‘lov hujjati',
  PRODUCT_PHOTO: 'Mahsulot fotosi',
  SELFIE: 'Yuz surati (biometrik tekshiruv)',
  SIGNED_CONTRACT: 'Imzolangan shartnoma',
  WORKSHOP_PHOTO: 'Ustaxona fotosi',
  CERTIFICATE: 'Sertifikat',
  OTHER: 'Boshqa hujjat',
};

export const DOCUMENT_OPTIONS: { value: DocumentType; label: string }[] = (
  Object.keys(DOCUMENT_LABEL) as DocumentType[]
).map((value) => ({ value, label: DOCUMENT_LABEL[value] }));

export function documentLabel(type: DocumentType | string): string {
  return DOCUMENT_LABEL[type as DocumentType] ?? 'Hujjat';
}
