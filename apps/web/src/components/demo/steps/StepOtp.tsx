'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Loader2, MessageSquare, RefreshCw } from 'lucide-react';
import type { Locale, OtpSendResponse, OtpVerifyResponse } from '@ecwt/contracts';
import { cn } from '@/lib/utils';
import { ApiError, apiFetch } from '@/lib/api-client';
import { OTP_COPY } from '../demo-copy';
import { formatPhone, onlyDigits, type DemoState } from '../demo-state';

const CODE_LENGTH = 6;
/** Server javob bermasa ishlatiladigan zaxira qiymatlar */
const FALLBACK_RESEND_SECONDS = 60;
const FALLBACK_TTL_SECONDS = 300;

/** Kod yuborish holati */
type Delivery = 'sending' | 'sent' | 'demo' | 'failed';
/** Kiritilgan kodni tekshirish holati */
type Status = 'idle' | 'verifying' | 'verified' | 'error';

interface StepOtpProps {
  locale: Locale;
  state: DemoState;
  onChange: (patch: Partial<DemoState>) => void;
  onNext: () => void;
  onBack: () => void;
}

/**
 * 2-qadam — SMS orqali tasdiqlash.
 *
 * Kod backend'da yaratiladi, xeshlanib `otp_codes` jadvaliga yoziladi va
 * Eskiz.uz orqali yuboriladi. Bu yerda kod hech qachon hisoblanmaydi va
 * tekshirilmaydi — ikkalasi ham serverda.
 *
 * SMS provayderi ulanmagan bo'lsa (`SMS_PROVIDER=NONE`) server `demo`
 * rejimini qaytaradi va kodni javobga qo'shadi: ekranda telefon
 * bildirishnomasiga o'xshash karta chiqadi. Bu xato holati emas, ataylab
 * tanlangan holat. Yuborish haqiqatan barbod bo'lsa esa xato ko'rsatiladi
 * va qayta urinish tugmasi chiqadi — jimgina demoga tushmaydi.
 *
 * Oltita katak — ko'rinish, ular ustida bitta ko'rinmas maydon turadi.
 * Har katak alohida `input` bo'lganida tez yozilgan raqamlar
 * `maxLength` ga urilib yo'qolardi; bitta maydonda yozish ham,
 * yopishtirish ham, backspace ham brauzerning o'zida ishlaydi.
 */
