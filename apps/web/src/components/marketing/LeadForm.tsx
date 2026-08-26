'use client';

import { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { createLeadSchema, type Locale } from '@ecwt/contracts';
import type { Dictionary } from '@/i18n';
import { ApiError, apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';

type FieldErrors = Partial<Record<string, string>>;

/**
 * Ariza formasi.
 *
 * Validatsiya @ecwt/contracts dagi AYNAN SHU sxema bilan bajariladi —
 * ya'ni brauzerdagi va serverdagi qoidalar bir xil, ular hech qachon
 * bir-biridan uzoqlashib ketmaydi.
 */
export function LeadForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const raw = {
      name: String(formData.get('name') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      email: String(formData.get('email') ?? ''),
      companyName: String(formData.get('companyName') ?? '') || undefined,
      productCategory: String(formData.get('productCategory') ?? '') || undefined,
      message: String(formData.get('message') ?? '') || undefined,
      locale,
      source: typeof window !== 'undefined' ? window.location.pathname : undefined,
      // Honeypot — odam bu maydonni ko'rmaydi
      website: String(formData.get('website') ?? ''),
    };

    const parsed = createLeadSchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setStatus('submitting');

    try {
      await apiFetch('/leads', { method: 'POST', body: parsed.data });
      setStatus('success');
    } catch (error) {
      setStatus('error');

      if (error instanceof ApiError) {
        if (error.details) {
          const fieldErrors: FieldErrors = {};
          for (const [key, messages] of Object.entries(error.details)) {
            fieldErrors[key] = messages[0];
          }
          setErrors(fieldErrors);
        }
        setFormError(error.message);
      } else {
        setFormError(dict.contact.form.error);
      }
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-card border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
        <p className="mt-4 text-base font-medium text-emerald-900">{dict.contact.form.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={dict.contact.form.name} htmlFor="lead-name" error={errors.name} required>
          <Input
            id="lead-name"
            name="name"
            autoComplete="name"
            placeholder={dict.contact.form.namePlaceholder}
            hasError={Boolean(errors.name)}
            aria-describedby={errors.name ? 'lead-name-error' : undefined}
          />
        </Field>

        <Field label={dict.contact.form.phone} htmlFor="lead-phone" error={errors.phone} required>
          <Input
            id="lead-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={dict.contact.form.phonePlaceholder}
            hasError={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'lead-phone-error' : undefined}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={dict.contact.form.email} htmlFor="lead-email" error={errors.email}>
          <Input
            id="lead-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={dict.contact.form.emailPlaceholder}
            hasError={Boolean(errors.email)}
          />
        </Field>

        <Field
          label={dict.contact.form.company}
          htmlFor="lead-company"
          error={errors.companyName}
        >
          <Input
            id="lead-company"
            name="companyName"
            autoComplete="organization"
            placeholder={dict.contact.form.companyPlaceholder}
            hasError={Boolean(errors.companyName)}
          />
        </Field>
      </div>

      <Field
        label={dict.contact.form.category}
        htmlFor="lead-category"
        error={errors.productCategory}
      >
        <Input
          id="lead-category"
          name="productCategory"
          placeholder={dict.contact.form.categoryPlaceholder}
          hasError={Boolean(errors.productCategory)}
        />
      </Field>

      <Field label={dict.contact.form.message} htmlFor="lead-message" error={errors.message}>
        <Textarea
          id="lead-message"
          name="message"
          rows={4}
          placeholder={dict.contact.form.messagePlaceholder}
          hasError={Boolean(errors.message)}
        />
      </Field>

      {/* Honeypot: ko'rinmaydi, faqat botlar to'ldiradi */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="lead-website">Website</label>
        <input id="lead-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {formError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={status === 'submitting'} className="w-full">
        <Send className="h-4 w-4" aria-hidden="true" />
        {status === 'submitting' ? dict.contact.form.submitting : dict.contact.form.submit}
      </Button>

      <p className="text-center text-xs text-brand-400">{dict.contact.form.privacy}</p>
    </form>
  );
}
