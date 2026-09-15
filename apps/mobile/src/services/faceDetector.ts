import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * ML Kit yuz aniqlash mavjudmi?
 *
 * `react-native-vision-camera` va ML Kit — native modullar. Ular ilovaning
 * o'ziga qadalgan bo'lishi kerak, Expo Go ichida ular yo'q. Shu sababli
 * ekran ikki xil ishlaydi:
 *
 *   • Expo Go     — kamera `expo-camera` orqali, yuz avtomatik aniqlanmaydi,
 *                   foydalanuvchi "Suratga olish" ni o'zi bosadi;
 *   • O'z ilovada — ML Kit ishlaydi, ramka yuz to'g'ri joylashganda yashil
 *                   bo'ladi va surat o'zi olinadi.
 *
 * Bu funksiya qaysi holatda ekanini aytadi. `storeClient` — bu Expo Go.
 */
export function isFaceDetectorAvailable(): boolean {
  // Brauzerda native modul umuman bo'lmaydi
  if (Platform.OS === 'web') return false;
  // 'storeClient' — Expo Go. Qolgan holatlarda modullar ilovaga qadalgan.
  return Constants.executionEnvironment !== 'storeClient';
}
