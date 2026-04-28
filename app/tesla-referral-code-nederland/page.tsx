import type { Metadata } from "next";
import { ArrowUpRight, CircleAlert, Copy, FileText } from "lucide-react";

import { ButtonLink } from "@/components/ButtonLink";
import { CopyReferralButton } from "@/components/CopyReferralButton";
import { JsonLd } from "@/components/JsonLd";
import { ReferralCard } from "@/components/ReferralCard";
import { SectionHeader } from "@/components/SectionHeader";
import { faqs, models, steps } from "@/data/content";
import { absoluteUrl, dealPath, siteUrl, termsUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Tesla Referral Code Nederland 2026 | Kortingscode & Gratis Supercharging",
  description:
    "Gebruik de Tesla referral code voor Nederland en ontvang mogelijk 2.000 gratis Supercharging kilometers of €500 korting. Open de link vóór uw bestelling — gratis, direct naar Tesla.nl.",
  alternates: {
    canonical: absoluteUrl("/tesla-referral-code-nederland")
  },
  openGraph: {
    title: "Tesla Referral Code Nederland 2026 | Kortingscode & Gratis Supercharging",
    description:
      "Ontvang mogelijk 2.000 gratis Supercharging km of €500 Tesla korting. Open de gratis referral link vóór uw bestelling.",
    url: absoluteUrl("/tesla-referral-code-nederland")
  }
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Tesla Referral Code Nederland", item: absoluteUrl("/tesla-referral-code-nederland") }
  ]
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.slice(0, 5).map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer }
  }))
};

export default function TeslaReferralCodeNederlandPage() {
  return (
    <main className="pb-28 pt-28">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            {/* Trust badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Gratis · Geen registratie · Direct naar Tesla.nl
            </div>

            <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
              Tesla referral code Nederland 2026 — mogelijk 2.000 gratis Supercharging km of €500 korting
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Gebruik de gratis Tesla kortingscode referral link vóórdat u bestelt. Controleer in Tesla's checkout of
              de benefit zichtbaar is en lees altijd de officiële Tesla-voorwaarden.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={dealPath}>
                Claim Tesla kortingscode — gratis
                <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <CopyReferralButton />
            </div>
            <p className="mt-4 text-sm text-zinc-500">✓ Gratis &nbsp;·&nbsp; ✓ Geen account &nbsp;·&nbsp; ✓ Direct naar Tesla.nl</p>
          </div>
          <ReferralCard />
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-red-300/20 bg-red-500/10 p-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <CircleAlert className="h-7 w-7 flex-none text-red-100" aria-hidden="true" />
            <p className="text-lg leading-8 text-red-50">
              <strong>Belangrijk:</strong> Tesla referral kortingscodes kunnen <strong>niet achteraf</strong> worden toegepast na uw bestelling.
              Open de link dus vóór uw order en controleer of het voordeel zichtbaar is in de checkout.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Tesla referral kortingscode gebruiken in Nederland — stap voor stap"
            description="Volg deze volgorde zodat u de Tesla kortingscode benefit niet misloopt tijdens het bestellen."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {steps.map((step, index) => (
              <div key={step} className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
                <p className="text-sm font-semibold text-red-200">Stap {index + 1}</p>
                <p className="mt-5 text-sm leading-6 text-zinc-200">{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <ButtonLink href={dealPath}>
              Claim nu gratis Tesla kortingscode
              <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <div className="glass rounded-[2rem] p-7">
            <Copy className="h-7 w-7 text-red-200" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-semibold text-white">Geen code overtypen nodig</h2>
            <p className="mt-4 text-base leading-7 text-zinc-300">
              U hoeft geen zichtbare Tesla kortingscode of URL over te typen. Klik op de deal-knop, ga direct naar
              Tesla.nl en controleer of het referral voordeel in de officiële checkout zichtbaar is.
            </p>
          </div>
          <div className="glass rounded-[2rem] p-7">
            <FileText className="h-7 w-7 text-red-200" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-semibold text-white">Altijd voorwaarden controleren</h2>
            <p className="mt-4 text-base leading-7 text-zinc-300">
              Tesla kan het referral-programma en de benefits wijzigen. Controleer de officiële Tesla-voorwaarden en
              de checkout voordat u uw bestelling plaatst.
            </p>
            <ButtonLink href={termsUrl} external variant="ghost" className="mt-6">
              Lees officiële Tesla referral voorwaarden
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Tesla kortingscode voor Model 3, Model Y, Model S en Model X"
            description="Controleer per model op Tesla.nl of de referral kortingscode van toepassing is op uw bestelling."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {models.map((model) => (
              <article key={model.name} className="rounded-3xl border border-white/10 bg-white/[0.055] p-6">
                <p className="text-sm font-semibold text-zinc-500">Tesla</p>
                <h3 className="mt-1 text-2xl font-semibold text-white">{model.name}</h3>
                <div className="mt-1 inline-block rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-200">
                  {model.badge}
                </div>
                <p className="mt-4 text-sm leading-6 text-zinc-300">{model.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader title="Veelgestelde vragen over Tesla kortingscode en referral voordelen" />
          <div className="mt-8 space-y-3">
            {faqs.slice(0, 5).map((faq) => (
              <details key={faq.question} className="rounded-2xl border border-white/10 bg-white/[0.055] p-5">
                <summary className="cursor-pointer list-none font-semibold text-white">{faq.question}</summary>
                <p className="mt-4 text-sm leading-7 text-zinc-300">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
