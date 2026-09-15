import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';

/**
 * Sentry ishga tushirilishi.
 *
 * Bu fayl `main.ts` dan ENG BIRINCHI import qilinadi: Sentry NestJS
 * modullaridan oldin yoqilishi kerak, aks holda avtomatik instrumentatsiya
 * (HTTP, Prisma) ulanmay qoladi.
 *
 * DSN bo'lmasa hech narsa yoqilmaydi — lokal ishlab chiqishda sozlash
 * shart emas.
 *
 * MAXFIYLIK: ilova pasport, JShShIR va bank rekvizitlari bilan ishlaydi.
 * `sendDefaultPii: false` — IP va so'rov tanasi yuborilmaydi.
 */
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    sendDefaultPii: false,

    /**
     * Oxirgi himoya: so'rov tanasi va sarlavhalarida token, telefon yoki
     * hujjat raqami bo'lishi mumkin — ular Sentry'ga chiqmasligi shart.
     */
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        delete event.request.headers;
        delete event.request.query_string;
      }
      delete event.user;
      return event;
    },
  });
}

/** Xatolarni kuzatish yoqilganmi (filtrlar shu bo'yicha qaror qiladi) */
export const sentryEnabled = Boolean(dsn);

export { Sentry };
