import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Locale } from '@ecwt/contracts';

/** Kirish va ro'yxatdan o'tish sahifalari uchun umumiy o'ram */
export function AuthCard({
  locale,
  title,
  subtitle,
  children,
  footer,
}: {
  locale: Locale;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-brand-50">
      <div className="container-page py-6">
        <Link href={`/${locale}`} className="inline-flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800 text-sm font-bold text-white">
            E
          </span>
          <span className="text-base font-bold tracking-tight text-brand-950">ECWT</span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="rounded-card border border-brand-100 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight text-brand-950">{title}</h1>
            <p className="mt-2 text-sm text-brand-500">{subtitle}</p>

            <div className="mt-7">{children}</div>
          </div>

          <p className="mt-6 text-center text-sm text-brand-600">{footer}</p>
        </div>
      </div>
    </main>
  );
}
