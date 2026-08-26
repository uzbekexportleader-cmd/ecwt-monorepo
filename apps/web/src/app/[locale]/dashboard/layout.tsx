import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { isLocale } from '@/i18n';
import { getCurrentUser } from '@/lib/session';
import { Sidebar } from '@/components/dashboard/Sidebar';

export const metadata: Metadata = {
  title: 'Kabinet — ECWT',
  robots: { index: false, follow: false },
};

/**
 * Kabinet uchun himoya.
 *
 * Diqqat: bu faqat foydalanuvchi qulayligi uchun yo'naltirish.
 * Haqiqiy himoya backend'da — har bir API endpoint token va rolni
 * mustaqil tekshiradi, ya'ni bu sahifani chetlab o'tish hech narsa bermaydi.
 */
export default async function DashboardLayout({
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

  // Admin o'z paneliga
  if (user.role !== 'SUPPLIER') redirect(`/${locale}/admin`);

  return (
    <div className="flex min-h-screen flex-col bg-brand-50 lg:flex-row">
      <Sidebar locale={locale} user={user} />

      <div className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
