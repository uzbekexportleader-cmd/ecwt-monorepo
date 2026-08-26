import { notFound, redirect } from 'next/navigation';
import type { Category, Supplier } from '@ecwt/contracts';
import { isLocale } from '@/i18n';
import { serverFetch } from '@/lib/server-api';
import { apiUrl } from '@/lib/session';
import { UI_TEXT } from '@/lib/labels';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ProductForm } from '@/components/dashboard/ProductForm';

const DESCRIPTION = {
  uz: 'Ma’lumotlar to‘liq bo‘lsa, e’lon tezroq tayyor bo‘ladi',
  ru: 'Чем полнее данные, тем быстрее будет готов листинг',
  en: 'The more complete the details, the faster the listing is ready',
} as const;

/** Kategoriyalar ochiq endpoint — token kerak emas */
async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(apiUrl('/categories'), { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    return (await response.json()) as Category[];
  } catch {
    return [];
  }
}

export default async function NewProductPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = UI_TEXT[locale];

  const supplier = await serverFetch<Supplier>('/suppliers/me');

  // Tasdiqlanmagan hamkor mahsulot qo'sha olmaydi — backend ham buni
  // rad etadi, bu yerda shunchaki foydali yo'naltirish
  if (supplier && supplier.status !== 'VERIFIED') {
    redirect(`/${locale}/dashboard/profile`);
  }

  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <PageHeader title={t.addProduct} description={DESCRIPTION[locale]} />
      <ProductForm locale={locale} categories={categories} />
    </div>
  );
}
