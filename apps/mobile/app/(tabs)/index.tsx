import { Redirect } from 'expo-router';

/**
 * Bosh sahifa olib tashlandi.
 *
 * Ilova ochilganda darhol "Imkoniyatlar" bo'limiga o'tadi — foydalanuvchi
 * uchun asosiy qiymat o'sha yerda.
 *
 * Eski bosh sahifa kodi `_bosh-sahifa-arxiv.tsx` faylida turibdi: nomi pastki
 * chiziq bilan boshlangani uchun u ekran sifatida ochilmaydi. Kerak bo'lmasa,
 * o'chirib yuborsa bo'ladi.
 */
export default function TabsIndex() {
  return <Redirect href="/(tabs)/opportunities" />;
}
