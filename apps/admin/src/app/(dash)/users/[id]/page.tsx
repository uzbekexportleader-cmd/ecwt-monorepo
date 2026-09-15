'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { Chip, Loading, PageHeader, formatDate, formatPhone } from '@/lib/ui';

/* ------------------------------- lug'atlar ------------------------------- */

const ACTIVITY: Record<string, string> = {
  HUNARMAND: 'Hunarmand',
  AGRO_HOLDING: 'Agro holding',
  TADBIRKOR: 'Tadbirkor',
  TEXTILE: 'Textile',
  ISHLAB_CHIQARUVCHI: 'Ishlab chiqaruvchi',
};

const GENDER: Record<string, string> = { MALE: 'Erkak', FEMALE: 'Ayol' };

const PAYMENT: Record<string, string> = {
  SUBSIDY: 'Subsidiya orqali',
  SELF: 'O‘zi to‘laydi',
};

const STAGE: Record<string, string> = {
  PERSONAL: 'Shaxsiy ma’lumotlar',
  ADDRESS: 'Manzil',
  ACTIVITY_TYPE: 'Faoliyat turi',
  ACTIVITY_DETAILS: 'Faoliyat tafsilotlari',
  SERVICES: 'Xizmatlar',
  BANK: 'Bank',
  PAYMENT: 'To‘lov usuli',
  CONTRACT: 'Shartnoma',
  DONE: 'Tugagan',
};

const VERIFICATION: Record<string, { label: string; tone: 'neutral' | 'info' | 'success' | 'danger' }> = {
  NOT_STARTED: { label: 'Tasdiqlanmagan', tone: 'neutral' },
  PENDING: { label: 'Tekshirilmoqda', tone: 'info' },
  VERIFIED: { label: 'Tasdiqlangan', tone: 'success' },
  FAILED: { label: 'Tasdiqlanmadi', tone: 'danger' },
};

const DOCUMENT: Record<string, string> = {
  PASSPORT: 'Pasport / ID karta',
  MEMBERSHIP_CERTIFICATE: 'A’zolik guvohnomasi',
  BUSINESS_REGISTRATION: 'Tadbirkorlik guvohnomasi',
  BANK_DETAILS: 'Bank rekvizitlari',
  CONTRACT: 'Shartnoma',
  SIGNED_CONTRACT: 'Imzolangan shartnoma',
  INVOICE: 'Hisob-faktura',
  RECEIPT: 'Kvitansiya',
  PRODUCT_PHOTO: 'Mahsulot fotosi',
  SELFIE: 'Yuz surati',
  WORKSHOP_PHOTO: 'Ustaxona fotosi',
  CERTIFICATE: 'Sertifikat',
  OTHER: 'Boshqa hujjat',
};

const MARKETPLACE: Record<string, string> = {
  amazon: 'Amazon',
  ebay: 'eBay',
  walmart: 'Walmart',
  tiktok_shop: 'TikTok Shop',
  poshmark: 'Poshmark',
  mercari: 'Mercari',
  bonanza: 'Bonanza',
  facebook_marketplace: 'Facebook Marketplace',
};

/* -------------------------------- turlar --------------------------------- */

interface Profile {
  completionPercent: number;
  onboardingStage: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  birthDate: string | null;
  gender: string | null;
  pinfl: string | null;
  passportSeries: string | null;
  passportNumber: string | null;
  region: string | null;
  district: string | null;
  mahalla: string | null;
  street: string | null;
  houseNumber: string | null;
  contactPhone: string | null;
  activityType: string | null;
  craft: string | null;
  yearsOfExperience: number | null;
  businessType: string;
  stir: string | null;
  membershipStatus: string;
  membershipNumber: string | null;
  description: string | null;
  selectedMarketplaces: string[];
  wantsBrandSite: boolean;
  wantsDropshipping: boolean;
  wantsChinaImport: boolean;
  paymentMethod: string | null;
  bankAccount: string | null;
  bankMfo: string | null;
  bankName: string | null;
  bankSwift: string | null;
  bankHolderName: string | null;
  identityVerification: string;
  faceVerification: string;
  businessVerification: string;
  membershipVerification: string;
  bankVerification: string;
  contractSignedAt: string | null;
}

