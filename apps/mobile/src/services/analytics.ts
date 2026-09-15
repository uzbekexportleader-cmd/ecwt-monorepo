import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';
import type { AnalyticsEventInput, AnalyticsEventName } from '@ecwt/types';

import { api } from '../api/client';

/**
 * Mahsulot analitikasi (voronka).
 *
 * Nima uchun o'z yechimimiz: uchinchi tomon SDK'lari (Amplitude, Firebase)
 * qurilma identifikatori va reklama ID'sini ham yig'adi. Bu yerda esa
 * hunarmandning shaxsiy ma'lumotlari bilan ishlaymiz — ma'lumot o'z
 * serverimizdan chiqmagani ma'qul. Bizga kerak bo'lgan yagona savol:
 * "anketaning qaysi qadamida odamlar to'xtab qolyapti?"
 *
 * Yig'ilmaydi: ism, telefon, JShShIR, manzil, hujjat — hech qachon.
 */

/** Hodisalar shu miqdorga yetganda darhol yuboriladi */
const BATCH_SIZE = 10;

/** Yoki shu vaqt o'tganda (ms) */
const FLUSH_INTERVAL_MS = 15_000;

/**
 * Navbat cheklovi: internet uzoq vaqt bo'lmasa xotira to'lib ketmasin.
 * Limitdan oshganda eng eskilari tashlanadi — yangi hodisalar qimmatroq.
 */
const MAX_QUEUE = 100;

const queue: AnalyticsEventInput[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let sending = false;

const appVersion = Constants.expoConfig?.version ?? undefined;

/**
 * Hodisani navbatga qo'yadi.
 *
 * Hech qachon `throw` qilmaydi va hech narsani kutmaydi — analitika
 * mahsulot oqimini sekinlashtirmasligi yoki buzmasligi shart.
 */
export function track(
  name: AnalyticsEventName,
  props?: Record<string, string | number | boolean | null>,
): void {
  queue.push({ name, props, occurredAt: new Date().toISOString() });

  if (queue.length > MAX_QUEUE) {
    queue.splice(0, queue.length - MAX_QUEUE);
  }

  if (queue.length >= BATCH_SIZE) {
    void flush();
    return;
  }
  scheduleFlush();
}

function scheduleFlush(): void {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    void flush();
  }, FLUSH_INTERVAL_MS);
}

/**
 * Navbatni serverga yuboradi.
 *
 * Xato bo'lsa (internet yo'q) hodisalar navbatga QAYTARILADI — keyingi
 * urinishda yuboriladi. Shu sabab offline paytdagi voronka ham yo'qolmaydi.
 */
export async function flush(): Promise<void> {
  if (sending || queue.length === 0) return;

  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  const batch = queue.splice(0, BATCH_SIZE);
  sending = true;
  try {
    await api.analytics.send({
      events: batch,
      appVersion,
      platform: Platform.OS,
    });
  } catch {
    // Yuborilmadi — boshiga qaytaramiz (tartib saqlanadi)
    queue.unshift(...batch);
    if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
  } finally {
    sending = false;
  }

  // Navbatda yana bor bo'lsa davom etamiz
  if (queue.length > 0) scheduleFlush();
}

/**
 * Ilova fonga o'tganda navbatni yuboradi.
 *
 * Bu eng muhim moment: foydalanuvchi anketani tashlab ketganda ilova fonga
 * o'tadi — aynan o'sha hodisa bizga kerak.
 */
export function startAnalytics(): () => void {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'background' || state === 'inactive') void flush();
  });
  return () => {
    sub.remove();
    if (timer) clearTimeout(timer);
  };
}
