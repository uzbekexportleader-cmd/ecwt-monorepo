'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Save, Send } from 'lucide-react';
import {
  UZ_REGIONS,
  UZ_REGION_LABELS,
  updateSupplierSchema,
  type Locale,
  type Supplier,
} from '@ecwt/contracts';
import { ApiError, apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

const TEXT = {
  uz: {
    companySection: 'Kompaniya ma’lumotlari',
    companyHint: 'Rasmiy hujjatlardagidek yozing',
    contactSection: 'Aloqa',
    bankSection: 'Bank rekvizitlari',
    bankHint: 'Sotuvdan tushgan pul shu hisobga o‘tkaziladi',
    descSection: 'Kompaniya haqida',
    descHint: 'Inglizcha tavsif marketplace’dagi brend sahifasida ishlatiladi',
    companyName: 'Kompaniya nomi',
    legalName: 'Yuridik nom',
    stir: 'STIR (INN)',
    region: 'Viloyat',
    district: 'Tuman',
    address: 'Manzil',
    website: 'Veb-sayt',
    capacity: 'Oylik ishlab chiqarish quvvati (dona)',
    contactPhone: 'Telefon',
    contactEmail: 'Email',
    bankName: 'Bank nomi',
    bankAccount: 'Hisob raqami (20 raqam)',
    mfo: 'MFO (5 raqam)',
    descUz: 'Tavsif (o‘zbekcha)',
    descRu: 'Tavsif (ruscha)',
    descEn: 'Tavsif (inglizcha)',
    save: 'Saqlash',
    saving: 'Saqlanmoqda...',
    submit: 'Tekshiruvga yuborish',
    submitting: 'Yuborilmoqda...',
    saved: 'Saqlandi',
    selectRegion: 'Tanlang',
    lockedInReview: 'Profil tekshiruvda — tahrirlash vaqtincha yopiq.',
  },
  ru: {
    companySection: 'Данные компании',
    companyHint: 'Указывайте как в официальных документах',
    contactSection: 'Контакты',
    bankSection: 'Банковские реквизиты',
    bankHint: 'На этот счёт будет переводиться выручка',
    descSection: 'О компании',
    descHint: 'Английское описание используется на странице бренда маркетплейса',
    companyName: 'Название компании',
    legalName: 'Юридическое название',
    stir: 'ИНН (СТИР)',
    region: 'Область',
    district: 'Район',
    address: 'Адрес',
    website: 'Сайт',
    capacity: 'Месячная производственная мощность (шт.)',
    contactPhone: 'Телефон',
    contactEmail: 'Email',
    bankName: 'Название банка',
    bankAccount: 'Расчётный счёт (20 цифр)',
    mfo: 'МФО (5 цифр)',
    descUz: 'Описание (узбекский)',
    descRu: 'Описание (русский)',
    descEn: 'Описание (английский)',
    save: 'Сохранить',
    saving: 'Сохраняем...',
    submit: 'Отправить на проверку',
    submitting: 'Отправляем...',
    saved: 'Сохранено',
    selectRegion: 'Выберите',
    lockedInReview: 'Профиль на проверке — редактирование временно закрыто.',
  },
  en: {
    companySection: 'Company details',
    companyHint: 'Enter exactly as in your official documents',
    contactSection: 'Contact',
    bankSection: 'Bank details',
    bankHint: 'Sales revenue will be transferred to this account',
    descSection: 'About the company',
    descHint: 'The English description is used on the marketplace brand page',
    companyName: 'Company name',
    legalName: 'Legal name',
    stir: 'Tax ID (STIR)',
    region: 'Region',
    district: 'District',
    address: 'Address',
    website: 'Website',
    capacity: 'Monthly production capacity (units)',
    contactPhone: 'Phone',
    contactEmail: 'Email',
    bankName: 'Bank name',
    bankAccount: 'Account number (20 digits)',
    mfo: 'MFO code (5 digits)',
    descUz: 'Description (Uzbek)',
    descRu: 'Description (Russian)',
    descEn: 'Description (English)',
    save: 'Save',
    saving: 'Saving...',
    submit: 'Submit for review',
    submitting: 'Submitting...',
    saved: 'Saved',
    selectRegion: 'Select',
    lockedInReview: 'Profile is under review — editing is temporarily disabled.',
  },
} as const;

export function ProfileForm({ locale, supplier }: { locale: Locale; supplier: Supplier }) {
  const router = useRouter();
  const t = TEXT[locale];

  const [state, setState] = useState<'idle' | 'saving' | 'submitting' | 'saved'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const locked = supplier.status === 'PENDING_REVIEW' || supplier.status === 'SUSPENDED';
  const canSubmit = supplier.status === 'DRAFT' || supplier.status === 'REJECTED';

  function readForm(form: HTMLFormElement): Record<string, unknown> {
    const data = new FormData(form);
    const capacity = String(data.get('monthlyCapacity') ?? '').trim();

    return {
      companyName: String(data.get('companyName') ?? '').trim(),
      legalName: String(data.get('legalName') ?? '').trim() || undefined,
      stir: String(data.get('stir') ?? '').trim() || undefined,
      region: String(data.get('region') ?? '') || undefined,
      district: String(data.get('district') ?? '').trim() || undefined,
      address: String(data.get('address') ?? '').trim() || undefined,
      website: String(data.get('website') ?? '').trim(),
      contactPhone: String(data.get('contactPhone') ?? '').trim() || undefined,
      contactEmail: String(data.get('contactEmail') ?? '').trim() || undefined,
      bankName: String(data.get('bankName') ?? '').trim() || undefined,
      bankAccount: String(data.get('bankAccount') ?? '').trim() || undefined,
      mfo: String(data.get('mfo') ?? '').trim() || undefined,
      monthlyCapacity: capacity ? Number(capacity) : undefined,
      descriptionUz: String(data.get('descriptionUz') ?? '').trim() || undefined,
      descriptionRu: String(data.get('descriptionRu') ?? '').trim() || undefined,
      descriptionEn: String(data.get('descriptionEn') ?? '').trim() || undefined,
    };
  }

  function applyApiError(error: unknown): void {
    if (error instanceof ApiError) {
      if (error.details) {
        const fieldErrors: Record<string, string> = {};
        for (const [key, messages] of Object.entries(error.details)) {
          if (messages[0]) fieldErrors[key] = messages[0];
        }
        setErrors(fieldErrors);
      }
      setFormError(error.message);
    } else {
      setFormError('Kutilmagan xato yuz berdi');
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const parsed = updateSupplierSchema.safeParse(readForm(event.currentTarget));

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setState('saving');

    try {
      await apiFetch('/suppliers/me', { method: 'PATCH', body: parsed.data });
      setState('saved');
      router.refresh();
      setTimeout(() => setState('idle'), 2500);
    } catch (error) {
      setState('idle');
      applyApiError(error);
    }
  }

  /** Saqlab, so'ng tekshiruvga yuboradi — ikki tugmani bosish shart emas */
  async function handleSubmitForReview(): Promise<void> {
    setErrors({});
    setFormError(null);

    const form = document.getElementById('profile-form') as HTMLFormElement | null;
    if (!form) return;

    const parsed = updateSupplierSchema.safeParse(readForm(form));
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setState('submitting');

    try {
      await apiFetch('/suppliers/me', { method: 'PATCH', body: parsed.data });
      await apiFetch('/suppliers/me/submit', { method: 'POST' });
      router.refresh();
    } catch (error) {
      applyApiError(error);
    } finally {
      setState('idle');
    }
  }

  return (
    <form id="profile-form" onSubmit={handleSave} className="space-y-6" noValidate>
      {locked && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {t.lockedInReview}
        </p>
      )}

      <Card>
        <CardHeader title={t.companySection} description={t.companyHint} />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label={t.companyName} htmlFor="companyName" error={errors.companyName} required>
            <Input
              id="companyName"
              name="companyName"
              defaultValue={supplier.companyName}
              disabled={locked}
              hasError={Boolean(errors.companyName)}
            />
          </Field>

          <Field label={t.legalName} htmlFor="legalName" error={errors.legalName} required>
            <Input
              id="legalName"
              name="legalName"
              defaultValue={supplier.legalName ?? ''}
              disabled={locked}
              hasError={Boolean(errors.legalName)}
            />
          </Field>

          <Field label={t.stir} htmlFor="stir" error={errors.stir} required>
            <Input
              id="stir"
              name="stir"
              inputMode="numeric"
              maxLength={9}
              defaultValue={supplier.stir ?? ''}
              disabled={locked}
              hasError={Boolean(errors.stir)}
            />
          </Field>

          <Field label={t.region} htmlFor="region" error={errors.region} required>
            <Select
              id="region"
              name="region"
              defaultValue={supplier.region ?? ''}
              disabled={locked}
              hasError={Boolean(errors.region)}
            >
              <option value="">{t.selectRegion}</option>
              {UZ_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {UZ_REGION_LABELS[region]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t.district} htmlFor="district" error={errors.district}>
            <Input
              id="district"
              name="district"
              defaultValue={supplier.district ?? ''}
              disabled={locked}
              hasError={Boolean(errors.district)}
            />
          </Field>

          <Field label={t.capacity} htmlFor="monthlyCapacity" error={errors.monthlyCapacity}>
            <Input
              id="monthlyCapacity"
              name="monthlyCapacity"
              type="number"
              min={0}
              defaultValue={supplier.monthlyCapacity ?? ''}
              disabled={locked}
              hasError={Boolean(errors.monthlyCapacity)}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label={t.address} htmlFor="address" error={errors.address} required>
              <Input
                id="address"
                name="address"
                defaultValue={supplier.address ?? ''}
                disabled={locked}
                hasError={Boolean(errors.address)}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label={t.website} htmlFor="website" error={errors.website}>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://..."
                defaultValue={supplier.website ?? ''}
                disabled={locked}
                hasError={Boolean(errors.website)}
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t.contactSection} />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label={t.contactPhone} htmlFor="contactPhone" error={errors.contactPhone} required>
            <Input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              placeholder="+998 90 123 45 67"
              defaultValue={supplier.contactPhone ?? ''}
              disabled={locked}
              hasError={Boolean(errors.contactPhone)}
            />
          </Field>

          <Field label={t.contactEmail} htmlFor="contactEmail" error={errors.contactEmail} required>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={supplier.contactEmail ?? ''}
              disabled={locked}
              hasError={Boolean(errors.contactEmail)}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t.bankSection} description={t.bankHint} />
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <Field label={t.bankName} htmlFor="bankName" error={errors.bankName} required>
            <Input
              id="bankName"
              name="bankName"
              defaultValue={supplier.bankName ?? ''}
              disabled={locked}
              hasError={Boolean(errors.bankName)}
            />
          </Field>

          <Field label={t.bankAccount} htmlFor="bankAccount" error={errors.bankAccount} required>
            <Input
              id="bankAccount"
              name="bankAccount"
              inputMode="numeric"
              maxLength={20}
              defaultValue={supplier.bankAccount ?? ''}
              disabled={locked}
              hasError={Boolean(errors.bankAccount)}
            />
          </Field>

          <Field label={t.mfo} htmlFor="mfo" error={errors.mfo} required>
            <Input
              id="mfo"
              name="mfo"
              inputMode="numeric"
              maxLength={5}
              defaultValue={supplier.mfo ?? ''}
              disabled={locked}
              hasError={Boolean(errors.mfo)}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t.descSection} description={t.descHint} />
        <CardBody className="space-y-4">
          <Field label={t.descUz} htmlFor="descriptionUz" error={errors.descriptionUz}>
            <Textarea
              id="descriptionUz"
              name="descriptionUz"
              rows={3}
              defaultValue={supplier.descriptionUz ?? ''}
              disabled={locked}
            />
          </Field>

          <Field label={t.descRu} htmlFor="descriptionRu" error={errors.descriptionRu}>
            <Textarea
              id="descriptionRu"
              name="descriptionRu"
              rows={3}
              defaultValue={supplier.descriptionRu ?? ''}
              disabled={locked}
            />
          </Field>

          <Field label={t.descEn} htmlFor="descriptionEn" error={errors.descriptionEn}>
            <Textarea
              id="descriptionEn"
              name="descriptionEn"
              rows={3}
              defaultValue={supplier.descriptionEn ?? ''}
              disabled={locked}
            />
          </Field>
        </CardBody>
      </Card>

      {formError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={locked || state !== 'idle'}>
          <Save className="h-4 w-4" aria-hidden="true" />
          {state === 'saving' ? t.saving : state === 'saved' ? t.saved : t.save}
        </Button>

        {canSubmit && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleSubmitForReview}
            disabled={state !== 'idle'}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {state === 'submitting' ? t.submitting : t.submit}
          </Button>
        )}
      </div>
    </form>
  );
}
