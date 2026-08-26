import { notFound } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import type { Supplier } from '@ecwt/contracts';
import { isLocale } from '@/i18n';
import { serverFetch } from '@/lib/server-api';
import { SUPPLIER_STATUS_LABELS, SUPPLIER_STATUS_TONES, UI_TEXT } from '@/lib/labels';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ProfileForm } from '@/components/dashboard/ProfileForm';
import { Badge } from '@/components/ui/Badge';

const DESCRIPTION = {
  uz: 'Bu ma’lumotlar shartnoma va to‘lovlar uchun ishlatiladi',
  ru: 'Эти данные используются для договора и выплат',
  en: 'These details are used for contracts and payouts',
} as const;

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = UI_TEXT[locale];
  const supplier = await serverFetch<Supplier>('/suppliers/me');

  if (!supplier) {
    return (
      <div className="rounded-card border border-amber-200 bg-amber-50 px-6 py-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-600" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-amber-900">{t.loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.profile}
        description={DESCRIPTION[locale]}
        action={
          <Badge tone={SUPPLIER_STATUS_TONES[supplier.status]}>
            {SUPPLIER_STATUS_LABELS[supplier.status][locale]}
          </Badge>
        }
      />

      {supplier.status === 'REJECTED' && supplier.rejectionReason && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {supplier.rejectionReason}
        </p>
      )}

      <ProfileForm locale={locale} supplier={supplier} />
    </div>
  );
}
