/**
 * ECWT belgisi — logotipning o'zagi.
 *
 * Kompaniya logotipi to'liq holida meridianli globus, uning atrofida
 * aylana bo'ylab sakkizta marketplace belgisi va pastda "ECWT /
 * E-COMMERCE WORLD TRADE" so'z belgisidan iborat.
 *
 * Bu yerda faqat MARKAZI chizilgan, va bu ataylab: sarlavha panelida
 * belgi 48px atrofida turadi, o'sha o'lchamda sakkizta kichik brend
 * belgisi bir-biriga qo'shilib, tanib bo'lmas dog'ga aylanadi. Globus
 * esa mayda o'lchamda ham aniq o'qiladi.
 *
 * Ranglar logotipdagidek: to'q ko'k chiziqlar oq asosda. Sahifa foni
 * qorong'i bo'lgani uchun oq plitka belgini ajratib turadi — xuddi
 * logotipning o'z oq fonidagidek.
 *
 * ── Bu vaqtinchalik ─────────────────────────────────────────────────
 * Asl logotip fayli (PNG yoki SVG) berilganda shu komponent ichi
 * o'sha faylga almashtiriladi va qolgan kod tegilmaydi.
 */

const NAVY = '#152C5B';
const BLUE = '#2B6DB5';

export function EcwtMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="ECWT">
      {/* Oq plitka — logotipning oq foni */}
      <rect x="0" y="0" width="48" height="48" rx="11" fill="#ffffff" />

      {/* Globus. Chiziqlar qalinligi ataylab bir xil emas: tashqi
          aylana va ekvator qalinroq, meridianlar ingichkaroq — shunda
          shakl mayda o'lchamda ham chalkashmaydi. */}
      <g fill="none" stroke={NAVY} strokeLinecap="round">
        <circle cx="24" cy="24" r="14.5" strokeWidth="2.1" />
        {/* Ekvator */}
        <line x1="9.5" y1="24" x2="38.5" y2="24" strokeWidth="1.9" />
        {/* Yon parallellar */}
        <path d="M12.4 15.6 A 22 22 0 0 0 35.6 15.6" strokeWidth="1.3" />
        <path d="M12.4 32.4 A 22 22 0 0 1 35.6 32.4" strokeWidth="1.3" />
        {/* Meridianlar */}
        <ellipse cx="24" cy="24" rx="7" ry="14.5" strokeWidth="1.3" />
        <line x1="24" y1="9.5" x2="24" y2="38.5" strokeWidth="1.3" />
      </g>

      {/* Aylanma o'q — logotipdagi "harakat" ishorasi */}
      <path
        d="M39.6 17.2 A 16.5 16.5 0 0 1 40 26.4"
        fill="none"
        stroke={BLUE}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M40.6 14.2 L42.6 19.4 L37.2 18.4 Z" fill={BLUE} />
    </svg>
  );
}
