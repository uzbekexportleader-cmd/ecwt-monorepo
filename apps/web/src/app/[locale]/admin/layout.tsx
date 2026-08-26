import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { isLocale } from '@/i18n';
import { getCurrentUser } from '@/lib/session';
import { Sidebar } from '@/components/dashboard/Sidebar';

export const metadata: Metadata = {
  title: 'Admin — ECWT',
  robots: { index: false, follow: false },
};

/**
 * Admin panel himoyasi.
 *
 * Yana bir bor: bu faqat yo'naltirish. Haqiqiy ruxsat tekshiruvi
 * backend'dagi RolesGuard'da — u ADMIN/STAFF bo'lmagan so'rovni
 * 403 bilan rad etadi.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();

  if (!user) redirect(`/${locale}/login`);
  if (user.role === 'SUPPLIER') redirect(`/${locale}/dashboard`);

  return (
    <div className="flex min-h-screen flex-col bg-brand-50 lg:flex-row">
      <Sidebar locale={locale} user={user} />

      <div className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
