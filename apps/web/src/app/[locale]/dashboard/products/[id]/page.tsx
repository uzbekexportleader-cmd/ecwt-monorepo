import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { Listing, Paginated, Product } from '@ecwt/contracts';
import { MARKETPLACE_LABELS } from '@ecwt/contracts';
import { isLocale } from '@/i18n';
import { serverFetch } from '@/lib/server-api';
import { formatUsd, formatUzs } from '@/lib/utils';
import {
  LISTING_STATUS_LABELS,
  LISTING_STATUS_TONES,
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUS_TONES,
  UI_TEXT,
} from '@/lib/labels';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { SubmitProductButton } from '@/components/dashboard/SubmitProductButton';

const TEXT = {
  uz: {
    back: 'Mahsulotlarga qaytish',
    details: 'Mahsulot ma’lumotlari',
    listings: 'Marketplace e’lonlari',
    noListings:
      'Hali e’lon qilinmagan. Mahsulot tasdiqlangach, ECWT uni marketplace’ga chiqaradi.',
    sku: 'SKU',
    price: 'Narx',
    stock: 'Qoldiq',
    moq: 'Minimal partiya',
    weight: 'Og‘irlik',
    hsCode: 'HS kod',
    brand: 'Brend',
    nameEn: 'Inglizcha nom',
    descEn: 'Inglizcha tavsif',
    rejected: 'Rad etish sababi',
  },
  ru: {
    back: 'Назад к товарам',
    details: 'Данные товара',
    listings: 'Листинги на маркетплейсах',
    noListings: 'Пока не размещён. После одобрения ECWT выведет товар на маркетплейс.',
    sku: 'Артикул',
    price: 'Цена',
    stock: 'Остаток',
    moq: 'Мин. партия',
    weight: 'Вес',
    hsCode: 'Код ТН ВЭД',
    brand: 'Бренд',
    nameEn: 'Название на английском',
    descEn: 'Описание на английском',
    rejected: 'Причина отклонения',
  },
  en: {
    back: 'Back to products',
    details: 'Product details',
    listings: 'Marketplace listings',
    noListings: 'Not listed yet. Once approved, ECWT will publish it to a marketplace.',
    sku: 'SKU',
    price: 'Price',
    stock: 'Stock',
    moq: 'Min. order',
    weight: 'Weight',
    hsCode: 'HS code',
    brand: 'Brand',
    nameEn: 'English name',
    descEn: 'English description',
    rejected: 'Rejection reason',
  },
} as const;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const t = UI_TEXT[locale];
  const text = TEXT[locale];

  const product = await serverFetch<Product>(`/products/${id}`);
  if (!product) notFound();

  const listingsPage = await serverFetch<Paginated<Listing>>(`/listings?productId=${id}`);
  const listings = listingsPage?.items ?? [];

  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
  const canSubmit = product.status === 'DRAFT' || product.status === 'REJECTED';

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/dashboard/products`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {text.back}
      </Link>

      <PageHeader
        title={locale === 'en' ? product.nameEn : product.nameUz}
        description={`${text.sku}: ${product.sku}`}
        action={
          <div className="flex items-center gap-3">
            <Badge tone={PRODUCT_STATUS_TONES[product.status]}>
              {PRODUCT_STATUS_LABELS[product.status][locale]}
            </Badge>
            {canSubmit && <SubmitProductButton locale={locale} productId={product.id} />}
          </div>
        }
      />

      {product.status === 'REJECTED' && product.rejectionReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
            {text.rejected}
          </p>
          <p className="mt-1 text-sm text-red-800">{product.rejectionReason}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title={text.details} />
            <CardBody>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label={text.price} value={formatUzs(product.basePriceUzs)} />
                <Detail
                  label="USD"
                  value={product.suggestedPriceUsd ? formatUsd(product.suggestedPriceUsd) : '—'}
                />
                <Detail label={text.stock} value={String(product.stock)} />
                <Detail label={text.moq} value={String(product.moq)} />
                <Detail
                  label={text.weight}
                  value={product.weightGrams ? `${product.weightGrams} g` : '—'}
                />
                <Detail label={text.hsCode} value={product.hsCode ?? '—'} />
                <Detail label={text.brand} value={product.brand ?? '—'} />
                <Detail label={text.nameEn} value={product.nameEn} />
              </dl>

              {product.descriptionEn && (
                <div className="mt-6 border-t border-brand-100 pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-400">
                    {text.descEn}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-brand-700">
                    {product.descriptionEn}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={text.listings} />
            <CardBody>
              {listings.length === 0 ? (
                <p className="text-sm text-brand-500">{text.noListings}</p>
              ) : (
                <ul className="divide-y divide-brand-100">
                  {listings.map((listing) => (
                    <li
                      key={listing.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-brand-900">
                          {MARKETPLACE_LABELS[listing.marketplace]}
                        </p>
                        <p className="text-xs text-brand-500">
                          {formatUsd(listing.priceUsd)} · {listing.commissionPercent}%
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge tone={LISTING_STATUS_TONES[listing.status]}>
                          {LISTING_STATUS_LABELS[listing.status][locale]}
                        </Badge>
                        {listing.externalUrl && (
                          <a
                            href={listing.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-brand-600 hover:underline"
                          >
                            →
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <Card className="h-fit">
          <CardBody>
            {primaryImage ? (
              <div className="relative aspect-square overflow-hidden rounded-lg bg-brand-50">
                <Image
                  src={primaryImage.url}
                  alt={product.nameEn}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-lg bg-brand-50 text-sm text-brand-400">
                {t.empty}
              </div>
            )}

            {product.images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((image) => (
                  <div
                    key={image.id}
                    className="relative aspect-square overflow-hidden rounded-md bg-brand-50"
                  >
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-brand-400">{label}</dt>
      <dd className="mt-1 text-sm text-brand-900">{value}</dd>
    </div>
  );
}
