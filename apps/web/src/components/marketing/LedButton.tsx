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
 * Endi bitta brend accenti — Rose Gold: chuqur pushti-atirgul rangdan
 * quyuq oltin-bronzaga o'tuvchi gradient. U faqat ASOSIY amalda
 * ishlatiladi. Ikkinchi tugma esa to'liq rangsiz qolmaydi — chegara
 * va yorug'lik halqasi orqali oilaviy ohangni ko'rsatadi, lekin
 * fon-matni video ustida o'qilishi uchun quyuq turadi.
 */
const VARIANTS = {
  primary: {
    /**
     * "Oltin qizarish" — och pushti (`#C68690`) dan yumshoq
     * shampan-oltinga (`#E2BE7E`). 20 ta variantdan egasi TANLAGAN
     * aynan shu juftlik — o'zgartirilmagan.
     *
     * ⚠️ Lekin OQ matn bilan ishlamaydi: bu rang juda och, hisoblandi —
     *   boshi  #C68690 -> oq matn bilan atigi 2.91:1
     *   oxiri  #E2BE7E -> oq matn bilan hatto 1.77:1
     * Ikkalasi ham AA me'yori (4.5) dan ancha past — oltin uchida matn
     * deyarli o'qilmas edi.
     *
     * Shuning uchun rang O'ZGARTIRILMADI, faqat matn OQ emas, TO'Q
     * qilindi (`text-brand-950`, `#091729` — saytning o'z siyoh
     * rangi). Xuddi shu fon bilan:
     *   boshi  6.18:1
     *   oxiri  10.19:1
     * Bu tasodifiy emas: och rose gold fonda to'q matn — zargarlik va
     * premium brendlarda keng tarqalgan juftlik.
     */
    image: 'linear-gradient(100deg, #C68690 0%, #E2BE7E 100%)',
    shadow: '0 12px 44px -12px rgba(198,134,144,0.55)',
    text: 'text-brand-950',
    ring: 1,
  },
  ghost: {
    image: 'none',
    shadow: 'none',
    /**
     * Oq emas — iliq shampan-oltin (`#f0c9a0`). Fon deyarli qora
     * (`rgba(3,6,15,0.72)`) bo'lgani uchun kontrast baribir juda
     * yuqori qoladi (istalgan och rang qora fonda AA'dan ancha
     * yuqori chiqadi); shu bilan birga tugma aniq Rose Gold oilasiga
     * tegishli ko'rinadi, oddiy oq matn kabi "rangsiz" emas.
     */
    text: 'text-[#f0c9a0]',
    // Yorug'lik halqasi ancha xira: ikkinchi darajali tugma
    // asosiysining diqqatini tortmasligi kerak
    ring: 0.35,
  },
} as const;

/**
 * Yorug' yoy: aylananing atigi ~20 darajasi yonadi.
 *
 * Ranglar asosiy gradientdan olingan — halqa ham o'sha bitta Rose
 * Gold oilasiga tegishli (ilgari ko'k/yashil edi).
 */
const RING = `conic-gradient(
  from 0deg,
  transparent 0deg,
  transparent 300deg,
  rgba(224,159,140,0.35) 322deg,
  #f0b8a6 340deg,
  #ffffff 350deg,
  #e8c07a 358deg,
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
          // kontrast beradi. Chegara Rose Gold rangida, TO'LIQ
          // ko'rinarli (0.35 emas, 0.7) — ilgari juda xira edi va
          // tugma oddiy qora bo'lib ko'rinardi.
          ghost ? 'border border-[#e8c07a]/70 bg-[rgba(3,6,15,0.72)] backdrop-blur-md' : ''
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
