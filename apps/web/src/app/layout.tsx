import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import './globals.css';

/**
 * Inter — interfeys shrifti (Freshman spec'idagi TT Firs Neue o'rniga).
 *
 * `next/font` shriftni qurish paytida yuklab olib, loyihaning o'ziga
 * joylashtiradi: ish paytida Google'ga hech qanday so'rov ketmaydi.
 * Prezentatsiya internetsiz o'tsa ham shrift joyida qoladi.
 *
 * `latin-ext` to'plami o'zbek lotinidagi belgilar uchun kerak.
 */
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
});

/**
 * Cormorant Garamond — "premium" sarlavha shrifti.
 *
 * `globals.css` da `--font-display` bu shriftga ishora qilib kelgan
 * (Freshman spec'idagi Editorial New o'rniga), lekin shrift hech qachon
 * yuklanmagan edi — `font-display` klassi mavjud bo'lsa ham, harfiy
 * jihatdan hech narsani o'zgartirmasdi. Endi ulandi.
 *
 * ⚠️ Kirill yo'q: Google Fonts'dagi Cormorant Garamond faqat lotin
 * to'plamlarini beradi. Rus tilidagi sarlavha shuning uchun
 * `globals.css` dagi zaxira zanjiriga tushadi (`ui-serif, Georgia,
 * serif`) — bu ham serif, lekin boshqa shrift. Kirill uchun ham xuddi
 * shu ko'rinishni xohlasa, butunlay boshqa (Kirill qo'llab-quvvatlaydigan)
 * shrift kerak bo'ladi.
 */
const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-cormorant',
});


/**
 * Ildiz layout — faqat `<html>` va `<body>`.
 *
 * `lang` atributi middleware qo'ygan sarlavhadan olinadi: shunda 404 kabi
 * til segmentidan tashqaridagi sahifalarda ham to'g'ri til ko'rsatiladi
 * (skrinreader va qidiruv tizimlari uchun muhim).
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const headerLocale = headerList.get('x-ecwt-locale');
  const lang = headerLocale && isLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;

  return (
    <html
      lang={lang}
      className={`${inter.variable} ${cormorant.variable}`}
    >
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  );
}
