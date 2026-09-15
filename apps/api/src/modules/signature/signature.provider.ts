/** Elektron imzo abstraksiyasi (E-IMZO). */
export interface SignatureResult {
  /** Imzo mavjud bo'lsa uning identifikatori */
  signatureRef: string;
  /** Haqiqiy kriptografik imzo qo'yildimi yoki dev tasdiqlash */
  isCryptographic: boolean;
  provider: string;
  signedAt: string;
}

export interface DigitalSignatureProvider {
  readonly name: string;
  readonly isReal: boolean;
  /** Imzolanadigan hujjat hash'i asosida imzo tekshiriladi */
  sign(payload: { userId: string; documentHash: string; token: string }): Promise<SignatureResult>;
  verify(signatureRef: string): Promise<boolean>;
}

export const SIGNATURE_PROVIDER = 'SIGNATURE_PROVIDER';
