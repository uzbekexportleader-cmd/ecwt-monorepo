import {
  ArrowRight,
  BadgeCheck,
  Ban,
  Boxes,
  FileText,
  Globe2,
  Languages,
  LineChart,
  Package,
  Send,
  ShieldCheck,
  Truck,
  Wallet,
} from 'lucide-react';
import { MARKETPLACE_LABELS, type Locale } from '@ecwt/contracts';
import { getDictionary, isLocale } from '@/i18n';
import { getCurrentUser } from '@/lib/session';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { LeadForm } from '@/components/marketing/LeadForm';
import { WorldMap } from '@/components/marketing/WorldMap';
import { ButtonLink } from '@/components/ui/Button';
import { CONTACTS } from '@/lib/contacts';
import { notFound } from 'next/navigation';
import Link from 'next/link';

/** Marketplace holati — sayt uchun statik ro'yxat */
const MARKETPLACE_STATUS = [
  { key: 'AMAZON_US', active: true },
  { key: 'ETSY', active: true },
  { key: 'EBAY', active: false },
  { key: 'WALMART', active: false },
  { key: 'SHOPIFY', active: false },
  { key: 'TIKTOK_SHOP', active: false },
] as const;

const PROBLEM_ICONS = [FileText, Wallet, Truck, Languages];
const SERVICE_ICONS = [BadgeCheck, Globe2, Truck, Package, LineChart, Wallet];

