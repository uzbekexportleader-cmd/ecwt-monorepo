import { Platform } from 'react-native';
import { File } from 'expo-file-system';

import { api } from '../api/client';

/**
 * Yuz suratini serverga yuboradi va tekshiruvni ishga tushiradi.
 *
 * Ikkala kamera ekrani (Expo Go va ML Kit versiyasi) bir xil yo'ldan
 * yuboradi, shu sababli alohida joyda turadi.
 *
 * MUHIM — platformalar faylni turlicha uzatadi:
 *
 *   Brauzerda  `uri` — blob: yoki data: manzili; undan haqiqiy `Blob`
 *              olinadi.
 *   Telefonda  Expo SDK 57 `fetch`'ining o'zi FormData qismlarini qat'iy
 *              tekshiradi: qism yoki satr, yoki `Blob`, yoki `bytes()`
 *              metodiga ega obyekt bo'lishi shart. Ilgari ishlatilgan
 *              `{ uri, name, type }` oddiy obyekti (React Native'ning eski
 *              XMLHttpRequest uslubi) endi tanilmaydi va
 *              "Unsupported FormDataPart implementation" xatosi bilan
 *              yiqilardi. `expo-file-system`'ning `File` klassi `Blob`
 *              interfeysini amalga oshiradi — shu orqali fayl haqiqiy
 *              baytlar sifatida o'qib yuboriladi.
 */
export async function uploadSelfie(uri: string): Promise<void> {
  const form = new FormData();
  form.append('type', 'SELFIE');

  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('file', blob, 'yuz.jpg');
  } else {
    const file = new File(uri);
    form.append('file', file, 'yuz.jpg');
  }

  await api.documents.upload(form);
  await api.profile.verify('face');
}
