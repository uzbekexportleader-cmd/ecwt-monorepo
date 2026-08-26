import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Atrofida yorug'lik yuguradigan tugma.
 *
 * ── Qanday yasalgan ─────────────────────────────────────────────────
 * Uch qatlam:
 *   1. Tashqi qobiq — dumaloq, `overflow-hidden`, ikki piksel ichki
 *      bo'shliq. Aynan shu ikki piksel "chekka" bo'lib ko'rinadi.
 *   2. Aylanuvchi konus gradient — qobiqdan katta, deyarli butunlay
 *      shaffof, faqat kichik yoyi yorug'. Qobiq uni dumaloq shaklda
 *      qirqadi, shuning uchun yoy chekka bo'ylab yugurayotgandek
 *      ko'rinadi.
 *   3. Tugmaning o'zi — ustida, to'liq xira fon bilan. Busiz gradient
 *      tugmaning o'rtasidan ham ko'rinib turardi.
 *
 * ── Nega chekka rangini jonlantirmadim ──────────────────────────────
 * `border-color` yoki `background-position` ni jonlantirish har kadrda
 * qayta chizishni talab qiladi. Bu yerda esa faqat `transform`
 * o'zgaradi — u kompozitorda bajariladi va sahifaning qolgan qismiga
 * ta'sir qilmaydi.
 *
 * `prefers-reduced-motion` da animatsiya `globals.css` dagi umumiy
 * qoida bilan o'z-o'zidan to'xtaydi.
 */

interface Props {
  href: string;
  children: ReactNode;
  /**
   * `primary` — to'ldirilgan, brend gradienti. Sahifada FAQAT BITTA
   *             bo'lishi kerak: u asosiy amalni bildiradi.
   * `ghost`   — quyuq va shaffof, faqat chegara bilan. Ikkinchi
   *             darajali amal uchun.
   */
  variant?: 'primary' | 'ghost';
  className?: string;
}

/**
 * ── Nega bitta accent ───────────────────────────────────────────────
 * Bir vaqtlar bu yerda sariq va yashil tugmalar bor edi. Sarlavhadagi
 * ko'k so'z va yashil holat nuqtasi bilan birga birinchi ekranda
 * TO'RTTA accent rang yig'ilgandi. Natijada ko'z qayerga qarashni
 * bilmay qolardi: hamma narsa "muhim" bo'lsa, hech narsa muhim emas.
 *
 * Endi bitta brend accenti — ko'kdan yashilga o'tuvchi gradient. U
 * faqat ASOSIY amalda ishlatiladi. Ikkinchi tugma esa rangsiz: u bor,
 * lekin talashmaydi. Shu tufayli qaysi tugma asosiy ekani bir
 * qarashda ko'rinadi.
 */
const VARIANTS = {
  primary: {
    /**
     * Ko'kdan yashilga. Yashil uchi ATAYLAB chuqurroq (`#15803d`,
     * brendning `#22c55e` si emas).
     *
     * Sabab o'lchangan: oq matn `#22c55e` ustida atigi 2.28:1 kontrast
     * beradi — AA me'yori 4.5 dan ikki barobar past, ya'ni tugmaning
     * o'ng yarmidagi harflar va strelka o'qilmay qolardi. Gradient
     * bo'ylab qiymatlar shunday edi:
     *   5.82 -> 4.64 -> 3.65 -> 2.87 -> 2.28
     *
     * Chuqurroq yashil bilan esa butun bo'ylab barqaror:
     *   5.82 -> 5.74 -> 5.57 -> 5.32 -> 5.02
     *
     * Ko'zga u baribir "ko'kdan yashilga" bo'lib qoladi.
     */
    image: 'linear-gradient(100deg, #2b66ad 0%, #15803d 100%)',
    shadow: '0 12px 44px -12px rgba(37,120,220,0.75)',
    text: 'text-white',
    ring: 1,
  },
  ghost: {
    image: 'none',
    shadow: 'none',
    text: 'text-white',
    // Yorug'lik halqasi ancha xira: ikkinchi darajali tugma
    // asosiysining diqqatini tortmasligi kerak
    ring: 0.35,
  },
} as const;

/**
 * Yorug' yoy: aylananing atigi ~20 darajasi yonadi.
 *
 * Ranglar asosiy gradientdan olingan — halqa ham o'sha bitta accent
 * oilasiga tegishli.
 */
const RING = `conic-gradient(
  from 0deg,
  transparent 0deg,
  transparent 300deg,
  rgba(94,179,255,0.35) 322deg,
  #7cc4ff 340deg,
  #ffffff 350deg,
  #6ee7a8 358deg,
  transparent 360deg
)`;

export function LedButton({ href, children, variant = 'primary', className }: Props) {
  const skin = VARIANTS[variant];
  const ghost = variant === 'ghost';

  return (
    <span
      className={`relative isolate inline-flex overflow-hidden rounded-full p-[2px] ${className ?? ''}`}
    >
      <span
        aria-hidden="true"
        className="animate-led absolute left-1/2 top-1/2 h-[260%] w-[260%] -translate-x-1/2 -translate-y-1/2"
        style={{ background: RING, opacity: skin.ring }}
      />

      <Link
        href={href}
        className={`group relative z-10 inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-[15px] font-semibold tracking-[0.01em] transition-transform hover:scale-[1.02] sm:px-8 sm:py-4 sm:text-[16px] ${skin.text} ${
          // Ghost fon SHAFFOF emas, quyuq: ortida video turadi va
          // uning yorug' joylari matnni yeb qo'yardi. O'lchov bo'yicha
          // 0.72 quyuqlik eng yomon kadrda ham to'qqiz baravar
          // kontrast beradi.
          ghost ? 'border border-white/22 bg-[rgba(3,6,15,0.72)] backdrop-blur-md' : ''
        }`}
        style={{
          backgroundImage: ghost ? undefined : skin.image,
          boxShadow: ghost ? undefined : skin.shadow,
        }}
      >
        {children}
      </Link>
    </span>
  );
}