export function StepOtp({ locale, state, onChange, onNext, onBack }: StepOtpProps) {
  const t = OTP_COPY[locale];

  const [delivery, setDelivery] = useState<Delivery>('sending');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  /** Kod maydoni tozalanib bo‘lgunicha avtomatik tekshiruv o‘chirilgan turadi */
  const [armed, setArmed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(FALLBACK_RESEND_SECONDS);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const mounted = useRef(false);

  const code = state.otp;
  const phone = `+998${state.phone}`;

  const send = useCallback(async () => {
    setDelivery('sending');
    setStatus('idle');
    setError(null);
    onChange({ otp: '' });

    try {
      const res = await apiFetch<OtpSendResponse>('auth/otp/send', {
        method: 'POST',
        body: { phone },
      });

      setSecondsLeft(res.resendAfterSeconds);
      setExpiresAt(Date.now() + res.expiresInSeconds * 1000);
      setDelivery(res.mode === 'demo' ? 'demo' : 'sent');
      onChange({ demoOtp: res.demoCode ?? '' });
    } catch (e) {
      // Chegaraga urilgan bo'lsak, avvalgi kod hali kuchda — bu xato emas
      if (e instanceof ApiError && e.code === 'rate_limited') {
        setSecondsLeft(FALLBACK_RESEND_SECONDS);
        setExpiresAt(Date.now() + FALLBACK_TTL_SECONDS * 1000);
        setDelivery('sent');
        return;
      }

      setDelivery('failed');
      // Serverdan kelgan matn faqat o'zbekcha — uni ko'rsatsak, ru/en
      // sahifasida sarlavha bir tilda, tavsif boshqa tilda chiqadi.
      // Shuning uchun har doim mahalliy matn ishlatiladi.
      setError(t.sendFailed);
    }
  }, [onChange, phone, t.sendFailed]);

  /**
   * Ochilganda kod maydonini tozalab, kod so‘raymiz.
   *
   * Tozalash muhim: 3-qadamdan orqaga qaytilganda eski to‘liq kod qolib
   * ketsa, ekran o‘zini darhol qayta tasdiqlab, oldinga otib yuborardi.
   * `armed` esa shu tozalash amalga oshgunicha avtomatik tekshiruvni
   * ushlab turadi — aks holda tekshiruv effekti o‘sha renderdagi eski
   * kodni ko‘rib, baribir ishga tushardi.
   *
   * `mounted` qo‘riqchisi StrictMode'da effekt ikki marta ishlaganda
   * ikkinchi SMS ketib qolishining oldini oladi.
   */
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    setArmed(true);
    inputRef.current?.focus();
    void send();
  }, [send]);

  /** Qayta yuborish taymeri */
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  /** Komponent yopilganda kutilayotgan barcha taymerlarni bekor qilamiz */
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const verify = useCallback(
    async (value: string) => {
      // Muddat tugaganini o'zimiz bilamiz: serverga bormasdan aniq
      // sabab ko'rsatamiz va foydalanuvchini qayta yuborishga yo'naltiramiz.
      if (expiresAt !== null && Date.now() > expiresAt) {
        setStatus('error');
        setError(t.codeExpired);
        onChange({ otp: '' });
        return;
      }

      setStatus('verifying');
      setError(null);

      try {
        await apiFetch<OtpVerifyResponse>('auth/otp/verify', {
          method: 'POST',
          body: { phone, code: value },
        });

        setStatus('verified');
        onChange({ otpVerified: true });
        timers.current.push(setTimeout(onNext, 600));
      } catch (e) {
        setStatus('error');
        // Yuqoridagi kabi: server matni tarjima qilinmagan, mahalliysi
        // ishlatiladi. Chegaraga urilgan holat alohida ajratiladi.
        setError(e instanceof ApiError && e.code === 'rate_limited' ? t.tooSoon : t.wrongCode);
        onChange({ otp: '' });
        inputRef.current?.focus();
      }
    },
    [expiresAt, onChange, onNext, phone, t.codeExpired, t.wrongCode],
  );

  const setCode = useCallback(
    (raw: string) => {
      const next = onlyDigits(raw).slice(0, CODE_LENGTH);
      onChange({ otp: next });

      if (status === 'error') {
        setStatus('idle');
        setError(null);
      }
    },
    [onChange, status],
  );

  // Kod to‘lganda tekshiramiz. Effekt ichida turgani uchun kod qanday
  // kelishi — qo‘lda yozish, yopishtirish yoki "Demo to‘ldirish" —
  // ahamiyatsiz.
  useEffect(() => {
    if (!armed) return;
    if (delivery === 'sending' || delivery === 'failed') return;
    if (code.length === CODE_LENGTH && status === 'idle') void verify(code);
  }, [armed, code, delivery, status, verify]);

  function useSmsCode(): void {
    setCode(state.demoOtp);
    inputRef.current?.focus();
  }

  function resend(): void {
    void send();
    inputRef.current?.focus();
  }

  const locked = status === 'verifying' || status === 'verified';
  const activeIndex = Math.min(code.length, CODE_LENGTH - 1);
  const canEnterCode = delivery === 'sent' || delivery === 'demo';

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-brand-950 sm:text-3xl">
        {t.title}
      </h1>
      <p className="mt-2 text-sm text-brand-500">
        <span className="font-medium text-brand-800">+998 {formatPhone(state.phone)}</span>{' '}
        {t.subtitle}
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-1 text-sm font-medium text-brand-700 hover:underline"
      >
        {t.changeNumber}
      </button>

      {/* Yuborish holati */}
      <div className="mt-6 min-h-20">
        {delivery === 'sending' && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-brand-100 bg-white p-3.5 text-sm text-brand-600 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-brand-600" aria-hidden="true" />
            {t.sending}
          </div>
        )}

        {delivery === 'sent' && (
          <div className="animate-slide-in flex items-start gap-3 rounded-2xl border border-brand-100 bg-white p-3.5 shadow-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-800">
              <MessageSquare className="h-4 w-4 text-white" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-brand-950">{t.sent}</span>
              <span className="mt-0.5 block text-sm text-brand-600">{t.sentNote}</span>
            </span>
          </div>
        )}

        {/* Demo rejimi — provayder ulanmagan, kod ekranda */}
        {delivery === 'demo' && (
          <button
            type="button"
            onClick={useSmsCode}
            className="animate-slide-in flex w-full items-start gap-3 rounded-2xl border border-brand-100 bg-white p-3.5 text-left shadow-sm transition-[background-color,transform] duration-150 hover:bg-brand-50 active:scale-[0.995]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-800">
              <MessageSquare className="h-4 w-4 text-white" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-brand-950">{t.smsSender}</span>
                <span className="text-xs text-brand-400">{t.smsNote}</span>
              </span>
              <span className="mt-0.5 block text-sm text-brand-600">
                {t.smsBody(state.demoOtp)}
              </span>
            </span>
            <span className="shrink-0 self-center rounded-md bg-gold-100 px-2 py-1 text-xs font-medium text-gold-800">
              {t.smsAction}
            </span>
          </button>
        )}

        {delivery === 'failed' && (
          <div
            role="alert"
            className="animate-slide-in flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-3.5"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-red-800">{t.sendFailed}</span>
              {error && <span className="mt-0.5 block text-sm text-red-700">{error}</span>}
            </span>
            <button
              type="button"
              onClick={resend}
              className="shrink-0 self-center rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700"
            >
              {t.retry}
            </button>
          </div>
        )}
      </div>

      {/* Kod kataklari — ustida bitta ko‘rinmas maydon */}
      <div className={cn('relative mt-5', status === 'error' && 'animate-shake')}>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          disabled={locked || !canEnterCode}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={t.title}
          aria-invalid={status === 'error' || undefined}
          aria-describedby={error && status === 'error' ? 'otp-error' : undefined}
          className="absolute inset-0 z-10 h-full w-full opacity-0 disabled:cursor-default"
        />

        <div className="flex gap-2 sm:gap-2.5" aria-hidden="true">
          {Array.from({ length: CODE_LENGTH }, (_, i) => {
            const digit = code[i] ?? '';
            const isActive = focused && !locked && canEnterCode && i === activeIndex;

            return (
              <div
                key={i}
                className={cn(
                  'flex h-14 w-full items-center justify-center rounded-xl border bg-white text-xl font-semibold tabular-nums transition-[border-color,box-shadow,background-color]',
                  !canEnterCode && 'opacity-60',
                  status === 'error'
                    ? 'border-red-400 text-red-600'
                    : status === 'verified'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : isActive
                        ? 'border-brand-500 text-brand-950 ring-2 ring-brand-500/20'
                        : 'border-brand-200 text-brand-950',
                )}
              >
                {digit || (isActive ? <span className="h-6 w-px bg-brand-400" /> : null)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Holat qatori */}
      <div className="mt-4 flex min-h-6 items-center gap-2 text-sm">
        {status === 'verifying' && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-brand-600" aria-hidden="true" />
            <span className="text-brand-600">{t.verifying}</span>
          </>
        )}

        {status === 'verified' && (
          <>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600">
              <Check className="h-3 w-3 text-white" aria-hidden="true" />
            </span>
            <span className="font-medium text-green-700">{t.verified}</span>
          </>
        )}

        {status === 'error' && error && (
          <span id="otp-error" role="alert" className="font-medium text-red-600">
            {error}
          </span>
        )}
      </div>

      {/* Qayta yuborish */}
      <div className="mt-6 border-t border-brand-100 pt-5">
        {secondsLeft > 0 ? (
          <p className="text-sm tabular-nums text-brand-400">{t.resendIn(secondsLeft)}</p>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={delivery === 'sending'}
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t.resend}
          </button>
        )}
      </div>
    </div>
  );
}
