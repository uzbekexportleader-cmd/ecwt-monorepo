'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLoginSchema } from '@ecwt/validation';

import { api, EcwtApiError, tokenStorage } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('998900000001');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    const parsed = adminLoginSchema.safeParse({ phone, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Ma’lumotlar noto‘g‘ri');
      return;
    }

    setLoading(true);
    try {
      const auth = await api.auth.adminLogin(parsed.data.phone, parsed.data.password);
      tokenStorage.setTokens(auth);
      router.replace('/');
    } catch (err) {
      setError(err instanceof EcwtApiError ? err.message : 'Kirish amalga oshmadi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} className="card w-full max-w-sm p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)] text-lg font-extrabold text-[var(--color-bg)]">
            E
          </div>
          <div>
            <div className="text-lg font-bold tracking-widest">ECWT</div>
            <div className="text-xs text-[var(--color-ink-muted)]">Boshqaruv paneli</div>
          </div>
        </div>

        <h1 className="mb-1 text-xl font-semibold">Tizimga kirish</h1>
        <p className="mb-6 text-sm text-[var(--color-ink-secondary)]">
          Xodim hisobingiz bilan kiring.
        </p>

        <div className="mb-4">
          <label className="label" htmlFor="phone">
            Telefon raqami
          </label>
          <input
            id="phone"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="998900000001"
            autoComplete="username"
          />
        </div>

        <div className="mb-6">
          <label className="label" htmlFor="password">
            Parol
          </label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-[var(--color-danger)] bg-[rgba(248,113,113,0.1)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        ) : null}

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Tekshirilmoqda...' : 'Kirish'}
        </button>

        <p className="mt-6 text-center text-xs text-[var(--color-ink-muted)]">
          Development seed hisobi: 998900000001 / Admin12345!
        </p>
      </form>
    </main>
  );
}
