'use client';

import { useEffect, useRef, useState } from 'react';

type Phase = 'typingLine1' | 'typingLine2' | 'typingSub' | 'pausedFull' | 'fading' | 'pausedEmpty';

/** Bir harf yozilishi orasidagi kechikish */
const TYPE_MS = 30;
/** Ikki qator (yoki sarlavha->izoh) orasidagi kichik tin olish */
const LINE_GAP_MS = 180;
/** Hammasi TO'LIQ yozilib bo'lgach, o'chishdan oldin necha vaqt turadi */
const HOLD_FULL_MS = 4200;
/** "Shamol uchirgan qum" animatsiyasining davomiyligi */
const FADE_MS = 900;
/** Uchib ketgach, keyingi gap yozila boshlashidan oldingi tin olish */
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
 * qatorga yozilib, so'ng ostida IZOH qatori yoziladi; ikkalasi ham
 * birga erib, keyingi slayd boshlanadi.
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
          timeoutId = setTimeout(tick, FADE_MS);
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

  const typingLine1 = phase.current === 'typingLine1';
  const typingLine2 = phase.current === 'typingLine2';
  const typingSub = phase.current === 'typingSub';

  const fadeStyle = {
    opacity: visible ? 1 : 0,
    transform: `translateX(${visible ? 0 : 2.5}em)`,
    filter: visible ? 'blur(0px)' : 'blur(10px)',
    // Faqat "uchib ketish" tomoni animatsiyalanadi. Qaytib holatga
    // chiqish darhol — aks holda bo'sh matn ustida yangi gap
    // harflari suriling-xira holda terila boshlardi.
    transition: visible
      ? 'none'
      : `opacity ${FADE_MS}ms cubic-bezier(0.4,0,1,1), transform ${FADE_MS}ms cubic-bezier(0.4,0,1,1), filter ${FADE_MS}ms cubic-bezier(0.4,0,1,1)`,
  } as const;

  return (
    <>
      <h1
        ref={titleRef}
        className={titleClassName}
        style={{
          ...fadeStyle,
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
          // ikki qatlam OLTIN "porlash" qo'shiladi — harflar orasidan
          // yumshoq nur chiqib turganday. Inline `style` klassdan
          // kuchliroq bo'lgani uchun ikkalasi shu yerda BIRGA
          // yoziladi, aks holda birortasi yo'qolib qolardi.
          textShadow: `
            0 0 1px rgba(3,6,15,0.95),
            0 1px 3px rgba(3,6,15,0.92),
            0 2px 9px rgba(3,6,15,0.8),
            0 5px 24px rgba(3,6,15,0.6),
            0 0 26px rgba(240,201,135,0.45),
            0 0 56px rgba(240,201,135,0.25)
          `,
        }}
      >
        {/* Har qator ALOHIDA `block` — ustma-ust turadi, lekin
            bir-birining kengligiga yoki qator sinishiga ta'sir
            qilmaydi. 1-qator hech qachon o'zgarmaydi: u to'liq
            yozilgach, faqat 2-qator pastda paydo bo'ladi. */}
        <span style={{ display: 'block' }}>
          {line1}
          {!reduced && typingLine1 && (
            <span
              aria-hidden="true"
              className="ml-[0.05em] inline-block w-[2px] animate-pulse bg-current align-baseline"
              style={{ height: '0.82em' }}
            />
          )}
        </span>
        <span style={{ display: 'block' }}>
          {line2}
          {!reduced && typingLine2 && (
            <span
              aria-hidden="true"
              className="ml-[0.05em] inline-block w-[2px] animate-pulse bg-current align-baseline"
              style={{ height: '0.82em' }}
            />
          )}
        </span>
      </h1>

      <p
        className={subClassName}
        style={{
          ...fadeStyle,
          // Sarlavhadagi kabi — video ustida o'qish uchun quyuq soya
          // + iliq porlash, faqat izoh KICHIKROQ matn bo'lgani uchun
          // porlash ham xiraroq (ko'zni band qilmasligi kerak).
          textShadow: `
            0 0 1px rgba(3,6,15,0.95),
            0 1px 3px rgba(3,6,15,0.9),
            0 2px 8px rgba(3,6,15,0.7),
            0 0 18px rgba(217,208,187,0.3)
          `,
        }}
      >
        {subText}
        {!reduced && typingSub && (
          <span
            aria-hidden="true"
            className="ml-[0.05em] inline-block w-[2px] animate-pulse bg-current align-baseline"
            style={{ height: '0.82em' }}
          />
        )}
      </p>
    </>
  );
}
