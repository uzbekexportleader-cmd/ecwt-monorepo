import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Oddiy jadval primitivlari.
 *
 * Keng jadval sahifani gorizontal siljitmasligi kerak — shuning uchun
 * `Table` o'z ichida `overflow-x: auto` konteynerga o'raladi.
 */
export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-card border border-brand-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-brand-100 bg-brand-50/60">
            <tr>{head}</tr>
          </thead>
          <tbody className="divide-y divide-brand-100">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Th({
  children,
  align = 'left',
}: {
  children: ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brand-500',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = 'left',
  className,
}: {
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <td className={cn('px-4 py-3', align === 'right' ? 'text-right' : 'text-left', className)}>
      {children}
    </td>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="transition-colors hover:bg-brand-50/40">{children}</tr>;
}