export default async function InfoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const user = await getCurrentUser();

  return (
    <>
      <Header locale={locale} dict={dict} isAuthenticated={Boolean(user)} />

      <main>
        {/* ---------------------------------------------------------- Hero
            Hero'da ataylab bitta gap qoldirilgan. Uzun tavsif, nishon va
            raqamlar pastga ko'chirildi: birinchi ekranda ko'z bitta
            sarlavhaga va bitta tugmaga tushishi kerak. */}
        <section className="relative overflow-hidden bg-brand-950">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <WorldMap
              className="h-full w-full text-brand-800"
              fromLabel={dict.hero.mapFrom}
              toLabel={dict.hero.mapTo}
            />
          </div>

          {/* Xarita ustidagi yengil parda — sarlavha kontrasti uchun */}
          <div className="absolute inset-0 bg-brand-950/45" aria-hidden="true" />

          <div className="container-page relative py-24 sm:py-32 lg:py-40">
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              {dict.hero.title}
            </h1>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <ButtonLink href={`/${locale}/register`} variant="secondary" size="lg">
                {dict.hero.ctaPrimary}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>

              <Link
                href={`/${locale}#how-it-works`}
                className="text-sm font-medium text-brand-200 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                {dict.hero.ctaSecondary}
              </Link>
            </div>
          </div>

          {/* Marketplace tasmasi — "qayerda sotiladi" savoliga darhol javob */}
          <div className="relative border-t border-white/10 bg-brand-950/70">
            <div className="container-page py-7">
              <p className="text-xs font-medium uppercase tracking-wider text-brand-400">
                {dict.hero.marketplacesLabel}
              </p>

              <ul className="mt-4 flex flex-wrap items-center gap-x-9 gap-y-3">
                {MARKETPLACE_STATUS.map(({ key, active }) => (
                  <li
                    key={key}
                    className={
                      active
                        ? 'text-lg font-semibold tracking-tight text-white'
                        : 'text-lg font-semibold tracking-tight text-brand-600'
                    }
                  >
                    {MARKETPLACE_LABELS[key]}
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-xs text-brand-500">{dict.hero.marketplacesNote}</p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- Raqamlar */}
        <section className="border-b border-brand-100 bg-white">
          <div className="container-page">
            <dl className="grid grid-cols-3 gap-6 py-9">
              <div>
                <dt className="text-2xl font-bold text-brand-950 sm:text-3xl">6</dt>
                <dd className="mt-1 text-xs text-brand-500">{dict.hero.stats.marketplaces}</dd>
              </div>
              <div>
                <dt className="text-2xl font-bold text-brand-950 sm:text-3xl">2+</dt>
                <dd className="mt-1 text-xs text-brand-500">{dict.hero.stats.suppliers}</dd>
              </div>
              <div>
                <dt className="text-2xl font-bold text-brand-950 sm:text-3xl">$1.1T</dt>
                <dd className="mt-1 text-xs text-brand-500">{dict.hero.stats.market}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ------------------------------------------------------- Muammo */}
        <section className="bg-brand-50 py-20">
          <div className="container-page">
            <SectionHeading title={dict.problem.title} subtitle={dict.problem.subtitle} />

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {dict.problem.items.map((item, index) => {
                const Icon = PROBLEM_ICONS[index] ?? Ban;
                return (
                  <div
                    key={item.title}
                    className="rounded-card border border-brand-100 bg-white p-6 shadow-sm"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-brand-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-600">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ Xizmatlar */}
        <section id="services" className="scroll-mt-20 py-20">
          <div className="container-page">
            <SectionHeading title={dict.services.title} subtitle={dict.services.subtitle} />

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {dict.services.items.map((item, index) => {
                const Icon = SERVICE_ICONS[index] ?? Boxes;
                return (
                  <div
                    key={item.title}
                    className="rounded-card border border-brand-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-700 text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-brand-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-600">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- Qanday ishlaydi */}
        <section id="how-it-works" className="scroll-mt-20 bg-brand-950 py-20">
          <div className="container-page">
            <SectionHeading
              title={dict.howItWorks.title}
              subtitle={dict.howItWorks.subtitle}
              dark
            />

            <ol className="mt-12 grid gap-6 md:grid-cols-3 lg:grid-cols-5">
              {dict.howItWorks.steps.map((step, index) => (
                <li key={step.title} className="relative">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-400 text-base font-bold text-brand-950">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-300">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* --------------------------------------------------- Marketplace'lar */}
        <section id="marketplaces" className="scroll-mt-20 py-20">
          <div className="container-page">
            <SectionHeading title={dict.marketplaces.title} subtitle={dict.marketplaces.subtitle} />

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MARKETPLACE_STATUS.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-card border border-brand-100 bg-white px-6 py-5 shadow-sm"
                >
                  <span className="text-base font-semibold text-brand-950">
                    {MARKETPLACE_LABELS[item.key]}
                  </span>
                  <span
                    className={
                      item.active
                        ? 'inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800'
                        : 'inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-600'
                    }
                  >
                    <span
                      className={
                        item.active
                          ? 'h-1.5 w-1.5 rounded-full bg-emerald-500'
                          : 'h-1.5 w-1.5 rounded-full bg-brand-400'
                      }
                      aria-hidden="true"
                    />
                    {item.active ? dict.marketplaces.active : dict.marketplaces.planned}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- Narxlar */}
        <section id="pricing" className="scroll-mt-20 bg-brand-50 py-20">
          <div className="container-page">
            <SectionHeading title={dict.pricing.title} subtitle={dict.pricing.subtitle} />

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {dict.pricing.plans.map((plan) => (
                <div
                  key={plan.name}
                  className={
                    plan.popular
                      ? 'relative rounded-card border-2 border-brand-700 bg-white p-7 shadow-lg'
                      : 'rounded-card border border-brand-100 bg-white p-7 shadow-sm'
                  }
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-7 rounded-full bg-brand-700 px-3 py-1 text-xs font-semibold text-white">
                      ★
                    </span>
                  )}

                  <h3 className="text-lg font-bold text-brand-950">{plan.name}</h3>
                  <p className="mt-1 text-sm text-brand-500">{plan.forWho}</p>

                  <p className="mt-5 text-4xl font-bold tracking-tight text-brand-800">
                    {plan.commission}
                  </p>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-brand-700">
                        <BadgeCheck
                          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                          aria-hidden="true"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <ButtonLink
                    href={`/${locale}#contact`}
                    variant={plan.popular ? 'primary' : 'outline'}
                    className="mt-7 w-full"
                  >
                    {dict.pricing.cta}
                  </ButtonLink>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-sm text-brand-500">{dict.pricing.note}</p>
          </div>
        </section>

        {/* ------------------------------------------------------ Biz haqimizda */}
        <section id="about" className="scroll-mt-20 py-20">
          <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-brand-950">
                {dict.about.title}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-brand-600">{dict.about.body}</p>

              <h3 className="mt-8 text-lg font-semibold text-brand-950">
                {dict.about.mission.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-brand-600">
                {dict.about.mission.body}
              </p>
            </div>

            <div className="grid gap-4">
              {dict.about.values.map((value) => (
                <div
                  key={value.title}
                  className="flex gap-4 rounded-card border border-brand-100 bg-white p-6 shadow-sm"
                >
                  <ShieldCheck className="h-6 w-6 shrink-0 text-brand-700" aria-hidden="true" />
                  <div>
                    <h4 className="text-base font-semibold text-brand-950">{value.title}</h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-brand-600">{value.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------- Aloqa */}
        <section id="contact" className="scroll-mt-20 bg-brand-50 py-20">
          <div className="container-page grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold tracking-tight text-brand-950">
                {dict.contact.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-brand-600">
                {dict.contact.subtitle}
              </p>

              <dl className="mt-8 space-y-5">
                <ContactRow label={dict.contact.direct.phone}>
                  <a
                    href={`tel:${CONTACTS.phone.replace(/\s/g, '')}`}
                    className="font-medium text-brand-800 hover:underline"
                  >
                    {CONTACTS.phone}
                  </a>
                </ContactRow>
                <ContactRow label={dict.contact.direct.email}>
                  <a
                    href={`mailto:${CONTACTS.email}`}
                    className="font-medium text-brand-800 hover:underline"
                  >
                    {CONTACTS.email}
                  </a>
                </ContactRow>
                <ContactRow label={dict.contact.direct.telegram}>
                  <a
                    href={`https://t.me/${CONTACTS.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-brand-800 hover:underline"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                    {CONTACTS.telegram}
                  </a>
                </ContactRow>
                <ContactRow label={dict.contact.direct.hours}>
                  <span className="text-brand-700">{dict.contact.direct.hoursValue}</span>
                </ContactRow>
              </dl>
            </div>

            <div className="rounded-card border border-brand-100 bg-white p-7 shadow-sm lg:col-span-3">
              <LeadForm dict={dict} locale={locale} />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- CTA */}
        <section className="bg-brand-800 py-16">
          <div className="container-page text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white">{dict.cta.title}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-brand-200">
              {dict.cta.body}
            </p>
            <ButtonLink
              href={`/${locale}#contact`}
              variant="secondary"
              size="lg"
              className="mt-8"
            >
              {dict.cta.button}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </section>
      </main>

      <Footer locale={locale} dict={dict} />
    </>
  );
}

function SectionHeading({
  title,
  subtitle,
  dark = false,
}: {
  title: string;
  subtitle: string;
  dark?: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2
        className={
          dark
            ? 'text-3xl font-bold tracking-tight text-white sm:text-4xl'
            : 'text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl'
        }
      >
        {title}
      </h2>
      <p className={dark ? 'mt-4 text-base text-brand-300' : 'mt-4 text-base text-brand-600'}>
        {subtitle}
      </p>
    </div>
  );
}

function ContactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-brand-400">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}
