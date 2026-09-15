import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';

/**
 * Xatolarni kuzatish (Sentry).
 *
 * NEGA KERAK: hozir foydalanuvchida ilova qulasa, biz bu haqda faqat u
 * qo'ng'iroq qilsa bilamiz. Hunarmand esa qo'ng'iroq qilmaydi — shunchaki
 * ilovadan voz kechadi.
 *
 * MAXFIYLIK: bu ilova pasport, JShShIR va bank rekvizitlari bilan ishlaydi.
 * Shuning uchun quyida yuborilayotgan ma'lumot ataylab cheklangan:
 * `sendDefaultPii: false` va so'rov tanalari (body) yuborilmaydi.
 */

/** DSN bo'lmasa Sentry umuman yoqilmaydi — lokal ishlab chiqish uchun qulay */
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

let enabled = false;

export function initMonitoring(): void {
  if (!DSN) return;

  Sentry.init({
    dsn: DSN,
    // Ishlab chiqish paytidagi xatolar Sentry'ni ifloslantirmasin
    enabled: !__DEV__,
    environment: __DEV__ ? 'development' : 'production',
    release: Constants.expoConfig?.version,

    /**
     * Shaxsiy ma'lumot yuborilmaydi: IP, qurilma nomi, foydalanuvchi
     * ma'lumotlari Sentry'ga tushmaydi.
     */
    sendDefaultPii: false,

    // Productionda 10% — limitni yemaydi, lekin tendensiya ko'rinadi
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,

    /**
     * Oxirgi himoya: nafasi o'tib ketgan ma'lumot bo'lsa ham chiqib
     * ketmasin. So'rov tanasi va sarlavhalarida token/telefon bo'lishi
     * mumkin — ularni butunlay olib tashlaymiz.
     */
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        delete event.request.headers;
      }
      delete event.user;
      return event;
    },
  });

  enabled = true;
}

/**
 * Kutilgan, lekin muhim xatolarni qo'lda yuborish uchun.
 * (Masalan: hujjat yuklash muvaffaqiyatsiz tugadi.)
 */
export function captureError(error: unknown, context?: Record<string, string>): void {
  if (!enabled) return;
  Sentry.captureException(error, context ? { tags: context } : undefined);
}

/**
 * Foydalanuvchini xatoga bog'laydi — faqat ID bilan.
 * Telefon raqami yoki ism YUBORILMAYDI.
 */
export function setMonitoringUser(userId: string | null): void {
  if (!enabled) return;
  Sentry.setUser(userId ? { id: userId } : null);
}

/**
 * Xato oldidan nima bo'lganini ko'rsatuvchi iz (breadcrumb).
 * Masalan: qaysi qadamda edi, qaysi tugmani bosdi.
 */
export function addBreadcrumb(message: string, data?: Record<string, string | number>): void {
  if (!enabled) return;
  Sentry.addBreadcrumb({ message, data, level: 'info' });
}

export { Sentry };
