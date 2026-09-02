import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LOCALES, type Locale } from '@ecwt/contracts';
import { isLocale } from '@/i18n';
import { NightBackdrop } from '@/components/marketing/NightBackdrop';
import { BadgeTypewriter } from '@/components/marketing/BadgeTypewriter';
import { CursorOrbitDots } from '@/components/marketing/CursorOrbitDots';
import { CursorNetworkDots } from '@/components/marketing/CursorNetworkDots';
import { HOME_COPY } from '@/components/marketing/home-copy';
import { MarketplaceMarquee, MARKETPLACE_COUNT } from '@/components/marketing/MarketplaceMarquee';
import { TashkentClock } from '@/components/marketing/TashkentClock';
import { TypewriterHeadline } from '@/components/marketing/TypewriterHeadline';
import { SiteSound } from '@/components/marketing/SiteSound';
import { ChatWidget } from '@/components/marketing/ChatWidget';
import { LedButton } from '@/components/marketing/LedButton';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { Reveal } from '@/components/marketing/Reveal';
import { CountUp } from '@/components/marketing/CountUp';

/**
 * Bosh sahifa — bir yarim ekran.
 *
 *   1 ekran   — asosiy gap: shior, qisqa izoh, chaqiruv.
 *   ½ ekran   — faqat raqamlar.
 *
 * Boshqa hech narsa. Ilgari bu yerda beshta bo'lim bor edi (jarayon,
 * xizmatlar, yakuniy chaqiruv) va sahifa uzun varaqqa aylangandi.
 * Endi u bitta qat'iy gap aytadi va tugaydi.
 *
 * Vizualning o'zi ham o'zgardi: chizilgan globus olib tashlandi va
 * uning o'rnini fondagi haqiqiy video egalladi. Ikkita shar kerak
 * emas edi.
 *
 * ── Kompozitsiya ─────────────────────────────────────────────────────
 * Keng ekranda Yer chapda, matn o'ngda — ikkalasi yonma-yon turadi.
 * Kichik ekranda ustma-ust: Yer yuqorida, matn ostida.
 *
 * Raqamlar lentaning O'ZIDAN sanaladi (`MARKETPLACE_COUNT`), shuning
 * uchun raqam bilan lenta hech qachon bir-biridan farq qilmaydi.
 */

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const locale: Locale = raw;
  const t = HOME_COPY[locale];

  return (
    <main
      data-surface="dark"
      className="relative isolate min-h-screen overflow-hidden bg-[#03060f] text-white"
    >
      <NightBackdrop />
      <CursorNetworkDots />
      <CursorOrbitDots />

      {/* Ovoz. Hech narsa chizmaydi: ko'rinadigan boshqaruvi yo'q va
          sahifadagi birinchi bosishda o'zi yoqiladi. */}
      <SiteSound />

      {/* Yordamchi — o'ng pastki burchakda. Savol-javob serverdagi
          `/api/chat` orqali ketadi: OpenAI kaliti brauzerga tushmaydi. */}
      <ChatWidget copy={t.chat} />

      {/* Panel va birinchi ekran bitta ustunda.
          Sabab: telefonda panel OQIMDA turadi va o'z balandligini
          egallaydi. Hero ga alohida `min-h-svh` berilsa, ikkalasi
          qo'shilib ekrandan oshib ketadi va pastdagi ishora ko'rinmay
          qoladi. `flex-1` esa hero ga aynan QOLGANINI beradi —
          panel balandligi qanday bo'lsa ham. */}
      <div className="relative flex min-h-svh flex-col">
        {/* ═════════════════════════════════ Soat, til va kirish.
            O'ng tepa burchakka mahkamlangan. Tor ekranda esa ataylab
            absolyut EMAS — u yerda panel deyarli butun kenglikni
            egallaydi va logotip ostida qolib ketardi. Oqimda bo'lsa,
            logotip o'z-o'zidan pastga tushadi. */}
        <div className="relative z-20 flex w-full flex-wrap items-center justify-end gap-x-2.5 gap-y-2 border-b border-white/[0.09] bg-[#03060f]/70 px-4 py-2.5 backdrop-blur-md sm:absolute sm:right-0 sm:top-0 sm:w-auto sm:gap-x-3 sm:rounded-bl-2xl sm:border-l sm:py-3">
          <TashkentClock locale={locale} />

          <div className="flex items-center gap-1 rounded-full border border-white/14 bg-white/[0.04] p-1 backdrop-blur-md sm:p-1.5">
            {LOCALES.map((l) => (
              <Link
                key={l}
                href={`/${l}`}
                className={
                  l === locale
                    ? 'rounded-full bg-[#4FE0FF] px-3 py-1.5 text-[12px] font-bold uppercase text-[#04222E] sm:px-4 sm:py-2 sm:text-[13px]'
                    : 'rounded-full px-3 py-1.5 text-[12px] font-medium uppercase text-brand-200 transition-colors hover:text-[#4FE0FF] sm:px-4 sm:py-2 sm:text-[13px]'
                }
              >
                {l}
              </Link>
            ))}
          </div>
        </div>

        {/* ═════════════════════════════════ 1 ekran */}
        {/* `container-page` bo'limning O'ZIDA emas, ichki bloklarda.
            Sabab: logotiplar lentasi butun ekran bo'ylab o'tishi kerak,
            va konteynerning yon bo'shlig'i uni chetlardan qirqib
            qo'yardi. */}
        <section className="relative flex flex-1 flex-col pb-10 pt-7 sm:pt-9">
          {/* Logotip ataylab `container-page` da EMAS.
              Konteyner keng ekranda matnni markazga tortadi va chapda
              katta bo'sh joy qoladi. Logotip esa o'ng tepadagi panel
              kabi chetga mahkamlanadi — ikkalasi bir chiziqda turadi. */}
          <header className="flex items-center gap-4 pl-4 pr-4 sm:gap-5 sm:pl-6 sm:pr-[31rem]">
            {/* Egasi bergan HAQIQIY logotip fayli (`logo-ecwt.png`) —
                avvalgi CSS bilan qayta yasalgan variant o'rniga.

                Fayl oq fonda qora matn. Sayt fonida esa qora matn
                ko'rinmay qolardi, shuning uchun `invert(1)
                hue-rotate(180deg)` qo'llandi: bu trik OQ-QORA
                (yorug'lik)ni almashtiradi, lekin TO'YINGAN ranglarni
                (qizil nuqtalar) deyarli asl holida qaytaradi — invert
                qizilni siyanga aylantiradi, keyingi 180° burish esa
                uni yana qizilga qaytaradi. Natijada: fon shaffof
                qoladi (PNG alfa-kanali), matn oq, nuqtalar qizil.

                ── Nega "qirqilgan" ──────────────────────────────────
                Faylning O'ZIDA pastda tagline allaqachon bor
                ("O'ZBEKISTON ELEKTRON TIJORAT KOMPANIYASI"), lekin u
                juda mayda. Yonida xuddi shu matnni yana bir marta,
                kattaroq shrift bilan qo'yganimizda — ikkitasi birga
                chiqib, tagline IKKI MARTA ko'ringan (egasi shuni
                to'g'ri payqadi). Endi rasm faqat belgi qismigacha
                (~76% balandlik) `object-cover` bilan kesiladi, pastki
                tagline qatori umuman ko'rinmaydi — u yerda faqat
                ALOHIDA matn (pastda) qoladi, bittagina nusxada. */}
            {/* Tashqi qobiq `overflow-hidden` EMAS — orqadagi porlash
                (pastda) rasm chegarasidan CHETGA chiqib xiralashishi
                kerak. Faqat ICHKARIDAGI qobiq kesadi (rasmning pastki
                tagline qatorini yashirish uchun). */}
            <div className="relative shrink-0">
              {/* Fon yoritgich — sheen chiziq o'tayotgan paytda (5s
                  siklning boshida) yorqinlashadigan xira nur. Egasi
                  "sheen o'zi juda sust, bilinmayabdi" dedi — endi
                  logotip ORQASIDA aniq ko'rinadigan porlash bor,
                  `animate-sheen` bilan BIR XIL 5s davrda sinxron
                  (`ecwt-logo-glow`, `globals.css`). */}
              <span
                aria-hidden="true"
                className="animate-logo-glow pointer-events-none absolute -inset-3 rounded-full sm:-inset-4"
                style={{
                  background: 'radial-gradient(circle, rgba(79,224,255,0.65) 0%, transparent 72%)',
                  filter: 'blur(10px)',
                }}
              />
              <div className="relative h-[52px] w-[104px] overflow-hidden sm:h-[65px] sm:w-[130px]">
                {/* `h-auto` bilan rasm o'z tabiiy nisbatida (1571:1001)
                    to'liq kengligicha chiziladi — gorizontal QIRQILMAYDI.
                    Ota-blok esa undan PASTROQ, shuning uchun rasmning
                    pastki qismi (tagline qatori) shunchaki ko'rinmaydi. */}
                <img
                  src="/logo-ecwt.png"
                  alt="ECWT"
                  className="relative h-auto w-[104px] sm:w-[130px]"
                  style={{ filter: 'invert(1) hue-rotate(180deg)' }}
                />
                {/* "Ro'yxatdan o'tish" tugmasidagi bilan BIR XIL yaltirash
                    (`animate-sheen`, `globals.css`) — logotip ustidan ham
                    kam-kam yorug' chiziq o'tib turadi. */}
                <span
                  aria-hidden="true"
                  className="animate-sheen pointer-events-none absolute inset-y-0 left-0 w-1/4"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.65) 50%, transparent 100%)',
                    mixBlendMode: 'overlay',
                  }}
                />
              </div>
            </div>
            {/* To'liq nom ALOHIDA matn sifatida, rasm ICHIDA emas.
                Rasmdagi tagline juda mayda edi — logotipni sarlavha
                balandligiga moslab kichraytirsak, ichidagi mayda matn
                o'qib bo'lmas darajada kichrayardi. Bu yerda esa u
                o'zining shrift o'lchamiga ega va logotip qanchalik
                kichik bo'lmasin, doim o'qiladi.

                ── "Premium" ko'rinish ──────────────────────────────
                Egasi buni kichraytirib, nafisroq qilishni so'radi.
                Naqsh — qalin logotip + YUPQA, keng oraliqli tagline —
                zargarlik va premium brendlarda keng tarqalgan
                kontrast: `font-semibold` -> `font-light`, harflar
                orasi ikki barobardan ko'proq kengaytirildi
                (0.12/0.16em -> 0.26/0.3em), rang esa to'liq oqdan
                sal xiraroqqa (`text-white/75`) — shunda u qalin
                logotip bilan TALASHMAYDI, balki uni to'ldiradi. */}
            {/* Har bir harf BIR XIL `animate-letter-glow` animatsiyasini
                ishlatadi, lekin `animationDelay` harf tartibiga qarab
                hisoblanadi — shuning uchun ular bir vaqtda emas,
                ketma-ket "yonib" o'tadi, go'yo yorug'lik chapdan o'ngga
                yugurayotganday. */}
            <span className="max-w-[13rem] text-[10px] font-light uppercase leading-[1.5] tracking-[0.26em] text-white/75 sm:max-w-[20rem] sm:text-[12px] sm:leading-relaxed sm:tracking-[0.3em]">
              {t.companyLines.join(' ').split('').map((ch, i, arr) => (
                <span
                  key={i}
                  className="animate-letter-glow"
                  style={{ animationDelay: `${(i / arr.length) * 4}s` }}
                >
                  {ch}
                </span>
              ))}
            </span>
          </header>

          {/* Matn o'ng yarimda: chapda fondagi video turadi.
              Asoschining surati bu yerda BO'LGAN edi, lekin egasi
              natijani ko'rib "olib tashla" dedi — o'chirildi.
              `founder-asror.png` diskda qoldi, hozircha ishlatilmaydi. */}
          <div className="container-page flex min-w-0 flex-1 items-end pb-6 pt-10 lg:items-center lg:justify-end lg:pb-0">
            {/* `min-w-0` — busiz flex elementlar standart holatda
                `min-width: auto` oladi, ya'ni ICHIDAGI eng KENG
                bo'linmagan matnga (`white-space: nowrap`,
                `TypewriterHeadline` ichida) moslashib, o'zining
                `max-width` chegarasini E'TIBORSIZ qoldiradi. Aynan shu
                sababdan uzun gap butun ekrandan pastga chiqib ketardi:
                `52rem` chegara emas, faqat "istak" bo'lib qolgan edi.
                `min-w-0` flex elementga o'z kengligidan CHIQMASLIKKA
                ruxsat beradi, shunda `TypewriterHeadline`ning o'z
                ichki kichraytirish mantig'i ishga tushadi. */}
            <div className="flex w-full min-w-0 flex-col items-center text-center lg:-translate-y-12 lg:max-w-[52rem] lg:items-start lg:text-left">
              <Reveal>
                {/* Ko'z tushadigan birinchi satr — avval statik
                    "GLOBAL MARKETPLACE'LAR" turardi, egasi o'rniga
                    yozuv-yozuv chiqadigan (typewriter) qisqa
                    yorliqlarni so'radi (`BadgeTypewriter`). */}
                <span className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-brand-200 backdrop-blur-md sm:mb-7">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-[#4FE0FF] opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#4FE0FF]" />
                  </span>
                  <BadgeTypewriter words={t.badgeTags} />
                </span>
              </Reveal>

              {/* `className="w-full"` — HAQIQIY ILDIZ SABAB shu yerda
                  edi. Ota-blok `items-start` bilan bolalarni
                  CHO'ZMAYDI, shuning uchun `Reveal`ning o'z (nomsiz)
                  `<div>` qobig'i h1 qanchalik kichik bo'lsa, shunchalik
                  qisqarib qolardi (52rem ustunga emas). h1'dagi
                  `w-full` bekorga ketardi — u shu tor qobiqning
                  "100%" iga, ya'ni yana o'sha kichik qiymatga
                  cho'zilardi. Endi Reveal'ning o'zi kengga cho'ziladi,
                  h1 esa HAQIQIY 52rem'ga nisbatan "100%" oladi. */}
              <Reveal delay={80} className="w-full">
                {/* Sarlavha — sahifaning bosh qahramoni. `tracking` manfiy:
                    yirik o'lchamda harflar orasi kengaygandek ko'rinadi va
                    uni qaytarib tortish kerak.

                    Bir nechta sarlavha+izoh JUFTLIGI ketma-ket
                    yozilib-eritiladi (`TypewriterHeadline`) — bitta
                    qat'iy shior o'rniga mahsulotning turli qirralari
                    ko'rsatiladi. `TypewriterHeadline` o'zi `<h1>` va
                    ostidagi izoh `<p>`sini BIRGA chiqaradi, chunki
                    ikkalasi bitta fikr sifatida BIRGA yozilib, BIRGA
                    eriydi.

                    ── QATOR CHEGARASI OLDINDAN HISOBLANADI ───────────
                    Bir necha usul sinaldi: tabiiy ko'chirish (matn
                    o'sganda so'z 2-qatorga sakrab o'tardi), bitta
                    qatorga majburlab avtomatik kichraytirish (egasi
                    buni ham xohlamadi — "2 qatorda, 1-si to'liq
                    bo'lib, keyin 2-si" ko'rinishini so'radi). Endi
                    `TypewriterHeadline` sarlavha yozila BOSHLASHIDAN
                    OLDIN uni ikkiga bo'ladi (ko'rinmas o'lchov +
                    `Range` orqali), keyin har qatorni MUSTAQIL,
                    alohida harf-harf yozadi. 1-qator hech qachon
                    qayta hisoblanmaydi — qatorlar KETMA-KET, biri
                    tugagach keyingisi boshlanadi. Shuning uchun bu
                    yerda balandlik ANIQ 3 QATOR + descender
                    zaxirasi. */}
                <TypewriterHeadline
                  phrases={t.heroRotating}
                  titleClassName="font-display text-on-video-strong text-white h-[3.2em] w-full overflow-hidden text-[2.75rem] font-medium leading-[0.86] tracking-[-0.02em] sm:text-[3.75rem] lg:text-[4.5rem] [@media(max-height:820px)]:lg:text-[3.5rem]"
                  subClassName="text-on-video-strong mt-2 [@media(max-height:820px)]:mt-2 max-w-[46ch] h-[4.65em] overflow-hidden text-[21px] leading-[1.55] text-white sm:mt-3 sm:text-[24px]"
                />
              </Reveal>

              {/* Ikkita chaqiruv yonma-yon: yangi foydalanuvchi uchun
                  ro'yxatdan o'tish, qaytgani uchun kirish. "Kirish"
                  ilgari o'ng tepadagi panelda edi — bu yerda u ko'proq
                  ko'zga tashlanadi va ikkalasi bir joyda turadi. */}
              <Reveal delay={240} className="mt-8 sm:mt-10 [@media(max-height:820px)]:mt-5">
                <span className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:justify-start">
                  <LedButton href={`/${locale}/demo`} variant="primary">
                    {t.register}
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </LedButton>

                  <LedButton href={`/${locale}/login`} variant="ghost">
                    {t.login}
                  </LedButton>
                </span>
              </Reveal>

              {/* ── Dalil ────────────────────────────────────────────
                  Yangi kelgan odamning birinchi savoli "bu kompaniya
                  haqiqatan ishlaydimi?" bo'ladi. Sahifada bunga javob
                  beradigan yagona narsa — davlat hamkorlari, va ular
                  eng pastda, ikkinchi ekranda qolib ketgandi.

                  Endi ular chaqiruv tugmalari ostida turadi: odam
                  qaror qabul qilayotgan aynan o'sha lahzada ko'radi.
                  Pastdagi takrori olib tashlandi — bir sahifada bir
                  xil ro'yxatni ikki marta ko'rsatish ishonch qo'shmaydi.

                  Ataylab bezaksiz: logotip ham, ramka ham yo'q. Bu
                  yerda vazirlik NOMIning o'zi ishlaydi. */}
              <Reveal delay={320} className="mt-7 sm:mt-8 [@media(max-height:820px)]:mt-5">
                <span className="flex max-w-[36rem] flex-col items-center gap-2 lg:items-start">
                  {/* Ingichka oltin chiziqcha — ishonch blokini
                      sarlavha bilan bir "tilda" gaplashtiradi, oddiy
                      kulrang matnni butunlay begonalashtirmasdan. */}
                  <span aria-hidden="true" className="mb-0.5 h-px w-6 bg-[#16AEDB]/60" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-brand-200/60">
                    {t.partnersTitle}
                  </span>
                  <span className="text-on-video-strong text-balance text-center text-[12.5px] leading-[1.55] text-[#d6e6f5]/80 lg:text-left">
                    {t.partners.join('  ·  ')}
                  </span>
                </span>
              </Reveal>

              {/* Founder tajribasi — bir jumlalik, halol ishonch belgisi.
                  Platforma hali daromadsiz, shuning uchun bu yerda
                  o'ylab topilgan mijoz otzivi YO'Q. Faqat tekshiriladigan
                  fakt: asoschi shaxsan eksport qilgan. */}
              <Reveal delay={360} className="mt-3">
                <p className="text-on-video-strong text-balance text-center text-[11.5px] leading-[1.5] text-brand-200/70 lg:text-left">
                  {t.founderNote}
                </p>
              </Reveal>
            </div>
          </div>

          {/* Marketplace logotiplari — butun ekran bo'ylab, o'ngdan
              chapga. Matn blokidan CHIQARILGAN: u yerda lenta atigi
              34rem ga sig'ardi va bir vaqtda to'rttagina logotip
              ko'rinardi. */}
          <Reveal className="w-full" delay={400}>
            <div className="mb-9 mt-5 sm:mb-10">
              {/* Lentaning ustidagi yorliq.
                  Busiz lenta shunchaki logotiplar to'plami bo'lib
                  ko'rinadi va o'quvchi "bular kim?" deb o'ylaydi.
                  Yorliq esa aniq va'dani aytadi: mahsulot AYNAN shu
                  joylarda sotiladi. */}
              <p className="container-page mb-5 text-[12px] font-medium uppercase tracking-[0.2em] text-brand-200/60 sm:text-[13px]">
                {t.marketplacesLabel}
              </p>
              <MarketplaceMarquee label={t.marketplacesLabel} />
            </div>
          </Reveal>

          {/* Pastga ishora — davomi borligini aytadi */}
          <span className="animate-scroll-cue mx-auto flex flex-col items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-brand-200/70">
            {t.scrollHint}
            <span aria-hidden="true" className="text-[20px] leading-none">
              ↓
            </span>
          </span>
        </section>
      </div>

      {/* ═════════════════════════════════ ½ ekran — faqat raqamlar */}
      {/* Pastki bo'shliq QISQARTIRILDI: 64 -> 32 piksel.
          Pastki qator shu bo'limning ichiga kirgani uchun uning o'z
          `pt-6` i allaqachon havo beradi — ikkalasi qo'shilsa
          ortiqcha bo'shliq paydo bo'lardi va sahifa yana cho'zilardi. */}
      <section className="container-page relative flex min-h-[50svh] flex-col justify-center pb-7 pt-12 sm:pb-8 sm:pt-14">
        {/* Bu yerda fonni qoraytiradigan soya bor edi — OLIB TASHLANDI.

            U matnni o'qiladigan qilgan, lekin egasi uni ko'rib qoldi:
            "qora parda nega turibdi?". U haq edi — video yetarlicha
            quyuq bo'lgan lahzada soyaning o'zi dog' bo'lib ko'rinardi,
            chunki u videodan ham quyuqroq edi.

            Endi kontrast fonda emas, HARFLARDA hal qilinadi:
            `text-on-video-strong` har bir harf atrofiga zich, tor
            halqa chizadi. U faqat glif chegarasida ishlaydi, ya'ni
            fonda ko'rinadigan chegara qoldirmaydi va videoning bir
            pikseli ham qoraymaydi.

            Ochiq aytilsin: WCAG nisbati fonning O'ZI bo'yicha
            o'lchanadi, shuning uchun videoning eng yorug' lahzasida
            rasmiy ko'rsatkich me'yordan past qoladi (oq 3.45:1).
            Soya buni amalda qoplaydi, lekin formulada emas. Bu ataylab
            qilingan tanlov: egasi videoni ochiq ko'rishni afzal
            ko'rdi. */}

        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center">
          <Reveal>
            <p className="text-on-video-strong text-balance text-center text-[1.75rem] font-bold leading-[1.15] tracking-[-0.025em] sm:text-[2.5rem]">
              {t.statsLine}
            </p>
          </Reveal>

          {/* Karta yo'q — faqat nozik ajratgichlar. Raqamlar o'zi
              yetarlicha kuchli, ularni quti ichiga qamash kerak emas.

              Ekranga kirganda ular noldan sanab chiqadi: savdo
              sahifasida harakatlanayotgan son o'sishni anglatadi va
              quruq faktdan ko'ra ko'proq gapiradi. */}
          <Reveal className="w-full" delay={120}>
            {/* Telefonda ham UCH USTUN. Ustma-ust qo'yilsa bo'lim
                640px ga cho'ziladi va "yarim bet" va'dasi buziladi —
                sahifa 1.5 emas, 1.86 betga aylanadi. Raqamlar qisqa
                ("12", "2+", "$1.1T"), shuning uchun ular tor ustunga
                ham bemalol sig'adi. */}
            <dl className="mt-8 grid w-full grid-cols-3 divide-x divide-white/[0.1] sm:mt-10">
              {t.stats.map((s, i) => (
                <div key={s.label} className="flex flex-col items-center gap-2 px-2 sm:px-6">
                  <dt className="text-on-video-strong text-[1.75rem] font-bold leading-none tracking-[-0.03em] text-green-400 sm:text-[3.25rem]">
                    {/* Birinchi raqam LENTADAN sanaladi. Qo'lda yozilsa,
                        lentaga yangi yorliq qo'shilganda u eskirib qoladi
                        va tashrifchi sanaganda qarama-qarshilikni ko'radi.

                        `tabular-nums` bo'lmasa sanash paytida raqam
                        kengligi o'zgarib, u qaltirab turadi. */}
                    <CountUp
                      value={i === 0 ? String(MARKETPLACE_COUNT) : s.value}
                      className="tabular-nums"
                    />
                  </dt>
                  <dd className="text-on-video-strong text-center text-[10px] font-medium uppercase tracking-[0.12em] text-brand-200 sm:text-[12px] sm:tracking-[0.14em]">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          {/* Bozor raqami o'z-o'zicha statik ko'rinadi. Istiqbol esa
              o'sishni ko'rsatadi — savdo sahifasida muhimi shu. */}
          <Reveal delay={200}>
            <p className="text-on-video-strong mt-5 text-center text-[12.5px] leading-[1.6] text-brand-200/80 sm:mt-6 sm:text-[13.5px]">
              {t.marketNote}
            </p>
          </Reveal>

          {/* Hamkorlar ro'yxati bu yerdan OLIB TASHLANDI va birinchi
              ekranga, chaqiruv tugmalari ostiga ko'chirildi.

              Sabab: u sahifadagi yagona dalil, lekin uni ko'rish uchun
              pastga tushish kerak edi — ya'ni odam qaror qabul
              qiladigan lahzada u ko'rinmasdi. Ikki joyda takrorlash
              esa ishonch qo'shmaydi, faqat joy egallaydi.

              Bu yerda "4 Hamkor" raqami qoladi: u yuqoridagi nomlarga
              ishora qiladi. */}

          {/* Pastki blok — ALOHIDA bo'lim EMAS.
              Avval u sahifaning oxiriga qo'shilgan edi va sahifa 1184
              dan 1532 pikselga cho'zilgandi. "Bir yarim ekran" degan
              va'da buzilgandi. Endi u shu bo'limning ichida, raqamlar
              ostida turadi — sahifa uzunligi o'zgarmaydi. */}
          <SiteFooter locale={locale} />
        </div>
      </section>
    </main>
  );
}
