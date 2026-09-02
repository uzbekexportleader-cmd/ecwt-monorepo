'use client';

import { useEffect, useRef, useState } from 'react';

type Phase = 'typingTitle' | 'typingSub' | 'pausedFull' | 'fading' | 'pausedEmpty';

/** Sarlavha necha qatorga bo'linadi (egasi "3 ta qisqa qator" so'radi) */
const MAX_TITLE_LINES = 3;
/**
 * Qator chegaralarini TOPISH uchun ishlatiladigan "sun'iy tor" kenglik
 * — h1'ning HAQIQIY kengligining shu ulushi.
 *
 * ── Nega kerak: haqiqiy kenglikda ko'pi bilan 1 QATOR bo'lardi ────────
 * Sarlavha matnlari (masalan "Hammasi shu yerdan boshlanadi") h1'ning
 * TO'LIQ kengligida (yirik shriftda ham) osongina BITTA qatorga
 * sig'ib ketardi — egasi esa "3 ta QISQA qator" so'radi. Yechim:
 * qatorlarga BO'LISH uchun brauzerga h1'ning haqiqiy emas, SUN'IY
 * TORROQ (shu koeffitsientga ko'paytirilgan) kenglikni "ko'rsatamiz"
 * — shu tor kenglikda matn tabiiy ravishda ko'proq (taxminan 3 ta)
 * qatorga bo'linadi. LEKIN chiqqan QATOR MATNLARINING O'ZI keyin
 * HAQIQIY (kengroq) konteynerga joylashtiriladi — ular sun'iy tor
 * kenglikka nisbatan hisoblanganligi uchun haqiqiy (kengroq) joyga
 * albatta ORTIQCHASI bilan sig'adi, demak ICHKARIDA QAYTA KO'CHISH
 * (bu ilgari "3-qatorga toshib ketish" bugini keltirib chiqargan edi)
 * XAVFI YO'Q.
 */
const SPLIT_WIDTH_RATIO = 0.44;
/**
 * h1'ning QAT'IY balandligi — `em`larda, bazaviy (100%) shrift
 * o'lchamiga nisbatan (pastga qarang, `fontSize` bilan bir xil
 * mantiq).
 *
 * ── Nega BUTUNLAY BOSHQA joyda (Tailwind `h-[3.2em]`da) EMAS ─────────
 * Avval bu qiymat `titleClassName`ning ichida oddiy Tailwind
 * `h-[3.2em]` klassi sifatida turardi. LEKIN `em` HAR DOIM shu
 * ELEMENTNING O'ZINING joriy shriftiga nisbatan hisoblanadi — va h1
 * shrifti (`fontScale`) HAR GAP uchun turlicha KICHRAYADI (uzun
 * gaplar 3 qatorga sig'ishi uchun). Natijada "qat'iy" `3.2em`
 * balandlik HAR GAPDA BOSHQA-BOSHQA piksel qiymatiga aylanardi —
 * ba'zi gaplarda h1 balandligi 100+px farq qilib, ostidagi
 * "Ro'yxatdan o'tish" tugmasini tepaga-pastga "sakratardi". Yechim:
 * xuddi `fontSize`dagi kabi, balandlikni ham piksellarda, FAQAT
 * bazaviy (100%) shriftga nisbatan hisoblaymiz — shunda u fontScale
 * qanchalik kichraysa ham HECH QACHON o'zgarmaydi.
 */
const TITLE_HEIGHT_EM = 3.2;
/** Bir harf yozilishi orasidagi kechikish */
const TYPE_MS = 30;
/** Ikki qator (yoki sarlavha->izoh) orasidagi kichik tin olish */
const LINE_GAP_MS = 180;
/** Hammasi TO'LIQ yozilib bo'lgach, o'chishdan oldin necha vaqt turadi */
const HOLD_FULL_MS = 4200;
/** O'ngdan chapga o'chirish (erase) animatsiyasining HAR BIR bosqich davomiyligi */
const ERASE_MS = 700;
/**
 * Ketma-ket o'chirish jami davomiyligi: PASTKI qatordan (+ izoh)
 * boshlab, bir-birlab TEPAGA qarab TO'LIQ o'chib bo'lgach, ustidagisi
 * o'chiy boshlaydi — ikkitasi hech qachon bir vaqtda o'chmaydi.
 */
