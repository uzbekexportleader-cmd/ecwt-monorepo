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
     * Feruza (Teal) — 30 ta variantdan egasi tanlagan #10.
     *
     * Asl tanlov `#0E7C8C -> #22B8C4` edi. Oq matn bilan tekshirilganda:
     *   boshi  #0E7C8C -> 4.90:1  (AA dan yuqori)
     *   oxiri  #22B8C4 -> 2.41:1  (AA'dan ancha past — och uchida
     *                              matn o'qilmas edi)
     * Ikkala uchda BIR XIL matn rangi (oq YOKI to'q) ishlashi kerak,
     * lekin bu ikki rang orasida shunday "kesishish" borki, na oq, na
     * to'q ikkalasini ham qondiradi (to'q matn boshida 3.67:1 chiqadi
     * — u ham yetarli emas).
     *
     * Shuning uchun OCH uch quyuqlashtirildi (`#22B8C4` -> `#0F6B75`),
     * rang OILASI (feruza) saqlanib qoldi, faqat ikkalasi ham
     * "chuqurroq feruza" bo'ldi:
     *   boshi  #0E7C8C -> oq matn bilan 4.90:1
     *   oxiri  #0F6B75 -> oq matn bilan 6.21:1
     * Ikkalasi ham AA dan yuqori.
     */
    image: 'linear-gradient(100deg, #0E7C8C 0%, #0F6B75 100%)',
    shadow: '0 12px 44px -12px rgba(14,124,140,0.55)',
    text: 'text-white',
    ring: 1,
  },
  ghost: {
    image: 'none',
    shadow: 'none',
    /**
     * Oq emas — och feruza (`#8fe0e8`). Fon deyarli qora
     * (`rgba(3,6,15,0.72)`) bo'lgani uchun kontrast baribir juda
     * yuqori qoladi (istalgan och rang qora fonda AA'dan ancha
     * yuqori chiqadi); shu bilan birga tugma aniq Feruza oilasiga
     * tegishli ko'rinadi, oddiy oq matn kabi "rangsiz" emas.
     */
    text: 'text-[#8fe0e8]',
    // Yorug'lik halqasi ancha xira: ikkinchi darajali tugma
    // asosiysining diqqatini tortmasligi kerak
    ring: 0.35,
  },
} as const;

/**
 * Yorug' yoy: aylananing atigi ~20 darajasi yonadi.
 *
 * Ranglar asosiy gradientdan olingan — halqa ham o'sha bitta Feruza
 * oilasiga tegishli (ilgari Rose Gold, undan oldin ko'k/yashil edi).
 */
const RING = `conic-gradient(
  from 0deg,
  transparent 0deg,
  transparent 300deg,
  rgba(34,184,196,0.35) 322deg,
  #5fd4de 340deg,
  #ffffff 350deg,
  #14a3b0 358deg,
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
          // kontrast beradi. Chegara Feruza rangida, TO'LIQ ko'rinarli.
          ghost ? 'border border-[#22b8c4]/70 bg-[rgba(3,6,15,0.72)] backdrop-blur-md' : ''
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
