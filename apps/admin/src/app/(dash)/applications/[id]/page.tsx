'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ALLOWED_TRANSITIONS,
  REASON_REQUIRED,
  STATUS_LABEL_UZ,
  type ApplicationStatus,
} from '@ecwt/types';

import { api, EcwtApiError, openDocument } from '@/lib/api';
import {
  Chip,
  DOCUMENT_LABEL,
  Loading,
  PageHeader,
  StatusChip,
  formatDate,
  formatPhone,
  formatSom,
} from '@/lib/ui';

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();

  const [target, setTarget] = useState<ApplicationStatus | ''>('');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [error, setError] = useState<string>();

  const query = useQuery({
    queryKey: ['admin', 'application', id],
    queryFn: () => api.admin.application(id),
  });

  const changeStatus = useMutation({
    mutationFn: () =>
      api.admin.changeStatus(id, {
        toStatus: target as string,
        ...(comment ? { comment } : {}),
        ...(reason ? { reason } : {}),
        ...(approvedAmount ? { approvedAmount: Number(approvedAmount.replace(/\D/g, '')) } : {}),
      }),
    onSuccess: () => {
      setTarget('');
      setReason('');
      setComment('');
      setApprovedAmount('');
      setError(undefined);
      void qc.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (e) => setError(e instanceof EcwtApiError ? e.message : 'Statusni o‘zgartirib bo‘lmadi'),
  });

  if (query.isLoading) return <Loading />;
  if (!query.data) return <div className="text-sm">Ariza topilmadi</div>;

  const app = query.data as typeof query.data & {
    applicantName?: string | null;
    applicantPhone?: string;
    /** Foydalanuvchi o'zi kiritgan, reyestr orqali tasdiqlanmagan da'volar */
    unverifiedClaims?: { type: string; text: string; reason: string | null }[];
  };
  const unverified = app.unverifiedClaims ?? [];
  const allowed = ALLOWED_TRANSITIONS[app.status];
  const reasonRequired = target ? REASON_REQUIRED.includes(target as ApplicationStatus) : false;

  return (
    <>
      <PageHeader
        title={app.number}
        subtitle={app.subsidy?.title}
        action={
          <Link href="/applications" className="btn btn-secondary">
            ← Ro‘yxatga
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chap ustun */}
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Ariza ma’lumotlari</h2>
              <StatusChip status={app.status} />
            </div>
            <Row label="Ariza beruvchi" value={app.applicantName ?? '—'} />
            <Row label="Telefon" value={app.applicantPhone ? formatPhone(app.applicantPhone) : '—'} />
            <Row label="Dastur" value={app.subsidy?.title ?? '—'} />
            <Row label="Tashkilot" value={app.subsidy?.organization ?? '—'} />
            <Row label="So‘ralgan summa" value={formatSom(app.requestedAmount)} />
            <Row label="Tasdiqlangan summa" value={formatSom(app.approvedAmount)} />
            <Row label="Yuborilgan" value={formatDate(app.submittedAt)} />
            <Row label="Qaror sanasi" value={formatDate(app.decidedAt)} />
            <Row label="To‘langan" value={formatDate(app.paidAt)} last />
          </div>

          {unverified.length ? (
            <div className="card border-l-4 border-l-[var(--color-warning)] p-5">
              <h2 className="mb-1 font-semibold">Qo‘lda tekshirish talab qilinadi</h2>
              <p className="mb-4 text-sm text-[var(--color-ink-muted)]">
                Quyidagi ma’lumotlarni ariza beruvchi o‘zi kiritgan — davlat reyestri orqali
                tasdiqlanmagan. Qaror qabul qilishdan oldin tekshiring.
              </p>
              <ul className="space-y-2">
                {unverified.map((c, i) => (
                  <li
                    key={`${c.type}-${i}`}
                    className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
                  >
                    <div className="font-medium">{c.text}</div>
                    {c.reason ? (
                      <div className="text-xs text-[var(--color-ink-muted)]">{c.reason}</div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {Object.keys(app.formData ?? {}).length ? (
            <div className="card p-5">
              <h2 className="mb-4 font-semibold">Ariza formasi</h2>
              {Object.entries(app.formData).map(([k, v]) => (
                <Row key={k} label={k} value={String(v)} />
              ))}
            </div>
          ) : null}

          <div className="card p-5">
            <h2 className="mb-4 font-semibold">Hujjatlar ({app.documents.length})</h2>
            {app.documents.length ? (
              <ul className="space-y-2">
                {app.documents.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
                  >
                    <div>
                      <div>{d.document.fileName}</div>
                      <div className="text-xs text-[var(--color-ink-muted)]">
                        {DOCUMENT_LABEL[d.documentType] ?? d.documentType} · {(d.document.sizeBytes / 1024).toFixed(0)} KB
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip
                        label={d.document.verified ? 'Tasdiqlangan' : 'Tekshiruvda'}
                        tone={d.document.verified ? 'success' : 'warning'}
                      />
                      <button
                        type="button"
                        onClick={() => void openDocument(d.document.url).catch(() => setError('Hujjatni ochib bo‘lmadi'))}
                        className="text-xs text-[var(--color-primary)] hover:underline"
                      >
                        Ochish
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--color-ink-muted)]">Hujjat biriktirilmagan</p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-4 font-semibold">Status tarixi</h2>
            <ol className="space-y-3">
              {app.history.map((h) => (
                <li key={h.id} className="flex gap-3 text-sm">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" />
                  <div>
                    <div className="font-medium">
                      {h.fromStatus ? `${STATUS_LABEL_UZ[h.fromStatus]} → ` : ''}
                      {STATUS_LABEL_UZ[h.toStatus]}
                    </div>
                    <div className="text-xs text-[var(--color-ink-muted)]">
                      {formatDate(h.createdAt)} · {h.actorName}
                      {h.comment ? ` · ${h.comment}` : ''}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* O'ng ustun: harakatlar */}
        <div className="space-y-4">
          {app.rejectionReason || app.correctionNote ? (
            <div
              className="card p-4 text-sm"
              style={{
                borderColor: app.rejectionReason ? 'var(--color-danger)' : 'var(--color-warning)',
              }}
            >
              <div className="mb-1 font-semibold">
                {app.rejectionReason ? 'Rad etish sababi' : 'Tuzatish izohi'}
              </div>
              <p className="text-[var(--color-ink-secondary)]">
                {app.rejectionReason ?? app.correctionNote}
              </p>
            </div>
          ) : null}

          <div className="card p-5">
            <h2 className="mb-4 font-semibold">Statusni o‘zgartirish</h2>

            {allowed.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-muted)]">
                Bu yakuniy holat — o‘zgartirib bo‘lmaydi.
              </p>
            ) : (
              <>
                <label className="label" htmlFor="target">
                  Yangi holat
                </label>
                <select
                  id="target"
                  className="input mb-4"
                  value={target}
                  onChange={(e) => setTarget(e.target.value as ApplicationStatus | '')}
                >
                  <option value="">Tanlang</option>
                  {allowed.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL_UZ[s]}
                    </option>
                  ))}
                </select>

                {reasonRequired ? (
                  <>
                    <label className="label" htmlFor="reason">
                      Sabab (majburiy)
                    </label>
                    <textarea
                      id="reason"
                      className="input mb-4 h-24 py-2"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Masalan: Bank rekvizitlari tasdiqlanmadi."
                    />
                  </>
                ) : null}

                {target === 'APPROVED' ? (
                  <>
                    <label className="label" htmlFor="amount">
                      Tasdiqlangan summa (so‘m)
                    </label>
                    <input
                      id="amount"
                      className="input mb-4"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      placeholder={String(app.requestedAmount ?? '')}
                    />
                  </>
                ) : null}

                <label className="label" htmlFor="comment">
                  Izoh (ixtiyoriy)
                </label>
                <input
                  id="comment"
                  className="input mb-4"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />

                {error ? (
                  <div className="mb-3 rounded-lg border border-[var(--color-danger)] bg-[rgba(248,113,113,0.1)] px-3 py-2 text-xs text-[var(--color-danger)]">
                    {error}
                  </div>
                ) : null}

                <button
                  className="btn btn-primary w-full"
                  disabled={!target || (reasonRequired && !reason.trim()) || changeStatus.isPending}
                  onClick={() => changeStatus.mutate()}
                >
                  {changeStatus.isPending ? 'Bajarilmoqda...' : 'Statusni o‘zgartirish'}
                </button>

                <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
                  Noqonuniy o‘tishlar backend tomonidan rad etiladi va har bir o‘zgarish audit
                  jurnaliga yoziladi.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between py-2.5 text-sm"
      style={{ borderBottom: last ? 'none' : '1px solid var(--color-line)' }}
    >
      <span className="text-[var(--color-ink-muted)]">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
