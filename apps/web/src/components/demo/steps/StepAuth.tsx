'use client';

import { useId, useRef, useState } from 'react';
import { ArrowRight, BadgeCheck, Check, Loader2 } from 'lucide-react';
import type { Locale } from '@ecwt/contracts';
import { cn } from '@/lib/utils';
import { AUTH_COPY } from '../demo-copy';
import { formatPhone, onlyDigits, type AuthMode, type DemoState } from '../demo-state';

type Errors = Partial<Record<'fullName' | 'phone' | 'terms', string>>;

/**
 * Ekranning ohangi.
 *
 * `brand` — kabinetdagi ko'k palitra; varonkaning o'z ichida shu ishlatiladi.
 * `espresso` — bosh sahifadagi quyuq karta: krem fon ustida u eng kuchli
 * kontrast nuqtasi bo'lib, ko'zni to'g'ridan-to'g'ri formaga olib keladi.
 * Tuzilma ikkalasida bir xil, faqat sirt va ranglar farq qiladi.
 */
type Tone = 'brand' | 'espresso';

/* Maydonlarning umumiy ko'rinishi bir joyda: balandlik 44px — barmoq
   uchun qulay eng kichik o'lcham, fokus halqasi esa keng va past
   to'yinganlikda, shunda u chegarani bo'yamay, atrofida yumshoq
   yoritadi. Sirt va rang ohangdan keladi, shuning uchun bu yerda yo'q. */
const FIELD_SHELL =
  'h-11 w-full border px-3.5 text-sm ' +
  'transition-[border-color,box-shadow] focus:outline-none focus:ring-4';

/* Xato holati ikkala ohangda ham bir xil qizil: ogohlantirish rangi
   brendga bo'ysunmasligi kerak. */
const FIELD_ERROR = 'border-red-400 focus:border-red-500 focus:ring-red-500/12';
const FIELD_ERROR_WITHIN =
  'border-red-400 focus-within:border-red-500 focus-within:ring-red-500/12';

const LABEL = 'block text-[13px] font-medium';

const TONES: Record<Tone, Record<string, string>> = {
  brand: {
    fieldBase: 'rounded-xl bg-white',
    fieldText: 'text-brand-950 placeholder:text-brand-300',
    title: 'text-brand-950',
    subtitle: 'text-brand-500',
    label: 'text-brand-800',
    fieldOk: 'border-brand-200 focus:border-brand-500 focus:ring-brand-500/12',
    fieldOkWithin: 'border-brand-200 focus-within:border-brand-500 focus-within:ring-brand-500/12',
    prefix: 'text-brand-600',
    divider: 'bg-brand-200',
    checkOn: 'border-brand-700 bg-brand-700 text-white',
    checkOff: 'border-brand-300 bg-white',
    terms: 'text-brand-600',
    submit: 'rounded-xl bg-brand-700 hover:bg-brand-800 active:bg-brand-900',
    rule: 'bg-brand-100',
    or: 'text-brand-400',
    social: 'rounded-xl border-brand-200 bg-white text-brand-800 hover:bg-brand-50',
    socialIcon: 'text-brand-600',
    footer: 'text-brand-600',
    switchLink: 'text-brand-700',
  },
  espresso: {
    fieldBase: 'rounded-xl bg-white/[0.06]',
    fieldText: 'text-sand-50 placeholder:text-sand-500',
    title: 'text-sand-50',
    subtitle: 'text-sand-400',
    label: 'text-sand-300',
    fieldOk: 'border-white/12 focus:border-clay-400 focus:ring-clay-400/20',
    fieldOkWithin: 'border-white/12 focus-within:border-clay-400 focus-within:ring-clay-400/20',
    prefix: 'text-sand-400',
    divider: 'bg-white/15',
    checkOn: 'border-clay-500 bg-clay-500 text-white',
    checkOff: 'border-white/20 bg-white/5',
    terms: 'text-sand-400',
    submit: 'rounded-full bg-clay-500 hover:bg-clay-400 active:bg-clay-600',
    rule: 'bg-white/10',
    or: 'text-sand-500',
    social: 'rounded-full border-white/12 bg-white/[0.06] text-sand-200 hover:bg-white/[0.12]',
    socialIcon: 'text-clay-300',
    footer: 'text-sand-400',
    switchLink: 'text-clay-300',
  },
};