interface UserCard {
  id: string;
  phone: string;
  fullName: string | null;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  applicationsCount: number;
  productsCount: number;
  profile: Profile | null;
  documents: {
    id: string;
    type: string;
    fileName: string;
    sizeBytes: number;
    verified: boolean;
    createdAt: string;
  }[];
}

/* ------------------------------ komponentlar ----------------------------- */

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--color-border)] py-2 last:border-0">
      <span className="text-sm text-[var(--color-ink-muted)]">{label}</span>
      <span className="text-right text-sm font-medium">{value ?? '—'}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
        {title}
      </h2>
      {children}
    </div>
  );
}

/**
 * Hunarmandning to'liq kartochkasi.
 *
 * Ro'yxatdan o'tishning 10 qadamida to'plangan hamma narsa bitta ekranda:
 * shaxsiy ma'lumot, manzil, faoliyat, tanlangan xizmat, bank rekvizitlari,
 * yuklangan hujjatlar va tekshiruv holatlari.
 */
export default function UserCardPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const query = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => api.admin.userCard(id) as Promise<unknown>,
    enabled: Boolean(id),
  });

  const user = query.data as UserCard | undefined;
  const p = user?.profile ?? null;

  const services = p
    ? [
        p.wantsBrandSite ? 'Shopify + Shaxsiy mahsulot' : null,
        p.wantsDropshipping ? 'Shopify + Dropshipping' : null,
        p.wantsChinaImport ? 'Shaxsiy sayt + Xitoy mahsulotlari' : null,
      ].filter(Boolean)
    : [];

  const address = p
    ? [p.region, p.district, p.mahalla, p.street, p.houseNumber].filter(Boolean).join(', ')
    : '';

  return (
    <>
      <div className="mb-4">
        <Link className="text-sm text-[var(--color-primary)] hover:underline" href="/users">
          ← Foydalanuvchilar
        </Link>
      </div>

      <PageHeader
        title={user?.fullName ?? 'Hunarmand kartochkasi'}
        subtitle={user ? formatPhone(user.phone) : undefined}
      />

      {query.isLoading ? <Loading /> : null}

      {query.isError ? (
        <div className="card p-4 text-sm text-[var(--color-danger)]">
          Ma’lumotni yuklab bo‘lmadi.
        </div>
      ) : null}

      {user && !p ? (
        <div className="card p-4 text-sm text-[var(--color-ink-muted)]">
          Bu foydalanuvchi hali profil to‘ldirmagan.
        </div>
      ) : null}

      {p ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Section title="Holat">
            <Row label="Bosqich" value={STAGE[p.onboardingStage] ?? p.onboardingStage} />
            <Row label="Profil to‘ldirilgan" value={`${p.completionPercent}%`} />
            <Row label="Ro‘yxatdan o‘tgan" value={formatDate(user!.createdAt)} />
            <Row
              label="Oxirgi kirish"
              value={user!.lastLoginAt ? formatDate(user!.lastLoginAt) : '—'}
            />
            <Row label="Arizalar" value={user!.applicationsCount} />
          </Section>

          <Section title="Shaxsiy ma’lumotlar">
            <Row label="Familiya" value={p.lastName} />
            <Row label="Ism" value={p.firstName} />
            <Row label="Otasining ismi" value={p.middleName} />
            <Row label="Tug‘ilgan sana" value={p.birthDate} />
            <Row label="Jinsi" value={p.gender ? GENDER[p.gender] : null} />
            <Row label="JShShIR" value={p.pinfl} />
            <Row
              label="Pasport"
              value={
                p.passportSeries || p.passportNumber
                  ? `${p.passportSeries ?? ''} ${p.passportNumber ?? ''}`.trim()
                  : null
              }
            />
          </Section>

          <Section title="Manzil va aloqa">
            <Row label="Viloyat" value={p.region} />
            <Row label="Tuman" value={p.district} />
            <Row label="Mahalla" value={p.mahalla} />
            <Row label="Ko‘cha" value={p.street} />
            <Row label="Uy raqami" value={p.houseNumber} />
            <Row
              label="Aloqa telefoni"
              value={p.contactPhone ? formatPhone(p.contactPhone) : null}
            />
            <Row label="To‘liq manzil" value={address || null} />
          </Section>

          <Section title="Faoliyat">
            <Row
              label="Faoliyat turi"
              value={p.activityType ? (ACTIVITY[p.activityType] ?? p.activityType) : null}
            />
            <Row label="Hunar yo‘nalishi" value={p.craft} />
            <Row
              label="Tajriba"
              value={p.yearsOfExperience !== null ? `${p.yearsOfExperience} yil` : null}
            />
            <Row label="Tadbirkorlik shakli" value={p.businessType} />
            <Row label="STIR" value={p.stir} />
            <Row label="Uyushma a’zoligi" value={p.membershipStatus} />
            <Row label="A’zolik raqami" value={p.membershipNumber} />
          </Section>

          <Section title="Tanlangan xizmat">
            <Row
              label="Marketplace"
              value={
                p.selectedMarketplaces.length
                  ? p.selectedMarketplaces
                      .map((code) => MARKETPLACE[code] ?? code)
                      .join(', ')
                  : null
              }
            />
            <Row label="Qo‘shimcha xizmat" value={services.length ? services.join(', ') : null} />
            <Row
              label="To‘lov usuli"
              value={p.paymentMethod ? (PAYMENT[p.paymentMethod] ?? p.paymentMethod) : null}
            />
            <Row
              label="Shartnoma imzolangan"
              value={p.contractSignedAt ? formatDate(p.contractSignedAt) : '—'}
            />
          </Section>

          <Section title="Bank rekvizitlari">
            <Row label="Hisob raqami" value={p.bankAccount} />
            <Row label="Bank nomi" value={p.bankName} />
            <Row label="MFO" value={p.bankMfo} />
            <Row label="SWIFT" value={p.bankSwift} />
            <Row label="Hisob egasi" value={p.bankHolderName} />
          </Section>

          <Section title="Tasdiqlash holati">
            {(
              [
                ['Shaxs', p.identityVerification],
                ['Yuz', p.faceVerification],
                ['Tadbirkorlik', p.businessVerification],
                ['A’zolik', p.membershipVerification],
                ['Bank', p.bankVerification],
              ] as const
            ).map(([label, status]) => {
              const v = VERIFICATION[status] ?? { label: status, tone: 'neutral' as const };
              return <Row key={label} label={label} value={<Chip label={v.label} tone={v.tone} />} />;
            })}
          </Section>

          <Section title={`Hujjatlar (${user!.documents.length})`}>
            {user!.documents.length ? (
              user!.documents.map((d) => (
                <Row
                  key={d.id}
                  label={DOCUMENT[d.type] ?? d.type}
                  value={
                    <span className="flex items-center gap-2">
                      <span className="text-[var(--color-ink-muted)]">
                        {(d.sizeBytes / 1024).toFixed(0)} KB
                      </span>
                      <Chip
                        label={d.verified ? 'Tasdiqlangan' : 'Tekshirilmagan'}
                        tone={d.verified ? 'success' : 'neutral'}
                      />
                    </span>
                  }
                />
              ))
            ) : (
              <p className="text-sm text-[var(--color-ink-muted)]">Hujjat yuklanmagan</p>
            )}
          </Section>
        </div>
      ) : null}
    </>
  );
}
