'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { api, isAuthenticated, tokenStorage } from '@/lib/api';

const NAV = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/applications', label: 'Arizalar', icon: '📄' },
  { href: '/subsidies', label: 'Subsidiyalar', icon: '🎗️' },
  { href: '/users', label: 'Foydalanuvchilar', icon: '👥' },
  { href: '/notifications', label: 'Bildirishnomalar', icon: '🔔' },
  { href: '/audit', label: 'Audit jurnali', icon: '🗂️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);

  const logout = async () => {
    const refresh = await tokenStorage.getRefreshToken();
    if (refresh) await api.auth.logout(refresh).catch(() => undefined);
    await tokenStorage.clear();
    router.replace('/login');
  };

  if (!ready) return null;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-[var(--color-line)] bg-[var(--color-elevated)] p-4 md:block">
        <div className="mb-8 flex items-center gap-3 px-2 pt-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)] text-base font-extrabold text-[var(--color-bg)]">
            E
          </div>
          <div>
            <div className="text-sm font-bold tracking-widest">ECWT</div>
            <div className="text-[10px] text-[var(--color-ink-muted)]">Admin panel</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
                style={{
                  backgroundColor: active ? 'rgba(0,194,224,0.12)' : 'transparent',
                  color: active ? 'var(--color-primary)' : 'var(--color-ink-secondary)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button onClick={logout} className="btn btn-secondary mt-8 w-full">
          Chiqish
        </button>
      </aside>

      <div className="flex-1 overflow-x-hidden">
        <header className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-elevated)] px-6 py-3 md:hidden">
          <span className="font-bold tracking-widest">ECWT</span>
          <button onClick={logout} className="text-sm text-[var(--color-ink-secondary)]">
            Chiqish
          </button>
        </header>

        <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-line)] px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs text-[var(--color-ink-secondary)]"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
