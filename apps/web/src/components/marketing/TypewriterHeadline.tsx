'use client';

import { useEffect, useRef, useState } from 'react';

type Phase = 'typingLine1' | 'typingLine2' | 'typingSub' | 'pausedFull' | 'fading' | 'pausedEmpty';

/** Bir harf yozilishi orasidagi kechikish */
const TYPE_MS = 30;
/** Ikki qator (yoki sarlavha->izoh) orasidagi kichik tin olish */
const LINE_GAP_MS = 180;
/** Hammasi TO'LIQ yozilib bo'lgach, o'chishdan oldin necha vaqt turadi */
const HOLD_FULL_MS = 4200;
/** O'ngdan chapga o'chirish (erase) animatsiyasining HAR BIR bosqich davomiyligi */
const ERASE_MS = 700;
/**
 * Ketma-ket o'chirish jami davomiyligi: avval PASTKI guruh (2-qator +
 * izoh) TO'LIQ o'chib bo'lgach, keyin TEPA qator (1-qator) o'chiy
 * boshlaydi — ikkalasi hech qachon bir vaqtda o'chmaydi.
 */
const TOTAL_ERASE_MS = ERASE_MS * 2;
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
 * Har bir slaydning SARLAVHASI ikkita QAT'IY, OLDINDAN HISOBLANGAN
 * qatorga yozilib, so'ng ostida IZOH qatori yoziladi; o'chirilganda
 * esa AVVAL PASTKI guruh (2-qator + izoh) TO'LIQ O'NGDAN CHAPGA
 * o'chiydi, FAQAT SHUNDAN KEYIN 1-qator (tepa) o'chiy boshlaydi —
 * ikkalasi hech qachon bir vaqtda o'chmaydi — va keyingi slayd
 * boshlanadi.
 *
 * ── Uzun tarix: bir necha marta "sakrash" chiqdi ────────────────────
 * Avval matn TABIIY (brauzerning o'zi) ko'chirilardi. Bu uch xil
 * shaklda muammo berdi: `text-balance` qayta muvozanatlardi, kursor
 * asos chizig'ini buzardi, va eng asosiysi — harf-harf terilganda
 * qator oxiridagi so'z o'sib-o'sib butunlay 2-qatorga ko'chib
 * ketardi. Keyin BITTA QATORGA majburlab, avtomatik kichraytirish
 * sinaldi — lekin egasi buni yoqtirmadi, "ikki qatorda, birinchisi
 * to'liq yozilib bo'lib, keyin ikkinchisi" ko'rinishini so'radi.
 *
 * ── Yechim: qator chegarasi OLDINDAN hisoblanadi ────────────────────
 * Brauzerga "qayerda ko'chirishni" QAROR QILDIRISH o'rniga, sarlavha
 * yozila boshlashidan OLDIN qaysi so'zlar 1-qatorga, qaysilari
 * 2-qatorga tushishi bir marta hisoblanadi (`computeFit`) —
 * ko'rinmas o'lchov elementida to'liq matn joylashtirilib, `Range`
 * orqali har harfning qaysi qatorda turishi tekshiriladi. Shundan
 * keyin ikkalasi ham MUSTAQIL, ALOHIDA harf-harf yoziladi — birinchi
 * TO'LIQ tugagach, ikkinchisi boshlanadi. Qator chegarasi hech qachon
 * QAYTA HISOBLANMAYDI, shuning uchun 1-qator hech qachon o'zgarmaydi,
 * "sakramaydi".
 *
 * ── OGOHLANTIRISH: matnni HARF-HARF alohida `<span>`ga BO'LMANG ─────
 * Bir marta "rang o'zgarib so'nish" effekti uchun har bir harf
 * o'zining `<span>`iga o'ralgan edi — natijada brauzer so'zlarni
 * HARFLAR ORASIDA HAM bo'la boshladi (chunki har bir harf endi
 * alohida "quti", va qutilar orasida qator ko'chirish joizdir),
 * sarlavha so'z o'rtasidan ikkiga bo'linib, hatto 3-qatorga toshib
 * ketdi. Hozirgi "o'ngdan chapga o'chirish" effekti esa BUTUN qatorni
 * (bitta `<span>`) `clip-path` orqali FAQAT O'NG chekkadan chapga
 * qarab yeydi — matn DOM'da hamon oddiy, uzluksiz satr, harflarga
 * bo'linmagan.
 */
export function TypewriterHeadline({ phrases, titleClassName, subClassName }: TypewriterHeadlineProps) {
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [subText, setSubText] = useState('');
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const phraseIndex = useRef(0);
  const charIndex = useRef(0);
  const phase = useRef<Phase>('typingLine1');
  const targetLines = useRef<[string, string]>(['', '']);
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
   * oxirida faqat chap chekka (va undan keyingi lippillovchi kursor)
   * qoladi.
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
   * Egasi ikkala qator BIR VAQTDA emas, PASTKI TO'LIQ tugagach TEPASI
   * boshlansin dedi. Buni alohida state/timer bilan emas, oddiygina
   * CSS `transition-delay` bilan hal qilindi: PASTKI guruh (2-qator +
   * izoh) delaysiz (0ms) boshlaydi, TEPA qator (1-qator) esa PASTKI
   * guruh tugagandan keyin (`ERASE_MS`) boshlaydi — bitta umumiy
   * `visible=false` signalidan ikkita mustaqil vaqtda boshlanadigan
   * animatsiya kelib chiqadi.
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
   * barqaror (1/2-qator hech qachon ko'chmaydi, `computeFit` buni
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
   * Ko'rsatilgan matnni ikki qatorga bo'ladi — brauzerning o'z
   * tabiiy ko'chirish qoidasidan foydalanib, lekin faqat BIR MARTA,
   * animatsiya boshlanishidan oldin.
   *
   * `Range.getClientRects()` o'ralgan matn uchun HAR QATOR uchun
   * alohida to'rtburchak qaytaradi. Har bir harfni alohida
   * o'ramga (`Range`) olib, uning tepa chizig'ini 1-qatornikiga
   * solishtirib, chegarani topamiz.
   */
  function splitAtFontSize(
    text: string,
    width: number,
    cs: CSSStyleDeclaration,
    fontSizePx: number,
  ): [string, string] {
    const measurer = createMeasurer(width, cs, fontSizePx);
    const textNode = document.createTextNode(text);
    measurer.appendChild(textNode);
    document.body.appendChild(measurer);

    const fullRange = document.createRange();
    fullRange.selectNodeContents(measurer);
    const rects = fullRange.getClientRects();

    if (rects.length <= 1) {
      document.body.removeChild(measurer);
      return [text, ''];
    }

    const line1Top = rects[0].top;
    let splitIndex = text.length;

    for (let i = 0; i < text.length; i++) {
      const charRange = document.createRange();
      charRange.setStart(textNode, i);
      charRange.setEnd(textNode, i + 1);
      const r = charRange.getBoundingClientRect();
      if (Math.abs(r.top - line1Top) > 1) {
        splitIndex = i;
        break;
      }
    }

    document.body.removeChild(measurer);

    return [text.slice(0, splitIndex).trimEnd(), text.slice(splitIndex).trimStart()];
  }

  /**
   * Sarlavhani ikki qatorga sig'diradi — kerak bo'lsa shriftni
   * kichraytirib.
   *
   * ── Nega kerak: UZUN gaplar 3-QATORGA "toshib ketardi" ──────────────
   * Oldingi versiya matnni faqat BIRINCHI tabiiy qator chegarasidan
   * bo'lardi va qolganini "2-qator" deb hisoblardi — lekin qolgan qism
   * o'zi ham keng bo'lsa, 2-qatorning span'i ichida yana ikkiga
   * bo'linib, natijada 3, hatto 4 qator hosil bo'lardi (egasi buni
   * "yarmi 3-qatorga tushyapti" deb topdi). Endi avval TO'LIQ matn
   * joriy shriftda necha qatorga sig'ishi tekshiriladi; agar 2 dan
   * ko'p bo'lsa, shrift ikkilik qidiruv bilan ANIQ shu ikki qatorga
   * sig'guncha kichraytiriladi, va bo'lish shu YANGI o'lchamda amalga
   * oshiriladi.
   */
  function computeFit(
    text: string,
    width: number,
    sample: HTMLElement,
  ): { scale: number; lines: [string, string] } {
    const cs = getComputedStyle(sample);
    if (baseFontSizeRef.current === null) {
      baseFontSizeRef.current = parseFloat(cs.fontSize);
    }
    const baseFontSize = baseFontSizeRef.current;

    let scale = 1;
    if (countLines(text, width, cs, baseFontSize) > 2) {
      let lo = 0.5;
      let hi = 1;
      for (let i = 0; i < 10; i += 1) {
        const mid = (lo + hi) / 2;
        const lines = countLines(text, width, cs, baseFontSize * mid);
        if (lines > 2) hi = mid;
        else lo = mid;
      }
      scale = lo;
    }

    return { scale, lines: splitAtFontSize(text, width, cs, baseFontSize * scale) };
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
      setLine1('');
      setLine2('');
      setSubText('');
      phase.current = 'typingLine1';
      timeoutId = setTimeout(tick, TYPE_MS);
    };

    const tick = () => {
      const [l1, l2] = targetLines.current;
      const sub = targetSub.current;

      switch (phase.current) {
        case 'typingLine1':
          charIndex.current += 1;
          setLine1(l1.slice(0, charIndex.current));
          if (charIndex.current >= l1.length) {
            charIndex.current = 0;
            phase.current = l2 ? 'typingLine2' : 'typingSub';
            timeoutId = setTimeout(tick, LINE_GAP_MS);
          } else {
            timeoutId = setTimeout(tick, TYPE_MS);
          }
          break;

        case 'typingLine2':
          charIndex.current += 1;
          setLine2(l2.slice(0, charIndex.current));
          if (charIndex.current >= l2.length) {
            charIndex.current = 0;
            phase.current = 'typingSub';
            timeoutId = setTimeout(tick, LINE_GAP_MS);
          } else {
            timeoutId = setTimeout(tick, TYPE_MS);
          }
          break;

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
          setLine1('');
          setLine2('');
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
    setLine1(targetLines.current[0]);
    setLine2(targetLines.current[1]);
    setSubText(first.sub);
    phase.current = 'pausedFull';
    timeoutId = setTimeout(tick, HOLD_FULL_MS);

    return () => clearTimeout(timeoutId);
  }, [phrases, reduced]);

  return (
    <>
      <h1
        ref={titleRef}
        className={titleClassName}
        style={{
          // FOIZ EMAS, PIKSEL: `${fontScale*100}%` h1'ning O'Z Tailwind
          // klassi (masalan `text-[4.5rem]`) o'rniga h1'NING OTASI
          // shriftiga (standart 16px) nisbatan hisoblanardi — inline
          // `style.fontSize` klassdan KUCHLIROQ, shuning uchun katta
          // sarlavha kutilmaganda 16px atrofida cho'kib qolardi.
          // Piksel qiymati esa hech kimga bog'liq emas, har doim
          // to'g'ri hisoblanadi.
          ...(baseFontSizeRef.current !== null
            ? { fontSize: `${baseFontSizeRef.current * fontScale}px` }
            : null),
          display: 'block',
          // `text-on-video-strong` (className) faqat video ustida
          // O'QISH uchun TOR, quyuq soya beradi. Bu yerga esa yana
          // ikki narsa qo'shiladi: (1) harflar ATROFIGA to'rt
          // tomonlama OCH KO'K (neon) RANGLI kontur (4 burchakka 1px
          // siljigan qattiq soya — klassik "stroke" texnikasi, haqiqiy
          // `-webkit-text-stroke` o'rniga, chunki u ba'zi
          // brauzerlarda harf ichini ham yeb qo'yishi mumkin — matn
          // O'ZI QORA, atrofi OCH KO'K bo'lishi kerak), va (2) ORQADA
          // ingichka OCH KO'K porlash — "orqa soya".
          //
          // ── Nega xira radiusi KICHIK ──────────────────────────────
          // Avval 34px/70px xira radiusi sinaldi — natija YOMON
          // chiqdi: h1 ning o'zi `overflow-hidden` bo'lgani uchun
          // (2 qator balandligiga qat'iy kesilgan), shuncha katta
          // soya shu chegaraga borib to'satdan KESILIB QOLARDI —
          // sarlavha ORQASIDA aniq TO'RTBURCHAK ko'rinardi (egasi
          // shuni to'g'ri payqadi). Kichik radius chegaraga yetmasdan
          // o'zi so'nadi, shuning uchun to'rtburchak yo'qoladi.
          //
          // Inline `style` klassdan kuchliroq bo'lgani uchun hammasi
          // shu yerda BIRGA yoziladi, aks holda birortasi yo'qolib
          // qolardi.
          textShadow: `
            -1px -1px 0 #4FE0FF,
            1px -1px 0 #4FE0FF,
            -1px 1px 0 #4FE0FF,
            1px 1px 0 #4FE0FF,
            0 0 3px rgba(0,0,0,0.6),
            0 4px 16px rgba(3,6,15,0.5),
            0 0 8px rgba(79,224,255,0.6)
          `,
        }}
      >
        {/* Har qator ALOHIDA quti — ustma-ust turadi, lekin
            bir-birining kengligiga yoki qator sinishiga ta'sir
            qilmaydi. 1-qator hech qachon o'zgarmaydi: u to'liq
            yozilgach, faqat 2-qator pastda paydo bo'ladi. Matn
            ODDIY (harf-harf alohida `<span>`ga BO'LINMAGAN) — aks
            holda so'zlar o'rtasidan bo'linib ketardi. */}
        <span style={{ display: 'block' }}>
          <span style={eraseBoxStyle(ERASE_MS)}>{line1}</span>
        </span>
        <span style={{ display: 'block' }}>
          <span style={eraseBoxStyle(0)}>{line2}</span>
        </span>
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
