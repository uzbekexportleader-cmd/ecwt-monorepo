import type { Marketplace } from '@ecwt/contracts';

/**
 * Bosh sahifada ko'rsatiladigan qo'shimcha maydonchalar.
 *
 * Bular ataylab `Marketplace` enum'iga QO'SHILMAGAN. O'sha enum
 * ma'lumotlar bazasida ham bor (`prisma/schema.prisma`) va unga yangi
 * qiymat qo'shish migratsiya talab qiladi. Bu yerdagilar esa hozircha
 * faqat ko'rinish uchun: ular buyurtma yoki e'lon bilan bog'lanmaydi.
 *
 * Biror maydoncha bilan haqiqiy integratsiya boshlansa, o'shani
 * enum'ga ko'chirish kerak — bu yerdan emas, o'sha yerdan.
 */
export type PlannedMarket =
  | 'WAYFAIR'
  | 'FAIRE'
  | 'TARGET_PLUS'
  | 'TEMU'
  | 'HOUZZ'
  | 'MICHAELS'
  | 'OVERSTOCK'
  | 'POSHMARK'
  | 'MERCARI'
  | 'MACYS'
  | 'BONANZA'
  | 'ALIBABA';

export type MarketMarkId = Marketplace | PlannedMarket;

/**
 * Marketplace belgilari.
 *
 * Brendlarning rasmiy logotip fayllari loyihaga qo'shilmagan, shuning
 * uchun bu yerda ularning so'z belgisi o'z rangida va kichik shakl bilan
 * chiziladi — kulrang bir xil matndan ko'ra ancha tanib olinadi.
 * Rasmiy fayllar berilsa, shu komponentning ichi almashtiriladi va
 * qolgan kod tegilmaydi.
 */

/** Walmart uchqunlari — markazdan chiquvchi olti nur */
function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <g stroke="#FFC220" strokeWidth="2.1" strokeLinecap="round">
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * 2 * Math.PI - Math.PI / 2;
          return (
            <line
              key={i}
              x1={8 + 2.6 * Math.cos(a)}
              y1={8 + 2.6 * Math.sin(a)}
              x2={8 + 6.4 * Math.cos(a)}
              y2={8 + 6.4 * Math.sin(a)}
            />
          );
        })}
      </g>
    </svg>
  );
}

