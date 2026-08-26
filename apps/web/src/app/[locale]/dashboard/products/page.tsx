import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Plus } from 'lucide-react';
import type { Paginated, Product, Supplier } from '@ecwt/contracts';
import { isLocale } from '@/i18n';
import { serverFetch } from '@/lib/server-api';
import { formatUzs } from '@/lib/utils';
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUS_TONES, UI_TEXT } from '@/lib/labels';
import { EmptyState, PageHeader } from '@/components/dashboard/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';

const TEXT = {
  uz: {
    description: 'Marketplace’ga chiqarish uchun mahsulotlaringiz',
    sku: 'SKU',
    name: 'Nomi',
    price: 'Narx',
    stock: 'Qoldiq',
    status: 'Holat',
    verifyFirst: 'Mahsulot qo‘shish uchun avval kompaniya profilini tasdiqdan o‘tkazing.',
    goToProfile: 'Profilga o‘tish',
  },
  ru: {
    description: 'Ваши товары для вывода на маркетплейсы',
    sku: 'Артикул',
    name: 'Название',
    price: 'Цена',
    stock: 'Остаток',
    status: 'Статус',
    verifyFirst: 'Чтобы добавлять товары, сначала подтвердите профиль компании.',
    goToProfile: 'Перейти в профиль',
  },
  en: {
    description: 'Your products for marketplace listing',
    sku: 'SKU',
    name: 'Name',
    price: 'Price',
    stock: 'Stock',
    status: 'Status',
    verifyFirst: 'To add products, get your company profile verified first.',
    goToProfile: 'Go to profile',
  },
} as const;

export default async function ProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = UI_TEXT[locale];
  const text = TEXT[locale];

  const [supplier, page] = await Promise.all([
    serverFetch<Supplier>('/suppliers/me'),
    serverFetch<Paginated<Product>>('/products?limit=50'),
  ]);

  const verified = supplier?.status === 'VERIFIED';
  const products = page?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.products}
        description={text.description}
        action={
          verified ? (
            <ButtonLink href={`/${locale}/dashboard/products/new`} size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t.addProduct}
            </ButtonLink>
          ) : undefined
        }
      />

      {!verified && (
        <div className="rounded-card border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-900">{text.verifyFirst}</p>
          <ButtonLink href={`/${locale}/dashboard/profile`} size="sm" className="mt-4">
            {text.goToProfile}
          </ButtonLink>
        </div>
      )}

      {products.length === 0 ? (
        <EmptyState message={t.empty} />
      ) : (
        <div className="overflow-hidden rounded-card border border-brand-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-brand-100 bg-brand-50/60">
                <tr>
                  <Th>{text.sku}</Th>
                  <Th>{text.name}</Th>
                  <Th align="right">{text.price}</Th>
                  <Th align="right">{text.stock}</Th>
                  <Th>{text.status}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {products.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-brand-50/40">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-brand-500">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/${locale}/dashboard/products/${product.id}`}
                        className="font-medium text-brand-900 hover:text-brand-700 hover:underline"
                      >
                        {locale === 'en' ? product.nameEn : product.nameUz}
                      </Link>
                      {product.status === 'REJECTED' && product.rejectionReason && (
                        <p className="mt-0.5 text-xs text-red-600">{product.rejectionReason}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-brand-700">
                      {formatUzs(product.basePriceUzs)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-brand-700">
                      {product.stock}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge tone={PRODUCT_STATUS_TONES[product.status]}>
                        {PRODUCT_STATUS_LABELS[product.status][locale]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brand-500 ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}
