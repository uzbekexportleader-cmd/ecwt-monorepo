'use client';

import { useEffect, useRef, useState } from 'react';

type Phase = 'typing' | 'pausedFull' | 'fading' | 'pausedEmpty';

/** Bir SO'Z yozilishi orasidagi kechikish (harf emas — pastga qarang) */
const TYPE_MS = 140;
/** Gap TO'LIQ yozilib bo'lgach, o'chishdan oldin necha vaqt turadi.
 *  O'qish uchun yetarli bo'lishi kerak — 1800ms, keyin 3200ms ham
 *  kamlik qildi ("o'qib ulgurmasdan keyingisi boshlanyapti"). */
const HOLD_FULL_MS = 4200;
/** "Shamol uchirgan qum" animatsiyasining davomiyligi */
const FADE_MS = 900;
/** Uchib ketgach, keyingi gap yozila boshlashidan oldingi tin olish */
const HOLD_EMPTY_MS = 300;

interface TypewriterHeadlineProps {
  /** Ketma-ket ko'rsatiladigan gaplar — kamida ikkitasi bo'lishi kerak */
  phrases: readonly string[];
  className?: string;
}

/**
 * Sarlavhada bir gap yozilib, erib, keyingisi yoziladigan effekt.
 *
 * ── Nega `setInterval` emas, rekursiv `setTimeout` ──────────────────
 * Yozish tezligi, to'la turish va erish — uchalasining davomiyligi
 * boshqa-boshqa. `setInterval` bitta qat'iy davrga qulflaydi; holat
 * mashinasi (`Phase`) esa har bosqichda o'zining kechikishini
 * tanlaydi.
 *
 * ── Kirish — yozib, chiqish — shamolda uchib ────────────────────────
 * Ilgari gap harf-harf O'CHIRILARDI (backspace kabi) — bu mexanik
 * ko'rindi. Keyin oddiy `opacity` erishiga o'tkazildi, lekin egasi
 * buni ham "oddiy o'chish" deb topdi va "qum shamolda uchib
 * ketgandek" so'radi. Endi chiqish uchta xususiyatni BIRGA
 * animatsiya qiladi: `opacity` (yo'qoladi), `translateX` (o'ngga
 * suriladi — shamol yo'nalishi) va `blur` (uchayotgan zarralar
 * singari tarqaladi). Kirish (yozish) esa ASIMMETRIK ravishda oddiy —
 * so'zlar bir-bir teriladi, hech qanday effektsiz.
 *
 * ── Nega HARF emas, SO'Z bilan teriladi ──────────────────────────────
 * Uchinchi (va asosiy) "sakrash" manbai shu yerda edi. Matn ikki
 * qatorga o'raladi. Harf-harf terilganda, qatorning oxiridagi so'z
 * o'sib-o'sib birdan qatorga sig'may qoladi — brauzer uni BUTUNLAY
 * ikkinchi qatorga ko'chiradi. Natijada 1-qator matni bir zumda
 * qisqarib, ko'rinishi o'zgaradi: egasi buni "tepa-past bo'lib
 * sakrayapti" deb ta'rifladi. Bu na `text-balance`, na kursorning
 * aybi edi — oddiy matn ko'chirish qoidasining o'zi shunday ishlaydi.
 *
 * Yechim: HECH QACHON so'z o'rtasida qatorga sig'may qolmasin — har
 * safar BUTUN so'z bir zumda qo'shiladi, hech qachon o'sib-o'sib
 * chetga chiqib qolmaydi. Shuning uchun `TYPE_MS` endi "bir harf"
 * emas, "bir so'z" uchun kechikish (140ms).
 *
 * Chiqish egri chizig'i ATAYLAB tezlashuvchi (`cubic-bezier(0.4,0,1,1)`
 * — "ease-in"): shamol zarrani birdan emas, asta tezlashib olib
 * ketadi. Faqat CHIQISHDA animatsiyalanadi — qaytib holatga chiqish
 * esa ANIQ VA DARHOL (`transition: none`), aks holda bo'sh matn
 * ustida yangi gap harflari suriling-xira holda terila boshlardi.
 *
 * ── Boshlang'ich holat `pausedFull` ──────────────────────────────────
 * Server birinchi gapni TO'LIQ chiqaradi (hydration mos kelishi
 * uchun) — animatsiya uni qaytadan yozmaydi, faqat bir oz turgach
 * erishga o'tadi.
 *
 * ── `prefers-reduced-motion` ─────────────────────────────────────────
 * Foydalanuvchi harakatni kamaytirishni so'ragan bo'lsa, animatsiya
 * umuman ishga tushmaydi: birinchi gap statik turadi.
 *
 * ── Balandlik bu yerda BOSHQARILMAYDI ────────────────────────────────
 * Konteyner balandligini qat'iy ushlab turish (`page.tsx` dagi
 * `h-[...] overflow-hidden`) chaqiruvchining vazifasi — bu komponent
 * faqat matnni yozadi/eritadi.
 */
