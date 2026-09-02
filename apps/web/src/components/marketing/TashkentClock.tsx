'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@ecwt/contracts';

/**
 * Toshkent vaqti — jonli soat.
 *
 * Vaqt ZONASI qat'iy: `Asia/Tashkent`. Ya'ni Nyu-Yorkdagi xaridor ham,
 * Toshkentdagi ishlab chiqaruvchi ham AYNAN bir xil raqamni ko'radi.
 * Bu ataylab: bu yerda "sizning vaqtingiz" emas, "biz ish vaqtimiz"
 * ko'rsatiladi.
 *
 * Server bilan mos kelmaslik muammosi. Next sahifani serverda ham
 * chizadi, va u yerdagi soniya brauzerdagidan boshqa bo'ladi —
 * React buni "hydration mismatch" deb xato beradi. Shuning uchun
 * birinchi chizishda vaqt umuman ko'rsatilmaydi: u faqat `useEffect`
 * ichida, ya'ni faqat brauzerda paydo bo'ladi.
 */

/** Har bir til uchun yorliq */
const LABEL: Record<Locale, string> = {
  uz: 'Toshkent',
  ru: 'Ташкент',
  en: 'Tashkent',
};

/**
 * Oy nomlari — qo'lda.
 *
 * `Intl` ga tashlab qo'yib bo'lmaydi: Chrome da `uz-UZ` uchun qisqa oy
 * nomi yo'q va u "M08" degan ichki belgini qaytaradi. Uch til uchun
 * jami 36 ta so'z — buni yozib qo'ygan arzon.
 */
const MONTHS: Record<Locale, readonly string[]> = {
  uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'],
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

function format(locale: Locale): { time: string; date: string } {
  const now = new Date();
  const tz = 'Asia/Tashkent';

  // Soat, kun va oy bitta chaqiruvdan olinadi: aks holda yarim tunda
  // ikki chaqiruv orasida kun almashib, sana bilan vaqt bir-biriga
  // mos kelmay qolishi mumkin.
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    day: 'numeric',
    month: 'numeric',
  }).formatToParts(now);

  const get = (t: string) => parts.find((x) => x.type === t)?.value ?? '';

  const time = `${get('hour')}:${get('minute')}:${get('second')}`;
  const month = MONTHS[locale][Number(get('month')) - 1] ?? '';
  const date = `${Number(get('day'))} ${month}`;

  return { time, date };
}

export function TashkentClock({ locale }: { locale: Locale }) {
  const [now, setNow] = useState<{ time: string; date: string } | null>(null);

  useEffect(() => {
    const tick = () => setNow(format(locale));
    tick();

    // Soniya chegarasiga tekislaymiz: aks holda soat "sakrab" yuradi —
    // ba'zan bir soniyani ikki marta, ba'zan birini butunlay tashlab.
    let interval: number | undefined;
    const align = window.setTimeout(() => {
      tick();
      interval = window.setInterval(tick, 1000);
    }, 1000 - (Date.now() % 1000));

    return () => {
      window.clearTimeout(align);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [locale]);

  return (
    <div
      className="flex items-center gap-2.5 rounded-full border border-white/14 bg-white/[0.04] py-1.5 pl-3 pr-3.5 backdrop-blur-md sm:gap-3 sm:py-2 sm:pl-4 sm:pr-4.5"
      title={`${LABEL[locale]} — UTC+5`}
    >
      {/* Tirik ekanini ko'rsatuvchi nuqta */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-[#4FE0FF] opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4FE0FF]" />
      </span>

      <span className="flex flex-col gap-0.5 leading-none">
        <span className="flex items-baseline gap-1.5">
          {/* `tabular-nums` bo'lmasa raqam kengligi o'zgarib, soat
              har soniyada sal siljib turadi. */}
          <span className="font-mono text-[15px] font-semibold tabular-nums text-white sm:text-[17px]">
            {/* Serverda bo'sh: joy egallab tursin, lekin raqam bo'lmasin */}
            {now ? now.time : '  :  :  '}
          </span>
          <span className="hidden text-[12px] font-medium text-brand-200 sm:inline">
            {now?.date}
          </span>
        </span>
        <span className="text-[9.5px] font-medium uppercase tracking-[0.14em] text-brand-200">
          {LABEL[locale]}
        </span>
      </span>
    </div>
  );
}
