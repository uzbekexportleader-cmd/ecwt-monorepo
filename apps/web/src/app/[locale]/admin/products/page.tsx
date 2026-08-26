import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Paginated, Product } from '@ecwt/contracts';
import { isLocale } from '@/i18n';
import { serverFetch } from '@/lib/server-api';
import { formatUsd, formatUzs } from '@/lib/utils';
import { UI_TEXT } from '@/lib/labels';
import { EmptyState, PageHeader } from '@/components/dashboard/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { ReviewActions } from '@/components/admin/ReviewActions';

const TEXT = {
  uz: {
    description: 'Tekshiruvni kutayotgan mahsulotlar',
    noPending: 'Tekshiruvni kutayotgan mahsulot yo‘q.',
    sku: 'SKU',
    priceUzs: 'Narx (so‘m)',
    priceUsd: 'Taklif (USD)',
    moq: 'Min. partiya',
    stock: 'Qoldiq',
    hsCode: 'HS kod',
    weight: 'Og‘irlik',
    nameEn: 'Inglizcha nom',
    descEn: 'Inglizcha tavsif',
    noDescEn: 'Inglizcha tavsif kiritilmagan — marketplace uchun bu muhim.',
  },
  ru: {
    description: 'Товары, ожидающие проверки',
    noPending: 'Нет товаров, ожидающих проверки.',
    sku: 'Артикул',
    priceUzs: 'Цена (сум)',
    priceUsd: 'Предложено (USD)',
    moq: 'Мин. партия',
    stock: 'Остаток',
    hsCode: 'Код ТН ВЭД',
    weight: 'Вес',
    nameEn: 'Название (англ.)',
    descEn: 'Описание (англ.)',
    noDescEn: 'Английское описание не заполнено — это важно для маркетплейса.',
  },
  en: {
    description: 'Products awaiting review',
    noPending: 'No products awaiting review.',
    sku: 'SKU',
    priceUzs: 'Price (UZS)',
    priceUsd: 'Suggested (USD)',
    moq: 'Min. order',
    stock: 'Stock',
    hsCode: 'HS code',
    weight: 'Weight',
    nameEn: 'English name',
    descEn: 'English description',
    noDescEn: 'No English description — this matters for the marketplace.',
  },
} as const;

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = UI_TEXT[locale];
  const text = TEXT[locale];

  const page = await serverFetch<Paginated<Product>>('/products?status=PENDING_REVIEW&limit=50');
  const products = page?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t.review} description={text.description} />

      {products.length === 0 ? (
        <EmptyState message={text.noPending} />
      ) : (
        products.map((product) => {
          const primary = product.images.find((img) => img.isPrimary) ?? product.images[0];

          return (
            <Card key={product.id}>
              <CardBody className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-4">
                    {primary && (
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                        <Image
                          src={primary.url}
                          alt={product.nameEn}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-brand-950">{product.nameUz}</h3>
                      <p className="text-sm text-brand-600">{product.nameEn}</p>
                      <p className="mt-0.5 font-mono text-xs text-brand-400">
                        {text.sku}: {product.sku}
                      </p>
                    </div>
                  </div>

                  <ReviewActions
                    locale={locale}
                    endpoint={`/products/${product.id}/review`}
                    approvedStatus="APPROVED"
                  />
                </div>

                <dl className="grid gap-4 border-t border-brand-100 pt-4 sm:grid-cols-3 lg:grid-cols-6">
                  <Detail label={text.priceUzs} value={formatUzs(product.basePriceUzs)} />
                  <Detail
                    label={text.priceUsd}
                    value={product.suggestedPriceUsd ? formatUsd(product.suggestedPriceUsd) : '—'}
                  />
                  <Detail label={text.moq} value={String(product.moq)} />
                  <Detail label={text.stock} value={String(product.stock)} />
                  <Detail label={text.hsCode} value={product.hsCode ?? '—'} />
                  <Detail
                    label={text.weight}
                    value={product.weightGrams ? `${product.weightGrams} g` : '—'}
                  />
                </dl>

                <div className="border-t border-brand-100 pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-400">
                    {text.descEn}
                  </p>
                  {product.descriptionEn ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-brand-700">
                      {product.descriptionEn}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-sm font-medium text-amber-700">{text.noDescEn}</p>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })
      )}
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