interface StepAuthProps {
  locale: Locale;
  state: DemoState;
  onChange: (patch: Partial<DemoState>) => void;
  onNext: () => void;
  /**
   * Varonka ichida bu ekran sahifaning o'zi — sarlavhasi `h1`.
   * Bosh sahifada esa u katta sarlavha yonidagi karta ichida turadi,
   * shuning uchun `h2` ga tushadi va kichrayadi.
   */
  titleAs?: 'h1' | 'h2';
  /** Bosh sahifada `warm`, varonkada — sukut bo'yicha `brand`. */
  tone?: Tone;
}

/**
 * 1-qadam — ro‘yxatdan o‘tish va kirish.
 *
 * Parol yo‘q: faqat telefon raqam va SMS. Bu O‘zbekistondagi eng yuqori
 * konversiyali usul — foydalanuvchi hech narsa eslab qolishi shart emas.
 */
export function StepAuth({
  locale,
  state,
  onChange,
  onNext,
  titleAs = 'h1',
  tone = 'brand',
}: StepAuthProps) {
  const Title = titleAs;
  const t = AUTH_COPY[locale];
  const skin = TONES[tone];
  const nameId = useId();
  const phoneId = useId();

  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isRegister = state.mode === 'register';

  function setMode(mode: AuthMode): void {
    setErrors({});
    onChange({ mode });
  }

  function validate(): Errors {
    const next: Errors = {};

    if (isRegister && state.fullName.trim().length < 3) next.fullName = t.errors.fullName;
    if (state.phone.length < 9) next.phone = t.errors.phone;
    if (isRegister && !terms) next.terms = t.errors.terms;

    return next;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // SMS yuborilayotgandek qisqa pauza — kod haqiqiy tarmoqqa
    // chiqmaydi, lekin oqim jonli ko‘rinadi.
    setSending(true);
    timer.current = setTimeout(() => {
      setSending(false);
      onNext();
    }, 900);
  }

  function handlePhone(value: string): void {
    onChange({ phone: onlyDigits(value).slice(0, 9) });
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
  }

  return (
    <div>
      <Title
        className={cn(
          'font-semibold tracking-[-0.02em]',
          skin.title,
          titleAs === 'h1' ? 'text-2xl sm:text-3xl' : 'text-[22px]',
        )}
      >
        {isRegister ? t.registerTitle : t.loginTitle}
      </Title>
      <p className={cn('mt-2 text-sm', skin.subtitle)}>
        {isRegister ? t.registerSubtitle : t.loginSubtitle}
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        {isRegister && (
          <div className="space-y-1.5">
            <label htmlFor={nameId} className={cn(LABEL, skin.label)}>
              {t.fullName}
            </label>
            <input
              id={nameId}
              name="fullName"
              autoComplete="name"
              placeholder={t.fullNamePlaceholder}
              value={state.fullName}
              onChange={(e) => {
                onChange({ fullName: e.target.value });
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              aria-invalid={Boolean(errors.fullName) || undefined}
              aria-describedby={errors.fullName ? `${nameId}-error` : undefined}
              className={cn(
                FIELD_SHELL,
                skin.fieldBase,
                skin.fieldText,
                errors.fullName ? FIELD_ERROR : skin.fieldOk,
              )}
            />
            {errors.fullName && (
              <p id={`${nameId}-error`} role="alert" className="text-xs font-medium text-red-600">
                {errors.fullName}
              </p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor={phoneId} className={cn(LABEL, skin.label)}>
            {t.phone}
          </label>
          <div
            className={cn(
              'flex h-11 items-center gap-2.5 border px-3.5',
              'transition-[border-color,box-shadow] focus-within:ring-4',
              skin.fieldBase,
              errors.phone ? FIELD_ERROR_WITHIN : skin.fieldOkWithin,
            )}
          >
            <span className={cn('select-none text-sm font-medium tabular-nums', skin.prefix)}>
              +998
            </span>
            <span className={cn('h-4 w-px', skin.divider)} aria-hidden="true" />
            <input
              id={phoneId}
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="90 123 45 67"
              value={formatPhone(state.phone)}
              onChange={(e) => handlePhone(e.target.value)}
              aria-invalid={Boolean(errors.phone) || undefined}
              aria-describedby={errors.phone ? `${phoneId}-error` : undefined}
              className={cn(
                'h-full w-full bg-transparent text-sm tabular-nums focus:outline-none',
                skin.fieldText,
              )}
            />
          </div>
          {errors.phone && (
            <p id={`${phoneId}-error`} role="alert" className="text-xs font-medium text-red-600">
              {errors.phone}
            </p>
          )}
        </div>

        {isRegister && (
          <div className="space-y-1.5">
            <label className="flex cursor-pointer items-start gap-2.5">
              <span
                className={cn(
                  'mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors',
                  terms ? skin.checkOn : errors.terms ? 'border-red-400 bg-white' : skin.checkOff,
                )}
              >
                {terms && <Check className="h-3 w-3" aria-hidden="true" />}
              </span>
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => {
                  setTerms(e.target.checked);
                  if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
                }}
                className="sr-only"
              />
              <span className={cn('text-sm leading-snug', skin.terms)}>{t.terms}</span>
            </label>
            {errors.terms && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {errors.terms}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={sending}
          className={cn(
            'inline-flex h-12 w-full items-center justify-center gap-2 text-sm font-medium text-white shadow-sm',
            'transition-[background-color,transform] duration-150 active:scale-[0.99]',
            'disabled:pointer-events-none disabled:opacity-60',
            skin.submit,
          )}
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.sending}
            </>
          ) : (
            <>
              {isRegister ? t.submitRegister : t.submitLogin}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className={cn('h-px flex-1', skin.rule)} aria-hidden="true" />
        <span className={cn('text-xs', skin.or)}>{t.or}</span>
        <span className={cn('h-px flex-1', skin.rule)} aria-hidden="true" />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onNext}
          className={cn(
            'inline-flex h-11 items-center justify-center gap-2 border text-sm font-medium',
            'transition-[background-color,transform] duration-150 active:scale-[0.99]',
            skin.social,
          )}
        >
          <BadgeCheck className={cn('h-4 w-4', skin.socialIcon)} aria-hidden="true" />
          {t.oneId}
        </button>
        <button
          type="button"
          onClick={onNext}
          className={cn(
            'inline-flex h-11 items-center justify-center gap-2 border text-sm font-medium',
            'transition-[background-color,transform] duration-150 active:scale-[0.99]',
            skin.social,
          )}
        >
          <GoogleMark />
          {t.google}
        </button>
      </div>

      <p className={cn('mt-6 text-center text-sm', skin.footer)}>
        {isRegister ? t.haveAccount : t.noAccount}{' '}
        <button
          type="button"
          onClick={() => setMode(isRegister ? 'login' : 'register')}
          className={cn('font-medium hover:underline', skin.switchLink)}
        >
          {isRegister ? t.goLogin : t.goRegister}
        </button>
      </p>
    </div>
  );
}

/** Google logotipi — lucide-react da brend belgilar yo‘q */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3.01h3.87c2.26-2.09 3.57-5.17 3.57-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.11A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.29a12 12 0 0 0 0 10.78l4-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.61l4 3.11C6.23 6.88 8.88 4.77 12 4.77z"
      />
    </svg>
  );
}