const TOTAL_ERASE_MS = ERASE_MS * MAX_TITLE_LINES;
/** Butunlay o'chib bo'lgach, keyingi gap yozila boshlashidan oldingi tin olish */
const HOLD_EMPTY_MS = 300;

/** Bitta aylanadigan "slayd": yirik sarlavha + ostidagi kichik izoh */
export interface HeroSlide {
  title: string;
  sub: string;
}

interface TypewriterHeadlineProps {
  /** Ketma-ket ko'rsatiladigan slaydlar — kamida ikkitasi bo'lishi kerak */
  phrases: readonly HeroSlide[];
  /** `<h1>` ga qo'llanadigan klasslar */
  titleClassName?: string;
  /** Sarlavha ostidagi izoh qatoriga qo'llanadigan klasslar */
  subClassName?: string;
}

/**
 * Har bir slaydning SARLAVHASI uchta QAT'IY, OLDINDAN HISOBLANGAN
 * qatorga yozilib, so'ng ostida IZOH qatori yoziladi; o'chirilganda
 * esa qatorlar PASTDAN TEPAGA qarab, bittalab, TO'LIQ O'NGDAN CHAPGA
 * o'chiydi — ikkitasi hech qachon bir vaqtda o'chmaydi — va keyingi
 * slayd boshlanadi.
 *
 * ── Uzun tarix: bir necha marta "sakrash" chiqdi ────────────────────
 * Avval matn TABIIY (brauzerning o'zi) ko'chirilardi. Bu uch xil
 * shaklda muammo berdi: `text-balance` qayta muvozanatlardi, kursor
 * asos chizig'ini buzardi, va eng asosiysi — harf-harf terilganda
 * qator oxiridagi so'z o'sib-o'sib keyingi qatorga ko'chib ketardi.
 * Keyin BITTA QATORGA majburlab, avtomatik kichraytirish sinaldi —
 * lekin egasi buni yoqtirmadi, "har qator to'liq yozilib bo'lib,
 * keyin keyingisi" ko'rinishini so'radi.
 *
 * ── Yechim: qator chegaralari OLDINDAN hisoblanadi ──────────────────
 * Brauzerga "qayerda ko'chirishni" QAROR QILDIRISH o'rniga, sarlavha
 * yozila boshlashidan OLDIN qaysi so'zlar qaysi qatorga tushishi bir
 * marta hisoblanadi (`computeFit`) — ko'rinmas o'lchov elementida
 * to'liq matn joylashtirilib, `Range` orqali har harfning qaysi
 * qatorda turishi tekshiriladi. Shundan keyin har qator MUSTAQIL,
 * ALOHIDA harf-harf yoziladi — biri TO'LIQ tugagach, keyingisi
 * boshlanadi. Qator chegaralari hech qachon QAYTA HISOBLANMAYDI,
 * shuning uchun oldingi qatorlar hech qachon o'zgarmaydi, "sakramaydi".
 *
 * ── OGOHLANTIRISH: matnni HARF-HARF alohida `<span>`ga BO'LMANG ─────
 * Bir marta "rang o'zgarib so'nish" effekti uchun har bir harf
 * o'zining `<span>`iga o'ralgan edi — natijada brauzer so'zlarni
 * HARFLAR ORASIDA HAM bo'la boshladi (chunki har bir harf endi
 * alohida "quti", va qutilar orasida qator ko'chirish joizdir),
 * sarlavha so'z o'rtasidan ikkiga bo'linib, hatto ortiqcha qatorga
 * toshib ketdi. Hozirgi "o'ngdan chapga o'chirish" effekti esa BUTUN
 * qatorni (bitta `<span>`) `clip-path` orqali FAQAT O'NG chekkadan
 * chapga qarab yeydi — matn DOM'da hamon oddiy, uzluksiz satr,
 * harflarga bo'linmagan.
 */
