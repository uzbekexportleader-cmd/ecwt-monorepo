import Link from 'next/link';
import type { Locale } from '@ecwt/contracts';
import { HOME_COPY } from './home-copy';
import { CONTACTS } from '@/lib/contacts';

/**
 * Sahifaning pastki qatori — ALOHIDA BO'LIM EMAS.
 *
 * ── Nega u "Bir platforma" bo'limining ichida ───────────────────────
 * Avval bu blok sahifaning oxiriga alohida `<section>` bo'lib
 * qo'shilgandi: logotip, jumla, havolalar, pochta va mualliflik
 * huquqi — har biri o'z qatorida, 348 piksel balandlikda. Sahifa
 * 1184 dan 1532 pikselga cho'zilgandi.
 *
 * Bu sahifaning butun mantig'iga zid edi. U ataylab "bir yarim ekran"
 * qilib qurilgan: birinchi ekran — taklif, yarim ekran — raqamlar,
 * tamom. Uchinchi blok qo'shilishi bilan pastga aylantirish kerak
 * bo'lgan yana bitta bo'sh ekran paydo bo'ldi va egasi buni darrov
 * to'xtatdi.
 *
 * Endi u raqamlar ostida, O'SHA ustunning ichida turadi: nozik
 * ajratgich, bitta qator havola, bitta qator mualliflik. Balandligi
 * 348 emas, ~110 piksel — ya'ni bo'lim `min-h-[50svh]` ichida qoladi
 * va sahifa uzunligi umuman o'zgarmaydi.
 *
 * ── Nega logotip va shior olib tashlandi ────────────────────────────
 * Ikkalasi ham sahifada allaqachon bor: logotip yuqori panelda,
 * shior esa sarlavhaning ostida. Pastda takrorlash ishonch qo'shmaydi,
 * faqat balandlik qo'shadi.
 *
 * ── Til almashtirgichi ATAYLAB yo'q ─────────────────────────────────
 * U sahifaning o'ng tepasida turibdi.
 *
 * ── Havolalar qayerga boradi ────────────────────────────────────────
 * Hammasi `/info` dagi MAVJUD bo'limlarga: u yerda `#about`,
 * `#services`, `#marketplaces` va `#contact` langarlari bor. Ya'ni bu
 * yerda ishlamaydigan havola yo'q.
 */
export function SiteFooter({ locale }: { locale: Locale }) {
  const t = HOME_COPY[locale].footer;
  const year = new Date().getFullYear();

  const links = [
    { label: t.about, href: `/${locale}/info#about` },
    { label: t.services, href: `/${locale}/info#services` },
    { label: t.marketplaces, href: `/${locale}/info#marketplaces` },
    { label: t.help, href: `/${locale}/info#contact` },
  ];

  return (
    <footer className="mt-9 w-full border-t border-white/[0.09] pt-6 sm:mt-11 sm:pt-7">
      {/* Havolalar va pochta — BITTA qator. Telefonda ular o'ralib
          ketadi, lekin ustunga aylanmaydi: `justify-center` bilan
          markazda qolib, ikki qatordan oshmaydi. */}
      <nav className="text-on-video-strong flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-[13px] text-brand-200/85 transition-colors hover:text-white"
          >
            {l.label}
          </Link>
        ))}
        {/* Aloqa — bitta kanal yetadi, beshta emas */}
        <a
          href={`mailto:${CONTACTS.email}`}
          className="text-[13px] text-brand-200/85 transition-colors hover:text-white"
        >
          {CONTACTS.email}
        </a>
      </nav>

      <p className="text-on-video-strong mt-5 text-center text-[11.5px] text-brand-200/70">
        © {year} ECWT. {t.rights}
      </p>
    </footer>
  );
}
