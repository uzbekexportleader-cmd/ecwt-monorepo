/**
 * Davlat reyestrlari abstraksiyasi:
 *  - soliq reyestri (YaTT/MChJ holati, soliq qarzi)
 *  - "Hunarmand" uyushmasi a'zoligi
 */
export type RegistryStatus = 'CONFIRMED' | 'NOT_FOUND' | 'UNAVAILABLE' | 'MANUAL_REVIEW';

export interface RegistryCheck {
  status: RegistryStatus;
  /** Foydalanuvchiga ko'rsatiladigan izoh (o'zbekcha) */
  note: string;
  provider: string;
  checkedAt: string;
}

export interface GovernmentRegistryProvider {
  readonly name: string;
  readonly isReal: boolean;
  checkBusinessRegistration(stir: string): Promise<RegistryCheck>;
  checkTaxDebt(stir: string): Promise<RegistryCheck>;
  checkCraftsmanMembership(pinfl: string, membershipNumber?: string): Promise<RegistryCheck>;
}

export const REGISTRY_PROVIDER = 'REGISTRY_PROVIDER';