export function TypewriterHeadline({ phrases, titleClassName, subClassName }: TypewriterHeadlineProps) {
  const [lines, setLines] = useState<string[]>(() => Array(MAX_TITLE_LINES).fill(''));
  const [subText, setSubText] = useState('');
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const phraseIndex = useRef(0);
  const charIndex = useRef(0);
  const lineIndex = useRef(0);
  const phase = useRef<Phase>('typingTitle');
  const targetLines = useRef<string[]>(Array(MAX_TITLE_LINES).fill(''));
  const targetSub = useRef('');
  const titleRef = useRef<HTMLHeadingElement>(null);
  /**
   * 100% shrift o'lchami (piksellarda), FAQAT BIR MARTA o'lchanadi.
   *
   * Nega kerak: har safar yangi sarlavha uchun mos keladigan
   * kichraytirish hisoblanadi (`fontScale`), va u CSS orqali shu
   * elementning o'ziga qo'llanadi. Agar keyingi o'lchov yana shu
   * elementning JORIY (allaqachon kichraytirilgan) shriftidan
   * boshlansa, har safar asl o'lcham yo'qolib, xato kichrayib
   * boraverardi.
   */
  const baseFontSizeRef = useRef<number | null>(null);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  /**
   * O'NGDAN CHAPGA o'chirilish: gap tugab, bir oz turgach, matnning
   * O'NG chekkasi chapga qarab siljib, matnni "yeb kirib" boradi —
   * oxirida faqat chap chekka qoladi.
   *
   * ── Nega `width: fit-content` SHART ────────────────────────────────
   * `clip-path` foizi ELEMENT QUTISINING kengligiga nisbatan
   * hisoblanadi. Agar quti h1/p ning BUTUN kengligini egallasa, foiz
   * matn oxiridan emas, QUTI oxiridan hisoblanardi — o'ng chekka
   * matnning haqiqiy oxiriga to'g'ri kelmasdi. `fit-content` esa
   * qutini ANIQ matn kengligiga moslashtiradi.
   *
   * Tepa/past chegaralar 0 EMAS, MANFIY (-0.2em / -0.4em) — "g", "y"
   * kabi harflarning pastki "dumi" tor qator balandligidan bir oz
   * chiqib turishi mumkin (leading 0.98 juda tor); aniq 0 chegarada
   * `clip-path` bu qismni kesib tashlardi.
   *
   * ── `delayMs` — KETMA-KET o'chirish uchun ───────────────────────────
   * Egasi qatorlar BIR VAQTDA emas, PASTDAN TEPAGA qarab, biri
   * TO'LIQ tugagach ustidagisi boshlansin dedi. Buni alohida
   * state/timer bilan emas, oddiygina CSS `transition-delay` bilan
   * hal qilindi: ENG PASTKI qator (+ izoh) delaysiz (0ms) boshlaydi,
   * har ustidagi qator bir bosqich (`ERASE_MS`) kechroq boshlaydi —
   * bitta umumiy `visible=false` signalidan bir nechta mustaqil
   * vaqtda boshlanadigan animatsiya kelib chiqadi.
   *
   * ── Nega `display: 'inline-block'`, `'block'` EMAS ──────────────────
   * Izoh (`subText`) `<p>` ICHIDA render qilinadi, va HTML qoidasiga
   * ko'ra `<p>` faqat "phrasing content" (matn/inline elementlar)ni
   * o'z ichiga OLA OLADI — BLOK elementni emas. `display:'block'`li
   * `<span>` `<p>` ichiga qo'yilsa, brauzer buni NOTO'G'RI HTML deb
   * hisoblab, `<p>`ni O'ZI yopib, DOM'ni kutilmagan tarzda qayta
   * qurib qo'yardi. `inline-block` ham BLOK kabi o'z-o'zidan mos
   * kengligini (`width:fit-content`) oladi, lekin HTML nuqtai
   * nazaridan "phrasing content" hisoblanib, `<p>` ichida TO'G'RI
   * joylashadi.
   *
   * ── `allowWrap` — IZOH yozilayotganda NEGA "sakrardi" ───────────────
   * `width:'fit-content'` (shrink-to-fit) BIR QATORLI matn uchun
   * barqaror (qatorlar hech qachon ko'chmaydi, `computeFit` buni
   * kafolatlaydi). LEKIN izoh matni UZUN bo'lsa 2 QATORGA KO'CHISHI
   * MUMKIN — va shrink-to-fit ALGORITMI "matn siqilmasdan sig'adimi"
   * chegarasiga juda YAQIN uzunliklarda BARQAROR ISHLAMAYDI: bir
   * harf qo'shilganda quti to'satdan "1 qatorga sig'adigan tor quti"
   * dan "to'liq kengga cho'zilib 2 qatorga ko'chgan quti" ga sakrab
   * o'tishi (yoki aksincha) mumkin — aynan shu "sakrash" ko'rinardi.
   * Yechim: YOZILAYOTGANDA (`visible && allowWrap`) qutini UMUMAN
   * cheklamaymiz — oddiy `inline` sifatida `<p>`ning O'ZINING (barqaror)
   * kengligida erkin ko'chadi. Faqat O'CHIRISH boshlanganda (matn
   * ALLAQACHON TO'XTAGAN, o'zgarmaydi) qutini `fit-content`ga
   * o'tkazamiz — shu payt hech qanday "sakrash" xavfi yo'q, chunki
   * matn endi o'sib-o'zgarmaydi.
   */
  function eraseBoxStyle(delayMs: number, allowWrap: boolean = false): React.CSSProperties {
    if (allowWrap && visible) {
      return { display: 'inline' };
    }
    return {
      display: 'inline-block',
      position: 'relative',
      width: 'fit-content',
      clipPath: visible ? 'inset(-0.2em 0 -0.4em 0)' : 'inset(-0.2em 100% -0.4em 0)',
      transition: visible ? 'none' : `clip-path ${ERASE_MS}ms ease-in ${delayMs}ms`,
    };
  }

  function createMeasurer(width: number, cs: CSSStyleDeclaration, fontSizePx: number): HTMLDivElement {
    const measurer = document.createElement('div');
    measurer.style.position = 'absolute';
    measurer.style.visibility = 'hidden';
    measurer.style.left = '-99999px';
    measurer.style.top = '0';
    measurer.style.width = `${width}px`;
    measurer.style.fontFamily = cs.fontFamily;
    measurer.style.fontSize = `${fontSizePx}px`;
    measurer.style.fontWeight = cs.fontWeight;
    measurer.style.letterSpacing = cs.letterSpacing;
    measurer.style.lineHeight = cs.lineHeight;
    measurer.style.whiteSpace = 'normal';
    return measurer;
  }

  function countLines(text: string, width: number, cs: CSSStyleDeclaration, fontSizePx: number): number {
    const measurer = createMeasurer(width, cs, fontSizePx);
    measurer.appendChild(document.createTextNode(text));
    document.body.appendChild(measurer);
    const range = document.createRange();
    range.selectNodeContents(measurer);
    const count = range.getClientRects().length;
    document.body.removeChild(measurer);
    return count;
  }

  /**
   * Ko'rsatilgan matnni ko'p qatorga bo'ladi (kamida `maxLines` taga
   * qadar) — brauzerning o'z tabiiy ko'chirish qoidasidan foydalanib,
   * lekin faqat BIR MARTA, animatsiya boshlanishidan oldin.
   *
   * `Range.getClientRects()` o'ralgan matn uchun HAR QATOR uchun
   * alohida to'rtburchak qaytaradi. Har bir harfni alohida o'ramga
   * (`Range`) olib, uning tepa chizig'i OLDINGI harfnikidan farq
   * qilgan joyni "qator chegarasi" deb belgilaymiz.
   */
  function splitIntoLines(
    text: string,
    width: number,
    cs: CSSStyleDeclaration,
    fontSizePx: number,
    maxLines: number,
  ): string[] {
    const out = Array(maxLines).fill('');
    const measurer = createMeasurer(width, cs, fontSizePx);
    const textNode = document.createTextNode(text);
    measurer.appendChild(textNode);
    document.body.appendChild(measurer);

    const fullRange = document.createRange();
    fullRange.selectNodeContents(measurer);
    const rects = fullRange.getClientRects();

    if (rects.length <= 1) {
      document.body.removeChild(measurer);
      out[0] = text;
      return out;
    }

    const boundaries: number[] = [];
    let currentTop: number | null = null;
    for (let i = 0; i < text.length; i += 1) {
      const charRange = document.createRange();
      charRange.setStart(textNode, i);
      charRange.setEnd(textNode, i + 1);
      const r = charRange.getBoundingClientRect();
      if (currentTop === null) {
        currentTop = r.top;
      } else if (Math.abs(r.top - currentTop) > 1) {
        boundaries.push(i);
        currentTop = r.top;
      }
    }

    document.body.removeChild(measurer);

    const parts: string[] = [];
    let start = 0;
    for (const b of boundaries) {
      parts.push(text.slice(start, b).trim());
      start = b;
    }
    parts.push(text.slice(start).trim());

    for (let i = 0; i < Math.min(parts.length, maxLines); i += 1) {
      out[i] = parts[i];
    }
    return out;
  }

  /**
   * Sarlavhani `MAX_TITLE_LINES` qatorga sig'diradi.
   *
   * ── Nega SHRIFT HECH QACHON kichraymaydi (`scale` doim 1) ────────────
   * Avval uzun gaplar uchun shrift kichraytirilar edi — natijada har
   * xil gaplar EKRANDA HAR XIL O'LCHAMDA chiqardi ("bir katta, bir
   * kichkina" — egasi buni yoqtirmadi). Endi shrift DOIM bir xil
   * (bazaviy) o'lchamda qoladi; buning o'rniga QATORGA BO'LISH uchun
   * ishlatiladigan "sinov kengligi" KENGAYTIRILADI: avval TOR
   * (`SPLIT_WIDTH_RATIO`) kenglikda necha qatorga bo'linishi
   * tekshiriladi (qisqa, "chiroyli" qatorlar uchun) — agar shu tor
   * kenglikda `MAX_TITLE_LINES`dan KO'P qator kerak bo'lsa (matn juda
   * uzun), sinov kengligi HAQIQIY kenglikka yetguncha bosqichma-bosqich
   * KENGAYTIRILADI, toki aynan `MAX_TITLE_LINES`ga sig'adigan eng TOR
   * (demak eng qisqa qatorli) variant topilguncha. Shrift esa bunga
   * umuman aloqasi yo'q — har doim bazaviy o'lchamda qoladi.
   */
  function computeFit(
    text: string,
    width: number,
    sample: HTMLElement,
  ): { scale: number; lines: string[] } {
    const cs = getComputedStyle(sample);
    if (baseFontSizeRef.current === null) {
      baseFontSizeRef.current = parseFloat(cs.fontSize);
    }
    const baseFontSize = baseFontSizeRef.current;

    let testWidth = width * SPLIT_WIDTH_RATIO;
    while (testWidth < width && countLines(text, testWidth, cs, baseFontSize) > MAX_TITLE_LINES) {
      testWidth = Math.min(testWidth * 1.25, width);
    }

    return { scale: 1, lines: splitIntoLines(text, testWidth, cs, baseFontSize, MAX_TITLE_LINES) };
  }

  useEffect(() => {
    if (reduced || phrases.length <= 1) return;
    const title = titleRef.current;
    if (!title) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const startPhrase = () => {
      const current = phrases[phraseIndex.current % phrases.length] ?? { title: '', sub: '' };
      const fit = computeFit(current.title, title.clientWidth, title);
      targetLines.current = fit.lines;
      targetSub.current = current.sub;
      setFontScale(fit.scale);
      charIndex.current = 0;
      lineIndex.current = 0;
      setLines(Array(MAX_TITLE_LINES).fill(''));
      setSubText('');
      phase.current = 'typingTitle';
      timeoutId = setTimeout(tick, TYPE_MS);
    };

    const tick = () => {
      const currentLines = targetLines.current;
      const sub = targetSub.current;

      switch (phase.current) {
        case 'typingTitle': {
          const currentLine = currentLines[lineIndex.current] ?? '';
          charIndex.current += 1;
          const idx = lineIndex.current;
          const nextText = currentLine.slice(0, charIndex.current);
          setLines((prev) => {
            const next = [...prev];
            next[idx] = nextText;
            return next;
          });
          if (charIndex.current >= currentLine.length) {
            charIndex.current = 0;
            let nextIdx = lineIndex.current + 1;
            while (nextIdx < currentLines.length && !currentLines[nextIdx]) nextIdx += 1;
            if (nextIdx < currentLines.length) {
              lineIndex.current = nextIdx;
              timeoutId = setTimeout(tick, LINE_GAP_MS);
            } else {
              phase.current = 'typingSub';
              timeoutId = setTimeout(tick, LINE_GAP_MS);
            }
          } else {
            timeoutId = setTimeout(tick, TYPE_MS);
          }
          break;
        }

        case 'typingSub':
          charIndex.current += 1;
          setSubText(sub.slice(0, charIndex.current));
          if (charIndex.current >= sub.length) {
            phase.current = 'pausedFull';
            timeoutId = setTimeout(tick, HOLD_FULL_MS);
          } else {
            timeoutId = setTimeout(tick, TYPE_MS);
          }
          break;

        case 'pausedFull':
          phase.current = 'fading';
          setVisible(false);
          timeoutId = setTimeout(tick, TOTAL_ERASE_MS);
          break;

        case 'fading':
          // Matnni ko'rinishga qaytarishdan OLDIN tozalash kerak — aks
          // holda eski gap bir zumga TO'LIQ qaytib ko'rinib, keyin
          // yo'qolardi ("sakrab qaytish" effekti).
          setLines(Array(MAX_TITLE_LINES).fill(''));
          setSubText('');
          setVisible(true);
          phraseIndex.current += 1;
          phase.current = 'pausedEmpty';
          timeoutId = setTimeout(startPhrase, HOLD_EMPTY_MS);
          break;

        default:
          break;
      }
    };

    // Birinchi slayd serverda TO'LIQ chiqqan (pastga qarang) —
    // animatsiya uni qaytadan yozmaydi, avval bir oz turadi.
    const first = phrases[0] ?? { title: '', sub: '' };
    const firstFit = computeFit(first.title, title.clientWidth, title);
    targetLines.current = firstFit.lines;
    targetSub.current = first.sub;
    setFontScale(firstFit.scale);
    setLines(targetLines.current);
    setSubText(first.sub);
    phase.current = 'pausedFull';
    timeoutId = setTimeout(tick, HOLD_FULL_MS);

    return () => clearTimeout(timeoutId);
  }, [phrases, reduced]);

  return (
    <>
      <h1
        ref={titleRef}
        // `title-outline-glow` (globals.css) — harflar atrofidagi OCH
        // KO'K konturni "yonib-yonib" pulsatsiya qildiradi. Shu sabab
        // bu kontur+porlash endi INLINE `style.textShadow` emas, CSS
        // KLASS orqali beriladi — inline style `@keyframes`ga
        // bog'lana OLMAYDI, animatsiya faqat klass orqali ishlaydi.
        className={`${titleClassName} title-outline-glow`}
        style={{
          // FOIZ EMAS, PIKSEL: `${fontScale*100}%` h1'ning O'Z Tailwind
          // klassi (masalan `text-[4.5rem]`) o'rniga h1'NING OTASI
          // shriftiga (standart 16px) nisbatan hisoblanardi — inline
          // `style.fontSize` klassdan KUCHLIROQ, shuning uchun katta
          // sarlavha kutilmaganda 16px atrofida cho'kib qolardi.
          // Piksel qiymati esa hech kimga bog'liq emas, har doim
          // to'g'ri hisoblanadi.
          //
          // `height` ham xuddi shu sababdan PIKSELDA: `TITLE_HEIGHT_EM`
          // izohiga qarang — `em`da qolsa, HAR GAP fontScale'iga qarab
          // balandlik o'zgarib, ostidagi tugmani "sakratardi".
          ...(baseFontSizeRef.current !== null
            ? {
                fontSize: `${baseFontSizeRef.current * fontScale}px`,
                height: `${baseFontSizeRef.current * TITLE_HEIGHT_EM}px`,
              }
            : null),
          display: 'block',
        }}
      >
        {/* Har qator ALOHIDA quti — ustma-ust turadi, lekin
            bir-birining kengligiga yoki qator sinishiga ta'sir
            qilmaydi. Oldingi qatorlar hech qachon o'zgarmaydi: biri
            to'liq yozilgach, faqat keyingisi pastda paydo bo'ladi.
            Matn ODDIY (harf-harf alohida `<span>`ga BO'LINMAGAN) —
            aks holda so'zlar o'rtasidan bo'linib ketardi.

            Erase kechikishi PASTDAN TEPAGA: eng pastki qator (index
            MAX_TITLE_LINES-1) 0ms kechikish bilan (izoh bilan BIRGA)
            boshlaydi, har ustidagi qator bir bosqich (`ERASE_MS`)
            kechroq boshlaydi.

            1-qator ostidagi TILLA CHIZIQ: qo'shimcha `<span>` emas,
            shu qatorning O'ZINING `borderBottom`i — chunki bu quti
            `width:'fit-content'` (harf-harf o'sib boradi), border
            ham AYNAN shu kenglikda, matn bilan BIRGA "chizilib"
            boradi — alohida animatsiya kerak emas.

            `paddingRight` SHART: h1'da MANFIY `letter-spacing`
            (tracking) bor — bu OXIRGI harfdan KEYIN ham qo'llanadi,
            shuning uchun `fit-content` quti oxirgi harfning haqiqiy
            (ko'zga ko'ringan) o'ng chekkasidan bir oz OLDIN tugardi,
            va chiziq oxirgi harfgacha YETMAY qolardi. Kichik
            `paddingRight` shu farqni qoplaydi. */}
        {lines.map((lineText, i) => (
          <span key={i} style={{ display: 'block' }}>
            <span
              style={{
                ...eraseBoxStyle((MAX_TITLE_LINES - 1 - i) * ERASE_MS),
                ...(i === 0
                  ? {
                      borderBottom: '0.06em solid #F0C987',
                      paddingBottom: '0.14em',
                      paddingRight: '0.06em',
                    }
                  : null),
              }}
            >
              {lineText}
            </span>
          </span>
        ))}
      </h1>

      <p
        className={subClassName}
        style={{
          // Sarlavhadagi kabi — video ustida o'qish uchun quyuq soya
          // + OQ NEON porlash, faqat izoh KICHIKROQ matn bo'lgani uchun
          // porlash ham xiraroq (ko'zni band qilmasligi kerak).
          textShadow: `
            0 0 1px rgba(3,6,15,0.95),
            0 1px 3px rgba(3,6,15,0.9),
            0 2px 8px rgba(3,6,15,0.7),
            0 0 14px rgba(255,255,255,0.75),
            0 0 26px rgba(255,255,255,0.4)
          `,
        }}
      >
        <span style={eraseBoxStyle(0, true)}>{subText}</span>
      </p>
    </>
  );
}