export function TypewriterHeadline({ phrases, className }: TypewriterHeadlineProps) {
  const [text, setText] = useState(phrases[0] ?? '');
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const phraseIndex = useRef(0);
  /** Necha SO'Z ko'rsatilgan (harf emas — yuqoridagi izohga qarang) */
  const wordIndex = useRef((phrases[0] ?? '').split(' ').length);
  const phase = useRef<Phase>('pausedFull');

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (reduced || phrases.length <= 1) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = phrases[phraseIndex.current % phrases.length] ?? '';
      const words = current.split(' ');

      switch (phase.current) {
        case 'typing':
          wordIndex.current += 1;
          setText(words.slice(0, wordIndex.current).join(' '));
          if (wordIndex.current >= words.length) {
            phase.current = 'pausedFull';
            timeoutId = setTimeout(tick, HOLD_FULL_MS);
          } else {
            timeoutId = setTimeout(tick, TYPE_MS);
          }
          break;

        case 'pausedFull':
          phase.current = 'fading';
          setVisible(false);
          timeoutId = setTimeout(tick, FADE_MS);
          break;

        case 'fading':
          setText('');
          setVisible(true);
          wordIndex.current = 0;
          phraseIndex.current += 1;
          phase.current = 'pausedEmpty';
          timeoutId = setTimeout(tick, HOLD_EMPTY_MS);
          break;

        case 'pausedEmpty':
          phase.current = 'typing';
          timeoutId = setTimeout(tick, TYPE_MS);
          break;
      }
    };

    timeoutId = setTimeout(tick, HOLD_FULL_MS);

    return () => clearTimeout(timeoutId);
  }, [phrases, reduced]);

  return (
    <span
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(2.5em) scale(0.94)',
        filter: visible ? 'blur(0px)' : 'blur(10px)',
        // Faqat "uchib ketish" tomoni animatsiyalanadi. Qaytib
        // holatga chiqish darhol (`transition: none`) — izohda
        // tushuntirilgan sababga ko'ra.
        transition: visible
          ? 'none'
          : `opacity ${FADE_MS}ms cubic-bezier(0.4,0,1,1), transform ${FADE_MS}ms cubic-bezier(0.4,0,1,1), filter ${FADE_MS}ms cubic-bezier(0.4,0,1,1)`,
        // `inline-block` EMAS, `block`. Ikkalasi ham transform'ni
        // ishga tushiradi, lekin `inline-block` matn oqimidagi
        // `vertical-align: baseline` qoidasiga bo'ysunadi — matn 1
        // qatordan 2 qatorga o'tganda balandligi o'zgaradi, demak
        // "asos chizig'i" ham qayta hisoblanadi va BUTUN BLOK
        // tepaga-pastga siljib ko'rinadi (egasi "sakraydi" deb
        // ta'rifladi). `block` esa oddiy yuqoridan pastga oqadi,
        // hech qanday asos-chiziq hisobisiz.
        display: 'block',
      }}
    >
      {text}
      {!reduced && (
        // Oddiy `inline-block` EMAS — u alohida quti sifatida
        // qator balandligi hisobiga ta'sir qilardi (`vertical-align:
        // middle` + qat'iy `height` matnning o'z qator balandligidan
        // farq qilardi). Bu esa 1-qatordan 2-qatorga o'tganda
        // BALANDLIK BIR NECHA MARTA qayta hisoblanishiga sabab
        // bo'lgan — aynan shu "sakrash"ning ikkinchi manbai edi
        // (`text-balance` birinchisi edi).
        //
        // Endi kursor oddiy MATN BELGISI (`▍`), boshqa harflar kabi
        // oqimda turadi — hech qanday alohida quti, hech qanday
        // balandlik hisobi. Faqat shaffofligi miltillaydi.
        <span aria-hidden="true" className="animate-pulse">
          ▍
        </span>
      )}
    </span>
  );
}
