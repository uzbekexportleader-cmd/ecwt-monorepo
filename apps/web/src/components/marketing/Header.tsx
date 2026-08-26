'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { Locale } from '@ecwt/contracts';
import type { Dictionary } from '@/i18n';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ButtonLink } from '@/components/ui/Button';

interface HeaderProps {
  locale: Locale;
  dict: Dictionary;
  isAuthenticated: boolean;
}

export function Header({ locale, dict, isAuthenticated }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Bosh sahifa endi faqat kirish ekrani. Marketing bo'limlari
  // `/info` sahifasida turadi, shuning uchun menyu o'sha yerga ishora
  // qiladi.
  const links = [
    { href: `/${locale}/info#services`, label: dict.nav.services },
    { href: `/${locale}/info#how-it-works`, label: dict.nav.howItWorks },
    { href: `/${locale}/info#marketplaces`, label: dict.nav.marketplaces },
    { href: `/${locale}/info#pricing`, label: dict.nav.pricing },
    { href: `/${locale}/info#contact`, label: dict.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/90 backdrop-blur-sm">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href={`/${locale}`} className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800 text-sm font-bold text-white">
            E
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight text-brand-950">ECWT</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-brand-400">
              World Trade
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Asosiy menyu">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <LocaleSwitcher current={locale} />

          {isAuthenticated ? (
            <ButtonLink href={`/${locale}/dashboard`} size="sm">
              {dict.nav.dashboard}
            </ButtonLink>
          ) : (
            <>
              <ButtonLink
                href={`/${locale}/login`}
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                {dict.nav.login}
              </ButtonLink>
              <ButtonLink href={`/${locale}/register`} size="sm">
                {dict.nav.register}
              </ButtonLink>
            </>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menyu"
            aria-expanded={menuOpen}
            className="rounded-lg p-2 text-brand-700 transition-colors hover:bg-brand-50 lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-brand-100 bg-white lg:hidden" aria-label="Mobil menyu">
          <div className="container-page flex flex-col py-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <Link
                href={`/${locale}/login`}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 sm:hidden"
              >
                {dict.nav.login}
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
