export interface ListingPayload {
  productId: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  images: string[];
  weightGram: number | null;
  material: string | null;
  stock: number;
}

export interface ListingResult {
  status: 'LISTED' | 'PENDING' | 'FAILED';
  externalId: string | null;
  errorMessage: string | null;
  /** Real integratsiya orqali bajarildimi */
  isMock: boolean;
}

/** Marketplace'ga mahsulot chiqarish abstraksiyasi. */
export interface MarketplaceProvider {
  readonly code: string;
  readonly isReal: boolean;
  /**
   * Avtomatik joylashtirish HOZIR ishlaydimi.
   *
   * `false` bo'lsa mahsulot qo'lda joylashtirish navbatiga tushadi —
   * xato deb hisoblanmaydi. Integratsiya yoqilganda bu qiymat o'zi
   * `true` bo'ladi va foydalanuvchi tomonda hech narsa o'zgarmaydi.
   */
  readonly isConfigured: boolean;
  publish(payload: ListingPayload): Promise<ListingResult>;
}

export const MARKETPLACE_REGISTRY = 'MARKETPLACE_REGISTRY';
