import Link from 'next/link';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import type { Locale } from '@ecwt/contracts';
import type { Dictionary } from '@/i18n';
import { CONTACTS } from '@/lib/contacts';

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-100 bg-brand-950 text-brand-200">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-brand-900">
                E
              </span>
              <span className="text-base font-bold tracking-tight text-white">ECWT</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-brand-300">{dict.footer.tagline}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{dict.footer.company}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href={`/${locale}#about`} className="transition-colors hover:text-white">
                  {dict.nav.about}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#pricing`} className="transition-colors hover:text-white">
                  {dict.nav.pricing}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#contact`} className="transition-colors hover:text-white">
                  {dict.nav.contact}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{dict.footer.services}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href={`/${locale}#services`} className="transition-colors hover:text-white">
                  {dict.nav.services}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}#marketplaces`}
                  className="transition-colors hover:text-white"
                >
                  {dict.nav.marketplaces}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}#how-it-works`}
                  className="transition-colors hover:text-white"
                >
                  {dict.nav.howItWorks}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{dict.contact.direct.title}</h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <a
                  href={`tel:${CONTACTS.phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {CONTACTS.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACTS.email}`}
                  className="flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {CONTACTS.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://t.me/${CONTACTS.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {CONTACTS.telegram}
                </a>
              </li>
              <li className="flex items-start gap-2 text-brand-300">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {dict.contact.direct.addressValue}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-brand-800 pt-6 text-xs text-brand-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} ECWT — E-commerce World Trade. {dict.footer.rights}
          </p>
          <div className="flex gap-4">
            <Link href={`/${locale}/terms`} className="transition-colors hover:text-white">
              {dict.footer.terms}
            </Link>
            <Link href={`/${locale}/privacy`} className="transition-colors hover:text-white">
              {dict.footer.privacy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
