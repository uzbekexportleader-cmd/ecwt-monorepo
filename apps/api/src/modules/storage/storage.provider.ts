export interface StoredFile {
  key: string;
  sizeBytes: number;
  mimeType: string;
  originalName: string;
}

/**
 * Fayl saqlash abstraksiyasi: lokal disk yoki S3-mos storage.
 *
 * MUHIM: `getUrl` yo'q — fayllar hech qachon to'g'ridan-to'g'ri, ochiq
 * manzil orqali berilmaydi (pasport/selfie kabi hujjatlar). Faylni o'qish
 * faqat `read()` orqali, avtorizatsiya tekshiruvidan o'tgan controller
 * ichida amalga oshiriladi (qarang: documents.controller.ts).
 */
export interface StorageProvider {
  readonly name: string;
  save(file: { buffer: Buffer; originalName: string; mimeType: string }, folder: string): Promise<StoredFile>;
  remove(key: string): Promise<void>;
  read(key: string): Promise<Buffer>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
