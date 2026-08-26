import { landCells } from './world-data';

/**
 * Nuqtalardan yig'ilgan dunyo xaritasi.
 *
 * Quruqlik to'ri `world-data.ts` da — u shu xarita bilan globus
 * o'rtasida baham ko'riladi. Tashqi rasm yoki kutubxona kerak emas.
 */

const CELL = 10;
const DOT = 1.7;

/** Uzunlik va kenglikni SVG koordinatasiga o'giradi */
function project(lon: number, lat: number): { x: number; y: number } {
  return {
    x: ((lon + 180) / 5) * CELL + CELL / 2,
    y: ((85 - lat) / 5) * CELL + CELL / 2,
  };
}

const TASHKENT = project(69.24, 41.3);
const NEW_YORK = project(-74.0, 40.7);

/** Ikki shahar orasidagi yoy — shimoldan, haqiqiy qutb yo'nalishi kabi */
const ROUTE = `M ${TASHKENT.x} ${TASHKENT.y} Q 360 18 ${NEW_YORK.x} ${NEW_YORK.y}`;

/**
 * `hub` ko'rinishi uchun yo'nalishlar — jahon bozorlarining yirik
 * nuqtalari. Bular sotuv joylari emas, xaritada "O'zbekistondan
 * dunyoga" g'oyasini ko'rsatadigan belgilar.
 */
const HUB_TARGETS = [
  project(-74.0, 40.7), // Nyu-York
  project(-118.2, 34.1), // Los-Anjeles
  project(-0.13, 51.5), // London
  project(13.4, 52.5), // Berlin
  project(139.7, 35.7), // Tokio
  project(151.2, -33.9), // Sidney
  project(-46.6, -23.5), // San-Paulu
  project(55.3, 25.2), // Dubay
] as const;

/** Toshkentdan nuqtaga yumshoq yoy: o'rta nuqta perpendikulyar siljiydi */
function hubArc(to: { x: number; y: number }): string {
  const dx = to.x - TASHKENT.x;
  const dy = to.y - TASHKENT.y;
  const len = Math.hypot(dx, dy) || 1;
  const bend = len * 0.16;

  const qx = (TASHKENT.x + to.x) / 2 - (dy / len) * bend;
  const qy = (TASHKENT.y + to.y) / 2 + (dx / len) * bend;

  return `M ${TASHKENT.x} ${TASHKENT.y} Q ${qx.toFixed(1)} ${qy.toFixed(1)} ${to.x} ${to.y}`;
}

