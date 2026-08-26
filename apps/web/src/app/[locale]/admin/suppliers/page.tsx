import { notFound } from 'next/navigation';
import { UZ_REGION_LABELS, type Paginated, type Supplier } from '@ecwt/contracts';
import { isLocale } from '@/i18n';
import { serverFetch } from '@/lib/server-api';
import { formatDate, formatUsd } from '@/lib/utils';
import { SUPPLIER_STATUS_LABELS, SUPPLIER_STATUS_TONES, UI_TEXT } from '@/lib/labels';
import { EmptyState, PageHeader } from '@/components/dashboard/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { ReviewActions } from '@/components/admin/ReviewActions';

const TEXT = {
  uz: {
    description: 'Hamkorlarni tasdiqlash va boshqarish',
    pending: 'Tekshiruvni kutmoqda',
    all: 'Barcha hamkorlar',
    stir: 'STIR',
    region: 'Viloyat',
    bank: 'Bank',
    account: 'Hisob raqami',
    balance: 'Balans',
    registered: 'Ro‘yxatdan o‘tgan',
    contact: 'Aloqa',
    noPending: 'Tekshiruvni kutayotgan hamkor yo‘q.',
  },
  ru: {
    description: 'Подтверждение и управление партнёрами',
    pending: 'Ожидают проверки',
    all: 'Все партнёры',
    stir: 'ИНН',
    region: 'Область',
    bank: 'Банк',
    account: 'Расчётный счёт',
    balance: 'Баланс',
    registered: 'Зарегистрирован',
    contact: 'Контакты',
    noPending: 'Нет партнёров, ожидающих проверки.',
  },
  en: {
    description: 'Verify and manage partners',
    pending: 'Awaiting review',
    all: 'All partners',
    stir: 'Tax ID',
    region: 'Region',
    bank: 'Bank',
    account: 'Account',
    balance: 'Balance',
    registered: 'Registered',
    contact: 'Contact',
    noPending: 'No partners awaiting review.',
  },
} as const;

export default async function AdminSuppliersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = UI_TEXT[locale];
  const text = TEXT[locale];

  const [pending, all] = await Promise.all([
    serverFetch<Paginated<Supplier>>('/suppliers?status=PENDING_REVIEW&limit=50'),
    serverFetch<Paginated<Supplier>>('/suppliers?limit=50'),
  ]);

  const pendingItems = pending?.items ?? [];
  const allItems = all?.items ?? [];

  return (
    <div className="space-y-8">
      <PageHeader title={t.suppliers} description={text.description} />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">
          {text.pending} ({pendingItems.length})
        </h2>

        {pendingItems.length === 0 ? (
          <EmptyState message={text.noPending} />
        ) : (
          pendingItems.map((supplier) => (
            <Card key={supplier.id}>
              <CardBody className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-brand-950">
                      {supplier.companyName}
                    </h3>
                    <p className="text-sm text-brand-500">{supplier.legalName}</p>
                  </div>

                  <ReviewActions
                    locale={locale}
                    endpoint={`/suppliers/${supplier.id}/review`}
                    approvedStatus="VERIFIED"
                  />
                </div>

                <dl className="grid gap-4 border-t border-brand-100 pt-4 sm:grid-cols-3">
                  <Detail label={text.stir} value={supplier.stir ?? '—'} />
                  <Detail
                    label={text.region}
                    value={supplier.region ? UZ_REGION_LABELS[supplier.region] : '—'}
                  />
                  <Detail
                    label={text.contact}
                    value={`${supplier.contactPhone ?? '—'} · ${supplier.contactEmail ?? '—'}`}
                  />
                  <Detail label={text.bank} value={supplier.bankName ?? '—'} />
                  <Detail
                    label={text.account}
                    value={`${supplier.bankAccount ?? '—'} / ${supplier.mfo ?? '—'}`}
                  />
                  <Detail
                    label={text.registered}
                    value={formatDate(supplier.createdAt, locale === 'en' ? 'en-US' : 'uz-UZ')}
                  />
                </dl>
              </CardBody>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">
          {text.all} ({allItems.length})
        </h2>

        {allItems.length === 0 ? (
          <EmptyState message={t.empty} />
        ) : (
          <div className="overflow-hidden rounded-card border border-brand-100 bg-white shadow-sm">
            <ul className="divide-y divide-brand-100">
              {allItems.map((supplier) => (
                <li
                  key={supplier.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-brand-900">
                      {supplier.companyName}
                    </p>
                    <p className="text-xs text-brand-500">
                      {supplier.stir ?? '—'} ·{' '}
                      {supplier.region ? UZ_REGION_LABELS[supplier.region] : '—'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-brand-700">
                      {formatUsd(supplier.balanceUsd)}
                    </span>
                    <Badge tone={SUPPLIER_STATUS_TONES[supplier.status]}>
                      {SUPPLIER_STATUS_LABELS[supplier.status][locale]}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-brand-400">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-brand-900">{value}</dd>
    </div>
  );
}
