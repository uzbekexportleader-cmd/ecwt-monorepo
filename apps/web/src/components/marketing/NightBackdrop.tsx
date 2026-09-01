'use client';

import { useEffect, useRef } from 'react';

/**
 * Bosh sahifaning foni — tungi dunyo xaritasi videosi, ustida yulduzlar.
 *
 * ── Ikki qatlam ──────────────────────────────────────────────────────
 * ASOS — CSS bilan chizilgan tungi osmon: gradient nurlar va ikki
 * yuzta yulduz. U butun sahifa bo'ylab cho'ziladi va hech narsa
 * yuklamaydi. Video faqat birinchi ekranni egallaydi, shuning uchun
 * pastdagi raqamlar bo'limi shu osmon ustida turadi — ilgari u yerda
 * tekis qora fon bor edi.
 *
 * USTIDA — `public/earth.mp4`: shahar chiroqlari va qit'alar orasidagi
 * bog'lanish chiziqlari. Sikl tutashtirilgan; batafsil o'lchovlar
 * `public/CREDITS.txt` da.
 *
 * ── Nega 4K emas ─────────────────────────────────────────────────────
 * Manba 1920x1080. Uni 4K ga cho'zish yangi tafsilot qo'shmaydi va
 * o'lchov buni tasdiqlagan: 4K variant ekranda 7% XIRAROQ chiqqan
 * (kattalashtirib, keyin ekran o'lchamiga qaytarish qo'shimcha
 * yumshoqlik beradi) va fayl uch barobar og'irlashgan. Shuning uchun
 * tiniqlik boshqa yo'l bilan saqlanadi — siqilishni kamaytirish
 * orqali: CRF 23, manbaga sodiqlik 40.4 dB.
 *
 * ── `cover`, `contain` emas ──────────────────────────────────────────
 * `contain` sharni kichraytiradi va burchakka qamab qo'yadi.
 * `object-cover` da esa u butun ekranni egallaydi va sahifaning o'zi
 * bo'lib qoladi; matn uning ustida turadi, ajratishni parda bajaradi.
 *
 * ── Kontrast fonda emas, HARFLARDA ──────────────────────────────────
 * Ilgari bu yerda matn hududini qoraytiruvchi keng gradient bor edi
 * (0.70 gacha). U o'lchov bilan tanlangan edi, lekin videoning katta
 * qismini xiralashtirardi — pleyerda tiniq ko'ringan kadr saytda hira
 * bo'lib qolgandi. Endi parda yo'q: kontrast `text-on-video-strong`
 * orqali harflarning o'ziga tushadi (`globals.css`), video esa
 * yuqori chekkadan tashqari butun ekranda ochiq qoladi.
 *
 * ── Yulduzlar qanday joylashtirilgan ─────────────────────────────────
 * `Math.random()` ISHLATILMAYDI. U serverda bir xil, brauzerda boshqa
 * natija berardi va React "hydration mismatch" xatosini chiqarardi.
 * O'rniga qat'iy urug'li chiziqli generator: natija har doim aynan bir
 * xil, lekin ko'zga tasodifiy ko'rinadi.
 */

/** Uchuvchi yulduzlar: joyi, burchagi, uzunligi, tezligi va kechikishi */
const SHOOTING_STARS = [
  { top: '12%', left: '58%', angle: 28, dist: '30vw', time: '26s', delay: '3s', len: 100 },
  { top: '32%', left: '72%', angle: 21, dist: '22vw', time: '31s', delay: '15s', len: 82 },
] as const;

/**
 * Takrorlanadigan "tasodif".
 *
 * Bu oddiy chiziqli kongruent generator: bir xil urug'dan har doim bir
 * xil ketma-ketlik chiqadi. Serverda ham, brauzerda ham natija bir xil
 * bo'ladi — aynan shu narsa kerak.
 */
function makeStars(count: number) {
  let seed = 20260826;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  return Array.from({ length: count }, () => {
    const r = next();
    // Ko'pchilik yulduz mayda va xira, sanoqlisi yirik va yorug' —
    // haqiqiy osmon shunday ko'rinadi. Kub daraja aynan shu nisbatni
    // beradi.
    const size = 0.7 + r ** 3 * 2.1;
    return {
      top: `${next() * 100}%`,
      left: `${next() * 100}%`,
      size,
      opacity: 0.18 + r * 0.62,
      /** Miltillash: har biri o'z tezligida va o'z vaqtida */
      duration: `${3.4 + next() * 5.5}s`,
      delay: `${next() * 7}s`,
    };
  });
}

