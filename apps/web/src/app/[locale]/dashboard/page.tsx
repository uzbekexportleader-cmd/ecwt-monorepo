import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Package, ShoppingBag, Store, Wallet } from 'lucide-react';
import type { Supplier, SupplierStats } from '@ecwt/contracts';
import { isLocale } from '@/i18n';
import { serverFetch } from '@/lib/server-api';
import { formatUsd } from '@/lib/utils';
import { SUPPLIER_STATUS_LABELS, UI_TEXT } from '@/lib/labels';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { ButtonLink } from '@/components/ui/Button';

const WELCOME = {
  uz: 'Xush kelibsiz',
  ru: 'Добро пожаловать',
  en: 'Welcome',
} as const;

/** Profil holatiga qarab keyingi qadam */
const NEXT_STEP = {
  uz: {
    DRAFT: {
      title: 'Profilni to‘ldiring',
      body: 'Mahsulot qo‘shish uchun avval kompaniya ma’lumotlarini to‘ldirib, tekshiruvga yuboring.',
      cta: 'Profilga o‘tish',
    },
    PENDING_REVIEW: {
      title: 'Profil tekshiruvda',
      body: 'Ma’lumotlaringiz ko‘rib chiqilmoqda. Odatda 1–3 ish kuni ichida javob beramiz.',
      cta: null,
    },
    REJECTED: {
      title: 'Profil rad etildi',
      body: 'Sababni ko‘rib, ma’lumotlarni to‘g‘rilang va qayta yuboring.',
      cta: 'Profilga o‘tish',
    },
    SUSPENDED: {
      title: 'Akkaunt to‘xtatilgan',
      body: 'Qo‘llab-quvvatlash xizmatiga murojaat qiling.',
      cta: null,
    },
    VERIFIED: {
      title: 'Mahsulot qo‘shing',
      body: 'Profilingiz tasdiqlangan. Endi mahsulot qo‘shib, marketplace’ga chiqarishni boshlashingiz mumkin.',
      cta: 'Mahsulot qo‘shish',
    },
  },
  ru: {
    DRAFT: {
      title: 'Заполните профиль',
      body: 'Чтобы добавлять товары, сначала заполните данные компании и отправьте на проверку.',
      cta: 'Перейти в профиль',
    },
    PENDING_REVIEW: {
      title: 'Профиль на проверке',
      body: 'Ваши данные рассматриваются. Обычно отвечаем в течение 1–3 рабочих дней.',
      cta: null,
    },
    REJECTED: {
      title: 'Профиль отклонён',
      body: 'Посмотрите причину, исправьте данные и отправьте повторно.',
      cta: 'Перейти в профиль',
    },
    SUSPENDED: {
      title: 'Аккаунт приостановлен',
      body: 'Обратитесь в службу поддержки.',
      cta: null,
    },
    VERIFIED: {
      title: 'Добавьте товар',
      body: 'Профиль подтверждён. Теперь можно добавлять товары и выводить их на маркетплейсы.',
      cta: 'Добавить товар',
    },
  },
  en: {
    DRAFT: {
      title: 'Complete your profile',
      body: 'To add products, first fill in your company details and submit them for review.',
      cta: 'Go to profile',
    },
    PENDING_REVIEW: {
      title: 'Profile under review',
      body: 'Your details are being reviewed. We usually respond within 1–3 business days.',
      cta: null,
    },
    REJECTED: {
      title: 'Profile rejected',
      body: 'Check the reason, correct your details and resubmit.',
      cta: 'Go to profile',
    },
    SUSPENDED: {
      title: 'Account suspended',
      body: 'Please contact support.',
      cta: null,
    },
    VERIFIED: {
      title: 'Add a product',
      body: 'Your profile is verified. You can now add products and start listing them on marketplaces.',
      cta: 'Add product',
    },
  },
} as const;

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = UI_TEXT[locale];

  const [supplier, stats] = await Promise.all([
    serverFetch<Supplier>('/suppliers/me'),
    serverFetch<SupplierStats>('/suppliers/me/stats'),
  ]);

  if (!supplier) {
    return (
      <div className="rounded-card border border-amber-200 bg-amber-50 px-6 py-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-600" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-amber-900">{t.loadError}</p>
      </div>
    );
  }

  const step = NEXT_STEP[locale][supplier.status];
  const stepHref =
    supplier.status === 'VERIFIED'
      ? `/${locale}/dashboard/products/new`
      : `/${locale}/dashboard/profile`;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${WELCOME[locale]}, ${supplier.companyName}`}
        description={`${SUPPLIER_STATUS_LABELS[supplier.status][locale]}`}
      />

      {/* Keyingi qadam — foydalanuvchi nima qilishi kerakligini aniq aytamiz */}
      <div
        className={
          supplier.status === 'VERIFIED'
            ? 'rounded-card border border-emerald-200 bg-emerald-50 p-6'
            : 'rounded-card border border-amber-200 bg-amber-50 p-6'
        }
      >
        <div className="flex items-start gap-4">
          {supplier.status === 'VERIFIED' ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          )}

          <div className="min-w-0 flex-1">
            <h2
              className={
                supplier.status === 'VERIFIED'
                  ? 'text-base font-semibold text-emerald-900'
                  : 'text-base font-semibold text-amber-900'
              }
            >
              {step.title}
            </h2>
            <p
              className={
                supplier.status === 'VERIFIED'
                  ? 'mt-1 text-sm leading-relaxed text-emerald-800'
                  : 'mt-1 text-sm leading-relaxed text-amber-800'
              }
            >
              {step.body}
            </p>

            {supplier.status === 'REJECTED' && supplier.rejectionReason && (
              <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-sm text-amber-900">
                {supplier.rejectionReason}
              </p>
            )}

            {step.cta && (
              <ButtonLink href={stepHref} size="sm" className="mt-4">
                {step.cta}
              </ButtonLink>
            )}
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t.balance}
            value={formatUsd(supplier.balanceUsd)}
            icon={Wallet}
            accent
            hint={`${t.pendingPayout}: ${formatUsd(stats.pendingPayoutUsd)}`}
          />
          <StatCard label={t.revenue} value={formatUsd(stats.revenueUsd)} icon={ShoppingBag} />
          <StatCard
            label={t.liveListings}
            value={String(stats.listingsLive)}
            icon={Store}
            hint={`${t.approvedProducts}: ${stats.productsApproved}`}
          />
          <StatCard label={t.totalOrders} value={String(stats.ordersTotal)} icon={Package} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <QuickLink
          href={`/${locale}/dashboard/products`}
          title={t.products}
          count={stats?.productsTotal ?? 0}
        />
        <QuickLink
          href={`/${locale}/dashboard/orders`}
          title={t.orders}
          count={stats?.ordersTotal ?? 0}
        />
      </div>
    </div>
  );
}

function QuickLink({ href, title, count }: { href: string; title: string; count: number }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-card border border-brand-100 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <span className="text-sm font-medium text-brand-900">{title}</span>
      <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
        {count}
      </span>
    </Link>
  );
}