export function MarketplaceMark({ id }: { id: MarketMarkId }) {
  switch (id) {
    case 'AMAZON_US':
      return (
        <span className="flex flex-col items-center leading-none">
          <span className="text-[15px] font-bold lowercase tracking-tight text-white">amazon</span>
          {/* Tabassum yoyi */}
          <svg viewBox="0 0 46 8" className="mt-0.5 h-2 w-11" aria-hidden="true">
            <path
              d="M1 2 C 14 8, 32 8, 43 2.5"
              fill="none"
              stroke="#FF9900"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path d="M43 2.5 L38.5 2 L41.5 5.5 Z" fill="#FF9900" />
          </svg>
        </span>
      );

    case 'EBAY':
      return (
        <span className="text-[17px] font-bold lowercase tracking-tight">
          <span style={{ color: '#E53238' }}>e</span>
          <span style={{ color: '#0064D2' }}>b</span>
          <span style={{ color: '#F5AF02' }}>a</span>
          <span style={{ color: '#86B817' }}>y</span>
        </span>
      );

    case 'WALMART':
      return (
        <span className="flex items-center gap-1.5 leading-none">
          <span className="text-[14px] font-bold tracking-tight text-white">Walmart</span>
          <Spark className="h-4 w-4" />
        </span>
      );

    case 'SHOPIFY':
      return (
        <span className="flex items-center gap-1.5 leading-none">
          <svg viewBox="0 0 16 18" className="h-4 w-4" aria-hidden="true">
            <path
              d="M11.4 2.2 L13.6 2.9 L15 16.4 L5.4 17.8 L1 15.9 L3.6 3.4 Z"
              fill="#95BF47"
            />
            <path d="M13.6 2.9 L15 16.4 L5.4 17.8 L8.6 2.4 Z" fill="#5E8E3E" />
          </svg>
          <span className="text-[14px] font-bold tracking-tight text-white">shopify</span>
        </span>
      );

    case 'ETSY':
      return (
        <span className="text-[16px] font-bold tracking-tight" style={{ color: '#F1641E' }}>
          Etsy
        </span>
      );

    case 'TIKTOK_SHOP':
      return (
        <span className="flex items-center gap-1.5 leading-none">
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
            <path
              d="M9.6 1.4 v8.2 a2.4 2.4 0 1 1 -2-2.36"
              fill="none"
              stroke="#25F4EE"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <path
              d="M10.7 2.2 v8.2 a2.4 2.4 0 1 1 -2-2.36 M10.7 2.2 c0.5 1.6 1.7 2.5 3.4 2.6"
              fill="none"
              stroke="#FE2C55"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-[13px] font-bold tracking-tight text-white">TikTok Shop</span>
        </span>
      );

    case 'WAYFAIR':
      return (
        <span
          className="text-[15px] font-bold tracking-tight"
          style={{ color: '#7F187F' }}
        >
          <span style={{ color: '#B94FB9' }}>way</span>
          <span className="text-white">fair</span>
        </span>
      );

    case 'FAIRE':
      return (
        <span className="text-[17px] font-semibold tracking-[0.02em] text-white">Faire</span>
      );

    case 'TARGET_PLUS':
      return (
        <span className="flex items-center gap-1.5 leading-none">
          {/* Nishon — uchta halqa */}
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
            <circle cx="8" cy="8" r="7" fill="#CC0000" />
            <circle cx="8" cy="8" r="4.6" fill="#fff" />
            <circle cx="8" cy="8" r="2.3" fill="#CC0000" />
          </svg>
          <span className="text-[13px] font-bold tracking-tight text-white">Target Plus</span>
        </span>
      );

    case 'TEMU':
      return (
        <span className="text-[17px] font-bold tracking-tight" style={{ color: '#FB7701' }}>
          Temu
        </span>
      );

    case 'HOUZZ':
      return (
        <span className="flex items-center gap-1.5 leading-none">
          {/* Uy shakli */}
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
            <path d="M3 7 L8 3 L13 7 v6 h-3.5 v-3.5 h-3 V13 H3 Z" fill="#4DBC15" />
          </svg>
          <span className="text-[14px] font-bold tracking-tight text-white">Houzz</span>
        </span>
      );

    case 'MICHAELS':
      return (
        <span className="text-[15px] font-bold tracking-tight" style={{ color: '#E4002B' }}>
          Michaels
        </span>
      );

    case 'OVERSTOCK':
      return (
        <span className="text-[15px] font-bold tracking-tight" style={{ color: '#C8102E' }}>
          Overstock
        </span>
      );

    case 'POSHMARK':
      return (
        <span className="text-[15px] font-bold tracking-tight" style={{ color: '#7F0353' }}>
          <span style={{ color: '#AE1E68' }}>Posh</span>
          <span className="text-white">mark</span>
        </span>
      );

    case 'MERCARI':
      return (
        <span className="flex items-center gap-1.5 leading-none">
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
            <circle cx="8" cy="8" r="7" fill="#5255A4" />
            <path d="M4.6 11 V5.4 l3.4 3 3.4-3 V11" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <span className="text-[14px] font-bold tracking-tight text-white">Mercari</span>
        </span>
      );

    case 'MACYS':
      return (
        <span className="flex items-center gap-1 leading-none">
          <span className="text-[15px] font-bold tracking-tight text-white">macy&rsquo;s</span>
          {/* Yulduzcha — brendning belgisi */}
          <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
            <path
              d="M8 1 L9.7 6.1 L15 6.1 L10.7 9.3 L12.4 14.4 L8 11.2 L3.6 14.4 L5.3 9.3 L1 6.1 L6.3 6.1 Z"
              fill="#E01A2B"
            />
          </svg>
        </span>
      );

    case 'BONANZA':
      return (
        <span className="text-[15px] font-bold tracking-tight" style={{ color: '#3AAE49' }}>
          Bonanza
        </span>
      );

    case 'ALIBABA':
      return (
        <span className="text-[15px] font-bold tracking-tight" style={{ color: '#FF6A00' }}>
          Alibaba
        </span>
      );

    default:
      return null;
  }
}
