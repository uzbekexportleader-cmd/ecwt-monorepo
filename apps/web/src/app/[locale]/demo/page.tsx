import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n';
import { DemoFunnel } from '@/components/demo/DemoFunnel';

export const metadata: Metadata = {
  title: 'ECWT — investor demosi',
  description: 'Hamkor onboarding varonkasining interaktiv demosi.',
  // Demo qidiruv tizimlariga tushmasligi kerak
  robots: { index: false, follow: false },
};

export default async function DemoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <DemoFunnel locale={locale} />;
}
