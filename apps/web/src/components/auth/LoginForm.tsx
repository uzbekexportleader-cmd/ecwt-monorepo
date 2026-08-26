'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { loginSchema, type AuthUser, type Locale } from '@ecwt/contracts';
import { ApiError, authFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

const TEXT = {
  uz: {
    email: 'Email',
    password: 'Parol',
    submit: 'Kirish',
    submitting: 'Kirilmoqda...',
  },
  ru: {
    email: 'Email',
    password: 'Пароль',
    submit: 'Войти',
    submitting: 'Входим...',
  },
  en: {
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    submitting: 'Signing in...',
  },
} as const;

export function LoginForm({ locale }: { locale: Locale }) {
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
    const parsed = loginSchema.safeParse({
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
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
      const result = await authFetch<{ user: AuthUser }>('login', parsed.data);

      // Admin boshqa panelga tushadi
      const target =
        result.user.role === 'ADMIN' || result.user.role === 'STAFF'
          ? `/${locale}/admin`
          : `/${locale}/dashboard`;

      router.push(target);
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
      <Field label={t.email} htmlFor="email" error={errors.email} required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="siz@kompaniya.uz"
          hasError={Boolean(errors.email)}
        />
      </Field>

      <Field label={t.password} htmlFor="password" error={errors.password} required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          hasError={Boolean(errors.password)}
        />
      </Field>

      {formError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        <LogIn className="h-4 w-4" aria-hidden="true" />
        {submitting ? t.submitting : t.submit}
      </Button>
    </form>
  );
}
