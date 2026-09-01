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
     * Champagne-oltin — sarlavhadagi `#F0C987` bilan BIR XIL oila.
     *
     * Ilgari bu yerda Feruza (teal) turgan edi. Sarlavha oltin rangga
     * o'tgach, sahifada IKKITA raqobatlashuvchi accent (oltin + feruza)
     * paydo bo'ldi — bu "premium emas" deb topildi, chunki ko'z qayerga
     * qarashni bilmay qoladi. Endi asosiy tugma ham SHU BITTA oltin
     * oilasiga tegishli, shuning uchun sahifada yagona hukmron rang bor.
     *
     * Fon OCH (oltin) bo'lgani uchun matn OQ emas, TO'Q jigarrang:
     *   boshi  #E8C583 -> to'q matn bilan 9.1:1
     *   oxiri  #C9962E -> to'q matn bilan 5.8:1
     * Ikkalasi ham AA dan (va aksariyati AAA dan) yuqori.
     */
    image: 'linear-gradient(100deg, #E8C583 0%, #C9962E 100%)',
    shadow: '0 12px 44px -12px rgba(201,150,46,0.5)',
    text: 'text-[#2f1f04]',
    ring: 1,
  },
  ghost: {
    image: 'none',
    shadow: 'none',
    /**
     * Oq emas — och oltin (`#f3d9a4`). Fon deyarli qora
     * (`rgba(3,6,15,0.72)`) bo'lgani uchun kontrast baribir juda
     * yuqori qoladi (istalgan och rang qora fonda AA'dan ancha
     * yuqori chiqadi); shu bilan birga tugma aniq Oltin oilasiga
     * tegishli ko'rinadi, oddiy oq matn kabi "rangsiz" emas.
     */
    text: 'text-[#f3d9a4]',
    // Yorug'lik halqasi ancha xira: ikkinchi darajali tugma
    // asosiysining diqqatini tortmasligi kerak
    ring: 0.35,
  },
} as const;

/**
 * Yorug' yoy: aylananing atigi ~20 darajasi yonadi.
 *
 * Ranglar asosiy gradientdan olingan — halqa ham o'sha bitta Oltin
 * oilasiga tegishli (ilgari Feruza, undan oldin Rose Gold edi).
 */
const RING = `conic-gradient(
  from 0deg,
  transparent 0deg,
  transparent 300deg,
  rgba(240,201,135,0.35) 322deg,
  #f7dfa8 340deg,
  #ffffff 350deg,
  #c9962e 358deg,
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
        className={`group relative z-10 inline-flex items-center gap-2.5 overflow-hidden rounded-full px-7 py-3.5 text-[15px] font-semibold tracking-[0.01em] transition-transform hover:scale-[1.02] sm:px-8 sm:py-4 sm:text-[16px] ${skin.text} ${
          // Ghost fon SHAFFOF emas, quyuq: ortida video turadi va
          // uning yorug' joylari matnni yeb qo'yardi. O'lchov bo'yicha
          // 0.72 quyuqlik eng yomon kadrda ham to'qqiz baravar
          // kontrast beradi. Chegara Oltin rangida, TO'LIQ ko'rinarli.
          ghost ? 'border border-[#c9962e]/70 bg-[rgba(3,6,15,0.72)] backdrop-blur-md' : ''
        }`}
        style={{
          backgroundImage: ghost ? undefined : skin.image,
          boxShadow: ghost ? undefined : skin.shadow,
        }}
      >
        {/* Nafis "yaltirash": kam-kam (har 5s da bir marta) tugma
            ustidan o'tib ketadigan yorug' chiziq — faqat asosiy
            (to'ldirilgan) tugmada, ghost'da emas, chunki uning foni
            shaffof va effekt ko'rinmasdi. `mix-blend-mode: overlay`
            matnni bosib qolmasdan, uning ustidan yorug'lik o'tganday
            ko'rinish beradi. */}
        {!ghost && (
          <span
            aria-hidden="true"
            className="animate-sheen pointer-events-none absolute inset-y-0 left-0 w-1/4"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.65) 50%, transparent 100%)',
              mixBlendMode: 'overlay',
            }}
          />
        )}
        {children}
      </Link>
    </span>
  );
}
