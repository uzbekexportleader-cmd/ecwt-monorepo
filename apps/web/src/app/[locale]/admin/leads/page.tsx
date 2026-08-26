import { notFound } from 'next/navigation';
import { Mail, Phone } from 'lucide-react';
import type { Lead, Paginated } from '@ecwt/contracts';
import { isLocale } from '@/i18n';
import { serverFetch } from '@/lib/server-api';
import { formatDateTime } from '@/lib/utils';
import { UI_TEXT } from '@/lib/labels';
import { EmptyState, PageHeader } from '@/components/dashboard/PageHeader';
import { Badge, type Tone } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';

const TEXT = {
  uz: {
    description: 'Saytdagi formadan kelgan arizalar',
    category: 'Mahsulot turi',
    from: 'Manba',
  },
  ru: {
    description: 'Заявки с формы на сайте',
    category: 'Тип товара',
    from: 'Источник',
  },
  en: {
    description: 'Enquiries submitted through the website form',
    category: 'Product type',
    from: 'Source',
  },
} as const;

const LEAD_STATUS_LABELS = {
  NEW: { uz: 'Yangi', ru: 'Новая', en: 'New' },
  CONTACTED: { uz: 'Bog‘lanilgan', ru: 'Связались', en: 'Contacted' },
  QUALIFIED: { uz: 'Mos', ru: 'Квалифицирована', en: 'Qualified' },
  WON: { uz: 'Hamkor bo‘ldi', ru: 'Стал партнёром', en: 'Won' },
  LOST: { uz: 'Yopilgan', ru: 'Закрыта', en: 'Lost' },
} as const;

const LEAD_STATUS_TONES: Record<Lead['status'], Tone> = {
  NEW: 'info',
  CONTACTED: 'warning',
  QUALIFIED: 'success',
  WON: 'success',
  LOST: 'neutral',
};

export default async function AdminLeadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = UI_TEXT[locale];
  const text = TEXT[locale];

  const page = await serverFetch<Paginated<Lead>>('/leads?limit=50');
  const leads = page?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t.leads} description={text.description} />

      {leads.length === 0 ? (
        <EmptyState message={t.empty} />
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <Card key={lead.id}>
              <CardBody className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-brand-950">{lead.name}</h3>
                    {lead.companyName && (
                      <p className="text-sm text-brand-500">{lead.companyName}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-brand-400">
                      {formatDateTime(lead.createdAt, locale === 'en' ? 'en-US' : 'uz-UZ')}
                    </span>
                    <Badge tone={LEAD_STATUS_TONES[lead.status]}>
                      {LEAD_STATUS_LABELS[lead.status][locale]}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {lead.phone}
                  </a>

                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                      {lead.email}
                    </a>
                  )}
                </div>

                {lead.productCategory && (
                  <p className="text-sm text-brand-700">
                    <span className="text-xs uppercase tracking-wide text-brand-400">
                      {text.category}:
                    </span>{' '}
                    {lead.productCategory}
                  </p>
                )}

                {lead.message && (
                  <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-700">
                    {lead.message}
                  </p>
                )}

                {lead.source && (
                  <p className="text-xs text-brand-400">
                    {text.from}: {lead.source} · {lead.locale}
                  </p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
