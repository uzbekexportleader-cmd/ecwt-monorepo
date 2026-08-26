'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { registerSchema, type AuthUser, type Locale } from '@ecwt/contracts';
import { ApiError, authFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

const TEXT = {
  uz: {
    fullName: 'Ism-familiya',
    companyName: 'Kompaniya nomi',
    phone: 'Telefon',
    email: 'Email',
    password: 'Parol',
    passwordHint: 'Kamida 8 belgi, harf va raqam bo‘lishi kerak',
    submit: 'Ro‘yxatdan o‘tish',
    submitting: 'Yaratilmoqda...',
  },
  ru: {
    fullName: 'Имя и фамилия',
    companyName: 'Название компании',
    phone: 'Телефон',
    email: 'Email',
    password: 'Пароль',
    passwordHint: 'Минимум 8 символов, буквы и цифры',
    submit: 'Зарегистрироваться',
    submitting: 'Создаём...',
  },
  en: {
    fullName: 'Full name',
    companyName: 'Company name',
    phone: 'Phone',
    email: 'Email',
    password: 'Password',
    passwordHint: 'At least 8 characters, with letters and numbers',
    submit: 'Create account',
    submitting: 'Creating...',
  },
} as const;

export function RegisterForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const t = TEXT[locale];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse({
      fullName: String(formData.get('fullName') ?? ''),
      companyName: String(formData.get('companyName') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      locale,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    try {
      await authFetch<{ user: AuthUser }>('register', parsed.data);
      router.push(`/${locale}/dashboard`);
      router.refresh();
    } catch (error) {
      setSubmitting(false);

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
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label={t.fullName} htmlFor="fullName" error={errors.fullName} required>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          autoFocus
          hasError={Boolean(errors.fullName)}
        />
      </Field>

      <Field label={t.companyName} htmlFor="companyName" error={errors.companyName} required>
        <Input
          id="companyName"
          name="companyName"
          autoComplete="organization"
          hasError={Boolean(errors.companyName)}
        />
      </Field>

      <Field label={t.phone} htmlFor="phone" error={errors.phone} required>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+998 90 123 45 67"
          hasError={Boolean(errors.phone)}
        />
      </Field>

      <Field label={t.email} htmlFor="email" error={errors.email} required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          hasError={Boolean(errors.email)}
        />
      </Field>

      <Field
        label={t.password}
        htmlFor="password"
        error={errors.password}
        hint={t.passwordHint}
        required
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          hasError={Boolean(errors.password)}
        />
      </Field>

      {formError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        {submitting ? t.submitting : t.submit}
      </Button>
    </form>
  );
}