export function WorldMap({
  className,
  fromLabel,
  toLabel,
  /**
   * `route` — Toshkent -> Nyu-York yo'nalishi va shahar nomlari (`/info`).
   * `hub` — O'zbekistondan bir nechta bozorga tarqaladigan chiziqlar.
   * `mono` — qora fon uchun: faqat oq nuqtalar va bitta qizil marshrut.
   *   Bosh sahifadagi kino uslubida rang yagona urg'u sifatida
   *   ishlatiladi, shuning uchun bu yerda oltin ham, yashil ham yo'q.
   */
  variant = 'route',
  /**
   * `mono` da marshrut rangi. Sukut bo'yicha qizil urg'u, lekin och
   * kulrang fonda och urg'u ko'rinmaydi — u yerda `currentColor` yoki
   * qora uzatiladi.
   */
  routeColor = 'var(--color-signal)',
}: {
  className?: string;
  fromLabel: string;
  toLabel: string;
  variant?: 'route' | 'hub' | 'mono';
  routeColor?: string;
}) {
  const cells = landCells();
  const dots = cells.filter((c) => !c.uz);
  const uzDots = cells.filter((c) => c.uz);
  const at = (c: { row: number; col: number }) => ({
    x: c.col * CELL + CELL / 2,
    y: c.row * CELL + CELL / 2,
  });

  return (
    <svg
      viewBox="0 0 720 290"
      className={className}
      role="img"
      aria-label={`Dunyo xaritasi: ${fromLabel} — ${toLabel} yo'nalishi`}
      preserveAspectRatio="xMidYMid meet"
    >
      <g fill="currentColor">
        {dots.map((cell) => {
          const p = at(cell);
          return <circle key={`${cell.row}-${cell.col}`} cx={p.x} cy={p.y} r={DOT} />;
        })}
      </g>

      {/* O'zbekiston — `hub` ko'rinishida yashil bilan ajratiladi, aks
          holda qolgan quruqlik bilan bir xil chiziladi. */}
      <g fill={variant === 'hub' ? '#22c55e' : 'currentColor'}>
        {uzDots.map((cell) => {
          const p = at(cell);
          return (
            <circle
              key={`uz-${cell.row}-${cell.col}`}
              cx={p.x}
              cy={p.y}
              r={variant === 'hub' ? DOT * 1.45 : DOT}
            />
          );
        })}
      </g>

      {variant === 'mono' ? (
        <>
          {/* Yagona urg'u — O'zbekistondan Amerikaga marshrut */}
          <path
            d={ROUTE}
            fill="none"
            stroke={routeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="7 7"
            className="animate-route"
          />
          <circle cx={TASHKENT.x} cy={TASHKENT.y} r="4.5" fill={routeColor} />
          <circle cx={NEW_YORK.x} cy={NEW_YORK.y} r="4.5" fill={routeColor} />
        </>
      ) : variant === 'hub' ? (
        <>
          {/* O'zbekistondan bir nechta bozorga tarqaladigan chiziqlar */}
          <g fill="none" strokeWidth="1.6" strokeLinecap="round">
            {HUB_TARGETS.map((target) => (
              <path
                key={`${target.x}-${target.y}`}
                d={hubArc(target)}
                stroke="var(--color-brand-400)"
                strokeOpacity="0.85"
                strokeDasharray="6 7"
                className="animate-route"
              />
            ))}
          </g>

          <g fill="var(--color-brand-300)">
            {HUB_TARGETS.map((target) => (
              <circle key={`d-${target.x}-${target.y}`} cx={target.x} cy={target.y} r="3.6" />
            ))}
          </g>

          {/* Manba — O'zbekiston yashil bilan ajratiladi */}
          <circle cx={TASHKENT.x} cy={TASHKENT.y} r="13" fill="#22c55e" fillOpacity="0.18" />
          <circle cx={TASHKENT.x} cy={TASHKENT.y} r="5" fill="#22c55e" />
          <circle
            cx={TASHKENT.x}
            cy={TASHKENT.y}
            r="10"
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.5"
            className="animate-ping-slow"
          />
        </>
      ) : (
        <>
          {/* Toshkent -> Nyu-York yoyi. Punktir sekin oqib turadi — harakat
              sezilar-sezilmas, lekin sahifa "tirik" ko'rinadi. */}
          <path
            d={ROUTE}
            fill="none"
            stroke="var(--color-gold-400)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="7 7"
            opacity="0.9"
            className="animate-route"
          />

          <circle cx={TASHKENT.x} cy={TASHKENT.y} r="4.5" fill="var(--color-gold-300)" />
          <circle cx={NEW_YORK.x} cy={NEW_YORK.y} r="4.5" fill="var(--color-gold-300)" />
          <circle
            cx={NEW_YORK.x}
            cy={NEW_YORK.y}
            r="9"
            fill="none"
            stroke="var(--color-gold-300)"
            strokeWidth="1.5"
            className="animate-ping-slow"
          />

          {/* Shahar nomlari nuqtalar ustiga tushadi — o'qilishi uchun
              harflarga fon rangidagi ingichka kontur beriladi. */}
          <g
            fill="var(--color-gold-200)"
            fontSize="11"
            fontWeight="500"
            letterSpacing="0.3"
            stroke="var(--color-brand-950)"
            strokeWidth="3.5"
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            <text x={TASHKENT.x + 11} y={TASHKENT.y + 4}>
              {fromLabel}
            </text>
            <text x={NEW_YORK.x - 15} y={NEW_YORK.y + 4} textAnchor="end">
              {toLabel}
            </text>
          </g>
        </>
      )}
    </svg>
  );
}
