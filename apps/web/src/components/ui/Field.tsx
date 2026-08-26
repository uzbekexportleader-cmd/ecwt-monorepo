import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

const CONTROL_BASE =
  'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-brand-950 ' +
  'placeholder:text-brand-300 transition-colors ' +
  'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ' +
  'disabled:bg-brand-50 disabled:text-brand-400';

const CONTROL_NORMAL = 'border-brand-200';
const CONTROL_ERROR = 'border-red-400 focus:border-red-500 focus:ring-red-500/20';

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

/**
 * Maydon o'ramchisi: yorliq, yordam matni va xato.
 *
 * Xato `aria-describedby` orqali bog'lanadi va `role="alert"` bilan
 * e'lon qilinadi — skrinreader foydalanuvchisi ham xatoni eshitadi.
 */
export function Field({ label, htmlFor, error, hint, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-brand-900">
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-xs text-brand-500">
          {hint}
        </p>
      )}

      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  className,
  hasError,
  ...props
}: ComponentProps<'input'> & { hasError?: boolean }) {
  return (
    <input
      className={cn(CONTROL_BASE, hasError ? CONTROL_ERROR : CONTROL_NORMAL, className)}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}

export function Textarea({
  className,
  hasError,
  ...props
}: ComponentProps<'textarea'> & { hasError?: boolean }) {
  return (
    <textarea
      className={cn(CONTROL_BASE, 'min-h-24 resize-y', hasError ? CONTROL_ERROR : CONTROL_NORMAL, className)}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}

export function Select({
  className,
  hasError,
  children,
  ...props
}: ComponentProps<'select'> & { hasError?: boolean }) {
  return (
    <select
      className={cn(CONTROL_BASE, 'cursor-pointer', hasError ? CONTROL_ERROR : CONTROL_NORMAL, className)}
      aria-invalid={hasError || undefined}
      {...props}
    >
      {children}
    </select>
  );
}
