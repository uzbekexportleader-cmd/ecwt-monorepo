import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getDictionary, isLocale } from '@/i18n';
import { getCurrentUser } from '@/lib/session';
import { AuthCard } from '@/components/auth/AuthCard';
import { RegisterForm } from '@/components/auth/RegisterForm';

const SUBTITLE = {
  uz: 'Mahsulotingizni AQSH bozoriga chiqarishni boshlang',
  ru: 'Начните выводить товар на рынок США',
  en: 'Start bringing your product to the US market',
} as const;

const HAVE_ACCOUNT = {
  uz: 'Akkauntingiz bormi?',
  ru: 'Уже есть аккаунт?',
  en: 'Already have an account?',
} as const;

export const metadata: Metadata = {
  title: 'Ro‘yxatdan o‘tish — ECWT',
  robots: { index: false, follow: false },
};

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === 'SUPPLIER' ? `/${locale}/dashboard` : `/${locale}/admin`);
  }

  const dict = getDictionary(locale);

  return (
    <AuthCard
      locale={locale}
      title={dict.nav.register}
      subtitle={SUBTITLE[locale]}
      footer={
        <>
          {HAVE_ACCOUNT[locale]}{' '}
          <Link href={`/${locale}/login`} className="font-medium text-brand-700 hover:underline">
            {dict.nav.login}
          </Link>
        </>
      }
    >
      <RegisterForm locale={locale} />
    </AuthCard>
  );
}
