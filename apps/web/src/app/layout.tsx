import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import './globals.css';

/**
 * Plus Jakarta Sans — butun sayt uchun interfeys shrifti.
 *
 * Avval Inter ishlatilgan edi (neytral, lekin "oddiy" — deyarli har
 * qanday saytda uchraydi). Egasi butun saytning shriftini "10/10,
 * premium" qilishni so'radi — Plus Jakarta Sans xuddi shu maqsadda
 * ko'plab premium mahsulot saytlarida ishlatiladi: Inter kabi
 * professional/aniq, lekin harflarning o'ziga xos siyrak, biroz
 * "yumshoq burchakli" shakli bor — shuning uchun neytral EMAS,
 * KO'ZGA TASHLANADIGAN xarakter beradi.
 *
 * Sarlavha (`TypewriterHeadline`) uchun ikkita boshqa display shrift
 * (Bricolage Grotesque, keyin Outfit) sinaldi — ikkalasi ham egasiga
 * "juda qalin/semiz" ko'rindi. Oxir-oqibat sarlavha ham AYNAN shu
 * shriftga (`font-sans`) o'tkazildi — "Ro'yxatdan o'tish" tugmasi
 * ichidagi matn bilan BIR XIL shrift bo'lsin, dedi.
 *
 * `next/font` shriftni qurish paytida yuklab olib, loyihaning o'ziga
 * joylashtiradi: ish paytida Google'ga hech qanday so'rov ketmaydi.
 * `latin-ext` to'plami o'zbek lotinidagi belgilar uchun kerak.
 */
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

/**
 * Cormorant Garamond — sarlavha (`TypewriterHeadline`) uchun.
 *
 * Bir nechta sans-serif variant (Bricolage Grotesque, Outfit,
 * Plus Jakarta Sans) sinaldi — hammasi egasiga "qalin/semiz"
 * ko'rindi. Egasi keyin nafis, INGICHKA KLASSIK SERIF namunasi
 * (Canva shablonidagi "Blue Wood" yozuvi) ko'rsatdi — Cormorant
 * Garamond xuddi shunga mos: yupqa, baland, nafis serif harflar.
 * `weight: '500'` — oldingi 600/700'dan yengilroq, "Blue Wood"dagi
 * kabi nozik chiziqlar uchun.
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
  weight: ['500', '600'],
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
      className={`${plusJakarta.variable} ${cormorant.variable}`}
    >
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  );
}
