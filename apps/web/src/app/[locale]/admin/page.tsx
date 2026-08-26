import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MessageSquare, Package, Users } from 'lucide-react';
import type { Lead, Paginated, Product, Supplier } from '@ecwt/contracts';
import { isLocale } from '@/i18n';
import { serverFetch } from '@/lib/server-api';
import { UI_TEXT } from '@/lib/labels';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';

const TEXT = {
  uz: {
    title: 'Boshqaruv paneli',
    description: 'Tekshiruvni kutayotgan ishlar',
    pendingSuppliers: 'Tekshiruvdagi hamkorlar',
    pendingProducts: 'Tekshiruvdagi mahsulotlar',
    newLeads: 'Yangi arizalar',
    open: 'Ochish',
  },
  ru: {
    title: 'Панель управления',
    description: 'Задачи, ожидающие проверки',
    pendingSuppliers: 'Партнёры на проверке',
    pendingProducts: 'Товары на проверке',
    newLeads: 'Новые заявки',
    open: 'Открыть',
  },
  en: {
    title: 'Admin overview',
    description: 'Items awaiting review',
    pendingSuppliers: 'Suppliers under review',
    pendingProducts: 'Products under review',
    newLeads: 'New enquiries',
    open: 'Open',
  },
} as const;

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = UI_TEXT[locale];
  const text = TEXT[locale];

  const [suppliers, products, leads] = await Promise.all([
    serverFetch<Paginated<Supplier>>('/suppliers?status=PENDING_REVIEW&limit=1'),
    serverFetch<Paginated<Product>>('/products?status=PENDING_REVIEW&limit=1'),
    serverFetch<Paginated<Lead>>('/leads?status=NEW&limit=1'),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={text.title} description={text.description} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href={`/${locale}/admin/suppliers`}>
          <StatCard
            label={text.pendingSuppliers}
            value={String(suppliers?.meta.total ?? 0)}
            icon={Users}
            accent={(suppliers?.meta.total ?? 0) > 0}
            hint={text.open}
          />
        </Link>

        <Link href={`/${locale}/admin/products`}>
          <StatCard
            label={text.pendingProducts}
            value={String(products?.meta.total ?? 0)}
            icon={Package}
            accent={(products?.meta.total ?? 0) > 0}
            hint={text.open}
          />
        </Link>

        <Link href={`/${locale}/admin/leads`}>
          <StatCard
            label={text.newLeads}
            value={String(leads?.meta.total ?? 0)}
            icon={MessageSquare}
            accent={(leads?.meta.total ?? 0) > 0}
            hint={text.open}
          />
        </Link>
      </div>

      {!suppliers && !products && !leads && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{t.loadError}</p>
      )}
    </div>
  );
}
