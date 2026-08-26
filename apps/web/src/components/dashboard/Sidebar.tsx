'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Building2,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  ShoppingBag,
  Store,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type { AuthUser, Locale } from '@ecwt/contracts';
import { UI_TEXT } from '@/lib/labels';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

export function Sidebar({ locale, user }: { locale: Locale; user: AuthUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const t = UI_TEXT[locale];

  const isAdmin = user.role === 'ADMIN' || user.role === 'STAFF';
  const base = isAdmin ? `/${locale}/admin` : `/${locale}/dashboard`;

  const items: NavItem[] = isAdmin
    ? [
        { href: base, label: t.dashboard, icon: Home },
        { href: `${base}/suppliers`, label: t.suppliers, icon: Users },
        { href: `${base}/products`, label: t.review, icon: Package },
        { href: `${base}/leads`, label: t.leads, icon: MessageSquare },
      ]
    : [
        { href: base, label: t.dashboard, icon: Home },
        { href: `${base}/profile`, label: t.profile, icon: Building2 },
        { href: `${base}/products`, label: t.products, icon: Package },
        { href: `${base}/listings`, label: t.listings, icon: Store },
        { href: `${base}/orders`, label: t.orders, icon: ShoppingBag },
        { href: `${base}/payouts`, label: t.payouts, icon: Wallet },
      ];

  async function handleLogout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push(`/${locale}`);
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Kabinet menyusi">
      {items.map((item) => {
        // Bosh sahifa faqat aniq mos kelganda faol bo'ladi,
        // qolganlari ichki sahifalarda ham faol turadi
        const active = item.href === base ? pathname === base : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-brand-800 text-white'
                : 'text-brand-200 hover:bg-brand-800/50 hover:text-white',
            )}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-brand-800 pt-4">
      <div className="px-3 pb-3">
        <p className="truncate text-sm font-medium text-white">{user.fullName}</p>
        <p className="truncate text-xs text-brand-400">{user.email}</p>
      </div>

      <Link
        href={`/${locale}`}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-300 transition-colors hover:bg-brand-800/50 hover:text-white"
      >
        <ClipboardList className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
        {t.backToSite}
      </Link>

      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-300 transition-colors hover:bg-red-900/40 hover:text-red-200"
      >
        <LogOut className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
        {t.logout}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobil sarlavha */}
      <div className="flex items-center justify-between border-b border-brand-100 bg-white px-4 py-3 lg:hidden">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-xs font-bold text-white">
            E
          </span>
          <span className="text-sm font-bold text-brand-950">ECWT</span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menyu"
          aria-expanded={open}
          className="rounded-lg p-2 text-brand-700 hover:bg-brand-50"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-4 bg-brand-950 p-4 lg:hidden">
          {nav}
          {footer}
        </div>
      )}

      {/* Ish stoli yon paneli */}
      <aside className="hidden w-64 shrink-0 flex-col gap-4 bg-brand-950 p-4 lg:flex">
        <Link href={`/${locale}`} className="flex items-center gap-2.5 px-3 py-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-brand-900">
            E
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight text-white">ECWT</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-brand-400">
              {isAdmin ? 'Admin' : 'Partner'}
            </span>
          </span>
        </Link>

        {nav}
        {footer}
      </aside>
    </>
  );
}
