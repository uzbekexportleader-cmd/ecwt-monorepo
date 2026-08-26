import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { MARKETPLACE_LABELS, type Listing, type Paginated } from '@ecwt/contracts';
import { isLocale } from '@/i18n';
import { serverFetch } from '@/lib/server-api';
import { formatUsd } from '@/lib/utils';
import { LISTING_STATUS_LABELS, LISTING_STATUS_TONES, UI_TEXT } from '@/lib/labels';
import { EmptyState, PageHeader } from '@/components/dashboard/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Table, Td, Th, Tr } from '@/components/ui/Table';

const TEXT = {
  uz: {
    description: 'Mahsulotlaringizning marketplace’lardagi e’lonlari',
    product: 'Mahsulot',
    marketplace: 'Platforma',
    price: 'Narx (USD)',
    commission: 'ECWT ulushi',
    status: 'Holat',
    link: 'E’lon',
    note: 'E’lonlarni ECWT yaratadi va narxni belgilaydi — narx marketplace komissiyasi, logistika va bojni hisobga oladi.',
  },
  ru: {
    description: 'Листинги ваших товаров на маркетплейсах',
    product: 'Товар',
    marketplace: 'Площадка',
    price: 'Цена (USD)',
    commission: 'Доля ECWT',
    status: 'Статус',
    link: 'Листинг',
    note: 'Листинги создаёт ECWT и устанавливает цену — она учитывает комиссию маркетплейса, логистику и пошлины.',
  },
  en: {
    description: 'Your products’ marketplace listings',
    product: 'Product',
    marketplace: 'Marketplace',
    price: 'Price (USD)',
    commission: 'ECWT share',
    status: 'Status',
    link: 'Listing',
    note: 'ECWT creates listings and sets pricing — the price accounts for marketplace fees, logistics and duties.',
  },
} as const;

export default async function ListingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = UI_TEXT[locale];
  const text = TEXT[locale];

  const page = await serverFetch<Paginated<Listing>>('/listings?limit=50');
  const listings = page?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t.listings} description={text.description} />

      {listings.length === 0 ? (
        <EmptyState message={t.empty} />
      ) : (
        <>
          <Table
            head={
              <>
                <Th>{text.product}</Th>
                <Th>{text.marketplace}</Th>
                <Th align="right">{text.price}</Th>
                <Th align="right">{text.commission}</Th>
                <Th>{text.status}</Th>
                <Th>{text.link}</Th>
              </>
            }
          >
            {listings.map((listing) => (
              <Tr key={listing.id}>
                <Td className="text-brand-900">
                  {listing.product
                    ? locale === 'en'
                      ? listing.product.nameEn
                      : listing.product.nameUz
                    : '—'}
                </Td>
                <Td className="whitespace-nowrap text-brand-700">
                  {MARKETPLACE_LABELS[listing.marketplace]}
                </Td>
                <Td align="right" className="whitespace-nowrap font-semibold text-brand-900">
                  {formatUsd(listing.priceUsd)}
                </Td>
                <Td align="right" className="whitespace-nowrap text-brand-600">
                  {listing.commissionPercent}%
                </Td>
                <Td>
                  <Badge tone={LISTING_STATUS_TONES[listing.status]}>
                    {LISTING_STATUS_LABELS[listing.status][locale]}
                  </Badge>
                </Td>
                <Td>
                  {listing.externalUrl ? (
                    <a
                      href={listing.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      {text.link}
                    </a>
                  ) : (
                    <span className="text-xs text-brand-300">—</span>
                  )}
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
