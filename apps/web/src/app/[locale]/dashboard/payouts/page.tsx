import { notFound } from 'next/navigation';
import { Wallet } from 'lucide-react';
import type { Paginated, Payout, Supplier, SupplierStats } from '@ecwt/contracts';
import { isLocale } from '@/i18n';
import { serverFetch } from '@/lib/server-api';
import { formatDate, formatUsd, formatUzs } from '@/lib/utils';
import { PAYOUT_STATUS_LABELS, PAYOUT_STATUS_TONES, UI_TEXT } from '@/lib/labels';
import { EmptyState, PageHeader } from '@/components/dashboard/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Table, Td, Th, Tr } from '@/components/ui/Table';

const TEXT = {
  uz: {
    description: 'ECWT tomonidan hisobingizga o‘tkazilgan mablag‘',
    date: 'Sana',
    reference: 'Hujjat raqami',
    orders: 'Buyurtmalar',
    amountUsd: 'Summa (USD)',
    amountUzs: 'Summa (so‘m)',
    status: 'Holat',
    note: 'To‘lovlar yetkazib berilgan buyurtmalar bo‘yicha shakllantiriladi.',
  },
  ru: {
    description: 'Средства, перечисленные ECWT на ваш счёт',
    date: 'Дата',
    reference: 'Номер документа',
    orders: 'Заказов',
    amountUsd: 'Сумма (USD)',
    amountUzs: 'Сумма (сум)',
    status: 'Статус',
    note: 'Выплаты формируются по доставленным заказам.',
  },
  en: {
    description: 'Funds transferred to your account by ECWT',
    date: 'Date',
    reference: 'Reference',
    orders: 'Orders',
    amountUsd: 'Amount (USD)',
    amountUzs: 'Amount (UZS)',
    status: 'Status',
    note: 'Payouts are generated from delivered orders.',
  },
} as const;

export default async function PayoutsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = UI_TEXT[locale];
  const text = TEXT[locale];

  const [page, supplier, stats] = await Promise.all([
    serverFetch<Paginated<Payout>>('/payouts?limit=50'),
    serverFetch<Supplier>('/suppliers/me'),
    serverFetch<SupplierStats>('/suppliers/me/stats'),
  ]);

  const payouts = page?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t.payouts} description={text.description} />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={t.balance}
          value={formatUsd(supplier?.balanceUsd ?? 0)}
          icon={Wallet}
          accent
        />
        <StatCard
          label={t.pendingPayout}
          value={formatUsd(stats?.pendingPayoutUsd ?? 0)}
          icon={Wallet}
        />
      </div>

      {payouts.length === 0 ? (
        <EmptyState message={t.empty} />
      ) : (
        <>
          <Table
            head={
              <>
                <Th>{text.date}</Th>
                <Th>{text.reference}</Th>
                <Th align="right">{text.orders}</Th>
                <Th align="right">{text.amountUsd}</Th>
                <Th align="right">{text.amountUzs}</Th>
                <Th>{text.status}</Th>
              </>
            }
          >
            {payouts.map((payout) => (
              <Tr key={payout.id}>
                <Td className="whitespace-nowrap text-brand-600">
                  {formatDate(payout.paidAt ?? payout.createdAt, locale === 'en' ? 'en-US' : 'uz-UZ')}
                </Td>
                <Td className="whitespace-nowrap font-mono text-xs text-brand-500">
                  {payout.reference ?? '—'}
                </Td>
                <Td align="right" className="text-brand-700">
                  {payout.ordersCount}
                </Td>
                <Td align="right" className="whitespace-nowrap font-semibold text-brand-900">
                  {formatUsd(payout.amountUsd)}
                </Td>
                <Td align="right" className="whitespace-nowrap text-brand-600">
                  {payout.amountUzs ? formatUzs(payout.amountUzs) : '—'}
                </Td>
                <Td>
                  <Badge tone={PAYOUT_STATUS_TONES[payout.status]}>
                    {PAYOUT_STATUS_LABELS[payout.status][locale]}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Table>

          <p className="text-xs text-brand-400">{text.note}</p>
        </>
      )}
    </div>
  );
}
