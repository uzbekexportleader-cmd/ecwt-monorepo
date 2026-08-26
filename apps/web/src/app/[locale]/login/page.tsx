import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getDictionary, isLocale } from '@/i18n';
import { getCurrentUser } from '@/lib/session';
import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/auth/LoginForm';

const SUBTITLE = {
  uz: 'Hamkor kabinetiga kiring',
  ru: 'Войдите в кабинет партнёра',
  en: 'Sign in to your partner dashboard',
} as const;

const NO_ACCOUNT = {
  uz: 'Akkauntingiz yo‘qmi?',
  ru: 'Нет аккаунта?',
  en: 'Don’t have an account?',
} as const;

export const metadata: Metadata = {
  title: 'Kirish — ECWT',
  robots: { index: false, follow: false },
};

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Allaqachon kirgan bo'lsa kabinetga yuboramiz
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === 'SUPPLIER' ? `/${locale}/dashboard` : `/${locale}/admin`);
  }

  const dict = getDictionary(locale);

  return (
    <AuthCard
      locale={locale}
      title={dict.nav.login}
      subtitle={SUBTITLE[locale]}
      footer={
        <>
          {NO_ACCOUNT[locale]}{' '}
          <Link href={`/${locale}/register`} className="font-medium text-brand-700 hover:underline">
            {dict.nav.register}
          </Link>
        </>
      }
    >
      <LoginForm locale={locale} />
    </AuthCard>
  );
}
