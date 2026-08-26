'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * ChatGPT yordamchisi — o'ng pastki burchakda.
 *
 * ── Qanday ishlaydi ─────────────────────────────────────────────────
 * Brauzer OpenAI ga TO'G'RIDAN murojaat qilmaydi. U faqat o'z
 * saytimizdagi `/api/chat` ga yozadi, u yerdan esa server OpenAI ga
 * boradi. Sabab: kalit brauzerga tushsa, sahifa kodini ochgan har
 * qanday odam uni ko'radi.
 *
 * ── Javob bo'lak-bo'lak keladi ──────────────────────────────────────
 * Server matnni oqim sifatida uzatadi, shuning uchun javob to'liq
 * tayyor bo'lishini kutib o'tirmaymiz — u yozilayotgandek paydo
 * bo'ladi. Uzun javobda bu kutish hissini butunlay yo'q qiladi.
 *
 * ── Kalit bo'lmasa ──────────────────────────────────────────────────
 * Server `not_configured` qaytaradi va oyna buni ochiq aytadi. Bu
 * "xato" emas: sayt kalitsiz ham ishlayveradi, faqat chat javob
 * bermaydi.
 */

export interface ChatCopy {
  /** Tugmaning ko'rinmas nomi */
  open: string;
  title: string;
  subtitle: string;
  placeholder: string;
  send: string;
  close: string;
  greeting: string;
  /** Boshlang'ich takliflar — bo'sh oynada nima so'rashni ko'rsatadi */
  suggestions: string[];
  errorGeneric: string;
  errorNotConfigured: string;
  errorRate: string;
}

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_CHARS = 2000;

export function ChatWidget({ copy }: { copy: ChatCopy }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Yangi xabar kelganda pastga tushamiz
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Esc bilan yopish — klaviatura bilan ishlaydigan odam uchun
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Oyna yopilsa yoki komponent o'chsa — javobni kutishni to'xtatamiz
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (text: string) => {
    const clean = text.trim().slice(0, MAX_CHARS);
    if (!clean || busy) return;

    setError(null);
    setDraft('');

    const next: Msg[] = [...messages, { role: 'user', content: clean }];
    setMessages(next);
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          data.error === 'not_configured'
            ? copy.errorNotConfigured
            : data.error === 'rate_limited'
              ? copy.errorRate
              : copy.errorGeneric,
        );
        setBusy(false);
        return;
      }

      // Bo'sh javob qo'shamiz va uni bo'lak-bo'lak to'ldiramiz
      setMessages([...next, { role: 'assistant', content: '' }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...next, { role: 'assistant', content: acc }]);
      }

      if (!acc.trim()) setError(copy.errorGeneric);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError(copy.errorGeneric);
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  return (
    <>
      {/* ── Ochish tugmasi ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? copy.close : copy.open}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_10px_40px_-10px_rgba(37,120,220,0.8)] transition-transform hover:scale-105 sm:bottom-7 sm:right-7"
        style={{ backgroundImage: 'linear-gradient(135deg, #2b66ad 0%, #22c55e 100%)' }}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
          {open ? (
            <path
              d="m6 6 12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-5 4z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </button>

      {/* ── Suhbat oynasi ──────────────────────────────────────────── */}
      {open && (
        <div
          role="dialog"
          aria-label={copy.title}
          className="fixed bottom-24 right-4 z-50 flex max-h-[70vh] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-white/[0.14] bg-[#070c18]/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:bottom-28 sm:right-7 sm:max-h-[32rem] sm:w-[24rem]"
        >
          <header className="flex items-center gap-3 border-b border-white/[0.09] px-5 py-4">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold leading-tight">{copy.title}</span>
              <span className="block text-[11.5px] leading-tight text-brand-200">
                {copy.subtitle}
              </span>
            </span>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {messages.length === 0 && (
              <>
                <p className="text-[13.5px] leading-relaxed text-brand-200">{copy.greeting}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {copy.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="rounded-full border border-white/[0.14] px-3 py-1.5 text-left text-[12px] text-brand-200 transition-colors hover:border-white/30 hover:text-white"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <span
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-white text-brand-950'
                      : 'border border-white/[0.1] bg-white/[0.04] text-[#e6eefb]'
                  }`}
                >
                  {m.content || '…'}
                </span>
              </div>
            ))}

            {busy && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <span className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-[13.5px] text-brand-200">
                  …
                </span>
              </div>
            )}

            {error && (
              <p className="rounded-2xl border border-red-400/30 bg-red-400/[0.08] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-red-200">
                {error}
              </p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(draft);
            }}
            className="flex items-end gap-2 border-t border-white/[0.09] px-4 py-3"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              maxLength={MAX_CHARS}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Enter — yuborish, Shift+Enter — yangi qator
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send(draft);
                }
              }}
              placeholder={copy.placeholder}
              className="max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-2xl border border-white/[0.12] bg-white/[0.04] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white outline-none transition-colors placeholder:text-brand-200/60 focus:border-white/30"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              aria-label={copy.send}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-950 transition-opacity disabled:opacity-35"
            >
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" aria-hidden="true">
                <path
                  d="M4 12h15m0 0-6-6m6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
