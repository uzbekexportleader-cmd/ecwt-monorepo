import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-card border p-5 shadow-sm',
        accent ? 'border-brand-700 bg-brand-800 text-white' : 'border-brand-100 bg-white',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={cn('text-xs font-medium', accent ? 'text-brand-200' : 'text-brand-500')}>
          {label}
        </p>
        <Icon
          className={cn('h-4.5 w-4.5 shrink-0', accent ? 'text-gold-300' : 'text-brand-400')}
          aria-hidden="true"
        />
      </div>

      <p
        className={cn(
          'mt-2 text-2xl font-bold tracking-tight',
          accent ? 'text-white' : 'text-brand-950',
        )}
      >
        {value}
      </p>

      {hint && (
        <p className={cn('mt-1 text-xs', accent ? 'text-brand-300' : 'text-brand-400')}>{hint}</p>
      )}
    </div>
  );
}
