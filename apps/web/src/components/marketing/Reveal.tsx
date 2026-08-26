'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type React from 'react';

/**
 * Aylantirganda paydo bo'lish.
 *
 * Bo'lim ekranga kirganda pastdan yuqoriga suzib chiqadi. Bu shunchaki
 * bezak emas: "bitta ekran = bitta fikr" tuzilishida har bo'lim
 * alohida gap, va paydo bo'lish o'sha gapning boshlanishini
 * belgilaydi.
 *
 * Bir marta ishlaydi va kuzatuv o'chiriladi — orqaga aylantirganda
 * hamma narsa qayta yonib-o'chib tursa, bu bezovta qiladi.
 *
 * `IntersectionObserver` bo'lmasa (juda eski brauzer) yoki
 * foydalanuvchi harakatni kamaytirishni so'ragan bo'lsa, kontent
 * darrov ko'rinadi — animatsiya qo'shimcha, shart emas.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  /** Millisekundda. Ketma-ket elementlarni bir oz kechiktirish uchun. */
  delay?: number;
  className?: string;
  /**
   * Qaysi teg chizilsin.
   *
   * Kerak, chunki `<ul>` ichida faqat `<li>` turishi mumkin: o'rab
   * turgan `<div>` yaroqsiz HTML beradi va brauzer uni ro'yxatdan
   * tashqariga chiqarib yuborishi mumkin.
   */
  as?: 'div' | 'li';
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      // Pastdan 12% kirganda boshlanadi: element ekran chetida emas,
      // ko'z tushadigan joyda paydo bo'lsin.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLLIElement>}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 700ms ease-out ${delay}ms, transform 700ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}
