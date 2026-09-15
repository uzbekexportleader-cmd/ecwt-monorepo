/**
 * Shaxsni tasdiqlash (OneID) abstraksiyasi.
 *
 * MUHIM: real OneID credentiallari yo'q. Shu sababli mock provayder
 * "tasdiqlandi" deb ko'rsatmaydi — u faqat MANUAL_REVIEW natijasini
 * qaytaradi va bu holat UI'da ochiq ko'rsatiladi.
 */
export interface IdentityData {
  pinfl: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: string;
  region?: string;
  district?: string;
  passportNumber?: string;
}

export type IdentityCheckResult =
  | { status: 'VERIFIED'; data: IdentityData; provider: string }
  | { status: 'MANUAL_REVIEW'; reason: string; provider: string }
  | { status: 'FAILED'; reason: string; provider: string };

export interface IdentityProvider {
  readonly name: string;
  readonly isReal: boolean;
  /** OneID login URL (real provayderda) */
  getAuthorizationUrl(state: string): string | null;
  /** OAuth callback code'ini shaxs ma'lumotiga almashtirish */
  exchangeCode(code: string): Promise<IdentityCheckResult>;
  /** JShShIR bo'yicha to'g'ridan-to'g'ri tekshiruv */
  verifyByPinfl(pinfl: string, fullName: string): Promise<IdentityCheckResult>;
  /**
   * Selfi (yuz) bo'yicha biometrik tekshiruv.
   *
   * O'zbekistonda buni MyID kabi provayder bajaradi: selfi pasport
   * bazasidagi surat bilan solishtiriladi va tiriklik (liveness) tekshiriladi.
   * Bunday xizmat ulanmagan bo'lsa, natija hech qachon VERIFIED bo'lmaydi.
   */
  verifyFace(input: { pinfl: string | null; photoUrl: string }): Promise<IdentityCheckResult>;
}

export const IDENTITY_PROVIDER = 'IDENTITY_PROVIDER';
