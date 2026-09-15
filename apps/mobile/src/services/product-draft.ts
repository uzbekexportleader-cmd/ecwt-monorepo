import * as SecureStore from 'expo-secure-store';

/**
 * Birinchi mahsulot qoralamasi.
 *
 * Hunarmand mahsulotni bir o'tirishda to'ldirib bo'lmasligi mumkin: rasm
 * qidiradi, o'lchamini o'lchaydi, ilovadan chiqadi. Qoralama shu QURILMADA
 * saqlanadi va ilova qayta ochilganda tiklanadi — server bilan bog'liq emas,
 * ya'ni internetsiz ham yo'qolmaydi.
 *
 * Serverga faqat "Saqlash" bosilganda yuboriladi: yarim to'ldirilgan
 * mahsulot bazada mahsulot bo'lib qolmasligi kerak.
 */

const KEY = 'ecwt.product.draft.v1';

/**
 * SecureStore qiymatiga 2 KB dan katta matn tavsiya etilmaydi.
 * Tavsifni shu chegara ichida kesamiz — qoralama saqlanmay qolgandan
 * ko'ra qisqaroq saqlangani yaxshi.
 */
const MAX_DESCRIPTION = 1200;

export interface ProductDraft {
  title: string;
  description: string;
  categoryId: string | null;
  price: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  material: string;
  productionDays: string;
  stock: string;
  /**
   * Rasm manzillari ataylab saqlanmaydi: galereya URI'si vaqtinchalik
   * bo'lishi mumkin va ilova qayta ochilganda ochilmay qolishi mumkin.
   * Buzilgan rasm ko'rsatgandan ko'ra qaytadan tanlatgan to'g'riroq.
   */
}

export const EMPTY_DRAFT: ProductDraft = {
  title: '',
  description: '',
  categoryId: null,
  price: '',
  weight: '',
  length: '',
  width: '',
  height: '',
  material: '',
  productionDays: '',
  stock: '1',
};

/** Qoralamada saqlashga arziydigan biror narsa bormi */
export function isDraftMeaningful(draft: ProductDraft): boolean {
  return Boolean(
    draft.title.trim() ||
      draft.description.trim() ||
      draft.price.trim() ||
      draft.material.trim() ||
      draft.categoryId,
  );
}

export async function loadProductDraft(): Promise<ProductDraft | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProductDraft>;
    // Eski yoki buzilgan qoralama ilovani yiqitmasin: bo'sh qiymat bilan to'ldiramiz
    return { ...EMPTY_DRAFT, ...parsed };
  } catch {
    return null;
  }
}

export async function saveProductDraft(draft: ProductDraft): Promise<void> {
  try {
    const trimmed: ProductDraft = {
      ...draft,
      description: draft.description.slice(0, MAX_DESCRIPTION),
    };
    await SecureStore.setItemAsync(KEY, JSON.stringify(trimmed));
  } catch {
    // Qoralama saqlanmasa ham foydalanuvchi ishini to'xtatmaymiz
  }
}

export async function clearProductDraft(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // e'tiborsiz
  }
}