const STARS = makeStars(200);

export function NightBackdrop() {
  /**
   * Sichqoncha ortidan yuruvchi iliq-sovuq nur — "siyoh tun osmonida
   * erib ketganday" effekt (egasi ko'rsatgan namuna asosida).
   *
   * `useState` EMAS: har sichqoncha harakatida qayta render chaqirish
   * butun sahifani (200 ta yulduz, video) qayta hisoblardi. Buning
   * o'rniga DOM elementiga TO'G'RIDAN-TO'G'RI, React'ni chetlab o'tib
   * `transform` yoziladi — brauzer buni kompozitorda, asosiy oqimni
   * band qilmasdan bajaradi.
   *
   * Boshlang'ich holatda ekrandan TASHQARIDA turadi (`-9999px`), toki
   * sichqoncha birinchi marta qimirlamaguncha chap-yuqori burchakda
   * "yaltirab" ko'rinmasin.
   */
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    const handleMove = (e: PointerEvent) => {
      glow.style.transform = `translate3d(${e.clientX - 380}px, ${e.clientY - 380}px, 0)`;
    };

    window.addEventListener('pointermove', handleMove);
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: '#03060f' }} />

      {/* Yumshoq nurlar — chuqurlik uchun. Ular birinchi ekran bo'yida
          qoladi, pastdagi raqamlar bo'limi toza fon ustida turadi. */}
      <div
        className="absolute inset-x-0 top-0 h-svh"
        style={{
          background:
            'radial-gradient(115% 78% at 18% 38%, rgba(43,102,173,0.34) 0%, rgba(43,102,173,0.12) 42%, rgba(3,6,15,0) 72%)',
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-svh"
        style={{
          // Ilgari bu yerda yashil nur bor edi — sahifadagi yagona
          // accent OLTIN bo'lgach, o'sha yashil begona rang bo'lib
          // qoldi (deyarli sezilmas, lekin bor). Endi shu bitta
          // oilaga tegishli.
          background:
            'radial-gradient(78% 58% at 8% 88%, rgba(201,150,46,0.14) 0%, rgba(3,6,15,0) 62%)',
        }}
      />

      {/* Yulduzlar — butun sahifa bo'ylab. Birinchi ekranda ular
          videoning ostida qoladi, pastdagi bo'limda esa ko'rinadi. */}
      <div className="absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="animate-twinkle absolute rounded-full bg-white"
            style={
              {
                top: s.top,
                left: s.left,
                width: `${s.size}px`,
                height: `${s.size}px`,
                // Animatsiya shu qiymatga NISBATAN ishlaydi, shuning
                // uchun `opacity` emas, o'zgaruvchi beriladi.
                '--star-o': s.opacity,
                animationDuration: s.duration,
                animationDelay: s.delay,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Video — EKRANGA mahkamlangan (`fixed`), sahifaga emas.

          ── Nega `absolute inset-0` bo'lmaydi ────────────────────────
          Bir vaqt shunday qilingandi: quti sahifaning butun balandligini
          egallasin, toki pastdagi raqamlar ham video ustida tursin.
          Lekin `object-cover` qutini TO'LDIRISHGA majbur — quti
          balandlashgani sayin kadr kattalashadi va enidan qirqiladi.

          O'lchov (1265px keng ekran, manba 1920x1080):
            quti 1265x720  -> koeffitsient max(0.659, 0.667) = 0.667
                              kadr deyarli to'liq ko'rinadi
            quti 1265x1293 -> koeffitsient max(0.659, 1.197) = 1.197
                              kadr 1.8 barobar kattalashadi, enining
                              45% i qirqilib ketadi
          Aynan shu "zoom in" bo'lib ko'rindi.

          `fixed` bunga barham beradi: quti har doim ekran o'lchamida,
          ya'ni koeffitsient 0.667 da qoladi. Ustiga bu videoni
          sahifaning oxirigacha ham yetkazadi (u har doim ekranda
          turadi) va aylantirganda qimirlamaydi — egasi so'ragandek.

          Matnni o'qish uchun kerakli soya endi bu yerda emas: u
          raqamlar bo'limining O'ZIGA berilgan, shuning uchun u faqat
          matn turgan joyda paydo bo'ladi va video bilan birga
          aylanadi. */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Video — qo'shimcha effektsiz.
            Ilgari bu yerda uch qatlam bor edi: sichqonchaga ergashadigan
            parallaks, miltillovchi nuqtalar va uchib chiquvchi chiziqlar.
            Egasining so'rovi bilan hammasi olib tashlandi — fon
            qimirlamaydi, ustida hech narsa yo'q.

            `playsInline` bo'lmasa iPhone videoni butun ekranga ochib
            yuboradi. `muted` bo'lmasa esa brauzer avtomatik
            o'ynatmaydi. */}
        <video
          className="h-full w-full object-cover"
          src="/earth.mp4"
          poster="/earth-poster.jpg"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />

        {/* Matn tomonini qoraytiruvchi keng parda ATAYLAB YO'Q.

            Bu yerda ilgari ikki gradient bor edi (o'ng yarim yoki
            pastki yarim, 0.6 gacha qora), lekin ular videoning katta
            qismini xiralashtirardi — egasi buni "pleyerda tiniq,
            saytda hira" deb to'g'ri payqadi.

            Pastdagi raqamlar bo'limi xuddi shu muammoni fon EMAS,
            HARFLARNING o'zi bilan hal qilgan edi (`text-on-video-strong`
            — glif chegarasiga tor, zich soya). Hero matni endi o'sha
            texnikaga o'tkazildi, shuning uchun bu yerda parda kerak
            emas: video butun ekranda ochiq qoladi, matn esa har qanday
            kadrda o'zi bilan o'qiladi. */}

        {/* Yuqori chekka — sarlavha paneli o'qilishi uchun.
            Bu ham yengillashtirildi (0.82 -> 0.62): o'sha hisob bo'yicha
            eng yomon holatda 5.9:1 qoladi. */}
        <div
          className="absolute inset-x-0 top-0 h-[16svh]"
          style={{
            background:
              'linear-gradient(180deg, rgba(3,6,15,0.62) 0%, rgba(3,6,15,0.5) 55%, rgba(3,6,15,0.16) 85%, rgba(3,6,15,0) 100%)',
          }}
        />

      </div>

      {/* Iliq (oltin) markazdan sovuq (tungi ko'k) chekkaga o'tuvchi
          xira nur — `screen` qorishmasi uni tun ustiga "yorug'lik"
          sifatida qo'shadi, qora dog' emas. `fixed`: ekranga
          mahkamlangan, video kabi aylantirganda qolib ketmaydi.
          ── Nega VIDEODAN KEYIN ──────────────────────────────────────
          Avval bu qatlam videodan OLDIN turardi — video O'ZI TO'LIQ
          ekranni qopladi (`object-cover`, shaffof emas), shuning uchun
          nur uning OSTIDA butunlay ko'rinmas bo'lib qolardi. Bo'yash
          tartibi DOM tartibiga mos keladi: keyingi qavat oldingisi
          ustidan chiziladi, shuning uchun nur videodan KEYIN kelishi
          shart — aks holda "screen" qorishmasi hech narsaga ta'sir
          qilmaydi. */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          ref={glowRef}
          className="absolute h-[760px] w-[760px] rounded-full transition-transform duration-500 ease-out"
          style={{
            background:
              'radial-gradient(circle, rgba(240,201,135,0.32) 0%, rgba(58,110,180,0.16) 45%, rgba(3,6,15,0) 72%)',
            filter: 'blur(64px)',
            mixBlendMode: 'screen',
            transform: 'translate3d(-9999px, -9999px, 0)',
          }}
        />
      </div>

      {/* Uchuvchi yulduzlar. Tashqi qatlam yo'nalishni beradi, ichkarisi
          o'sha yo'nalish bo'ylab uchadi — shu sababli burilish bilan
          harakat bir-birini bekor qilmaydi. */}
      {SHOOTING_STARS.map((s) => (
        <span
          key={`${s.top}-${s.left}`}
          className="absolute"
          style={{ top: s.top, left: s.left, transform: `rotate(${s.angle}deg)` }}
        >
          <span
            className="animate-shoot block h-px rounded-full"
            style={
              {
                width: `${s.len}px`,
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(150,205,255,0.35) 55%, rgba(220,240,255,0.7) 100%)',
                '--shoot-dist': s.dist,
                '--shoot-time': s.time,
                animationDelay: s.delay,
              } as React.CSSProperties
            }
          />
        </span>
      ))}
    </div>
  );
}
