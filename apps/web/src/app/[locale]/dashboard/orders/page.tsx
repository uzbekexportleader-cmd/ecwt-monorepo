import { notFound } from 'next/navigation';
import { MARKETPLACE_LABELS, type MarketplaceOrder, type Paginated } from '@ecwt/contracts';
import { isLocale } from '@/i18n';
import { serverFetch } from '@/lib/server-api';
import { formatDate, formatUsd } from '@/lib/utils';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES, UI_TEXT } from '@/lib/labels';
import { EmptyState, PageHeader } from '@/components/dashboard/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Table, Td, Th, Tr } from '@/components/ui/Table';

const TEXT = {
  uz: {
    description: 'AQSH marketplace’laridagi sotuvlaringiz',
    date: 'Sana',
    order: 'Buyurtma',
    marketplace: 'Platforma',
    product: 'Mahsulot',
    qty: 'Soni',
    gross: 'Umumiy',
    net: 'Sizga',
    status: 'Holat',
    netHint: 'Komissiya va yetkazib berish chegirilgandan keyin sizga tegishli summa',
  },
  ru: {
    description: 'Ваши продажи на маркетплейсах США',
    date: 'Дата',
    order: 'Заказ',
    marketplace: 'Площадка',
    product: 'Товар',
    qty: 'Кол-во',
    gross: 'Всего',
    net: 'Вам',
    status: 'Статус',
    netHint: 'Сумма к получению после вычета комиссий и доставки',
  },
  en: {
    description: 'Your sales on US marketplaces',
    date: 'Date',
    order: 'Order',
    marketplace: 'Marketplace',
    product: 'Product',
    qty: 'Qty',
    gross: 'Gross',
    net: 'Your share',
    status: 'Status',
    netHint: 'Amount due to you after fees and shipping are deducted',
  },
} as const;

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = UI_TEXT[locale];
  const text = TEXT[locale];

  const page = await serverFetch<Paginated<MarketplaceOrder>>('/orders?limit=50');
  const orders = page?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t.orders} description={text.description} />

      {orders.length === 0 ? (
        <EmptyState message={t.empty} />
      ) : (
        <>
          <Table
            head={
              <>
                <Th>{text.date}</Th>
                <Th>{text.order}</Th>
                <Th>{text.marketplace}</Th>
                <Th>{text.product}</Th>
                <Th align="right">{text.qty}</Th>
                <Th align="right">{text.gross}</Th>
                <Th align="right">{text.net}</Th>
                <Th>{text.status}</Th>
              </>
            }
          >
            {orders.map((order) => (
              <Tr key={order.id}>
                <Td className="whitespace-nowrap text-brand-600">
                  {formatDate(order.placedAt, locale === 'en' ? 'en-US' : 'uz-UZ')}
                </Td>
                <Td className="whitespace-nowrap font-mono text-xs text-brand-500">
                  {order.externalOrderId}
                </Td>
                <Td className="whitespace-nowrap text-brand-700">
                  {MARKETPLACE_LABELS[order.marketplace]}
                </Td>
                <Td className="text-brand-900">
                  {order.product ? (locale === 'en' ? order.product.nameEn : order.product.nameUz) : '—'}
                </Td>
                <Td align="right" className="text-brand-700">
                  {order.quantity}
                </Td>
                <Td align="right" className="whitespace-nowrap text-brand-700">
                  {formatUsd(order.grossUsd)}
                </Td>
                <Td align="right" className="whitespace-nowrap font-semibold text-brand-900">
                  {formatUsd(order.netToSupplierUsd)}
                </Td>
                <Td>
                  <Badge tone={ORDER_STATUS_TONES[order.status]}>
                    {ORDER_STATUS_LABELS[order.status][locale]}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Table>

          <p className="text-xs text-brand-400">{text.netHint}</p>
        </>
      )}
    </div>
  );
}
