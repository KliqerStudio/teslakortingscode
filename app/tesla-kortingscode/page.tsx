import type { Metadata } from "next";
import { ArrowUpRight, CheckCircle2, CircleAlert, FileText, Zap } from "lucide-react";

import { ButtonLink } from "@/components/ButtonLink";
import { CopyReferralButton } from "@/components/CopyReferralButton";
import { JsonLd } from "@/components/JsonLd";
import { ReferralCard } from "@/components/ReferralCard";
import { SectionHeader } from "@/components/SectionHeader";
import { faqs } from "@/data/content";
import { absoluteUrl, dealPath, siteUrl, termsUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Tesla Kortingscode 2026 | Gebruik Referral Link voor Supercharging of €500",
  description:
    "Ontvang mogelijk 2.000 gratis Supercharging kilometers of €500 korting met een geldige Tesla kortingscode. Open de gratis referral link vóór uw bestelling — direct naar Tesla.nl.",
  alternates: { canonical: absoluteUrl("/tesla-kortingscode") },
  openGraph: {
    title: "Tesla Kortingscode 2026 | Gratis Supercharging of €500 Korting",
    description: "Gebruik de gratis Tesla kortingscode referral link vóór uw bestelling en ontvang mogelijk extra voordeel.",
    url: absoluteUrl("/tesla-kortingscode"),
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Tesla Kortingscode", item: absoluteUrl("/tesla-kortingscode") },
  ],
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Tesla kortingscode: hoe werkt het en wat is het voordeel?",
  description: "Uitleg over hoe een Tesla kortingscode (referral link) werkt, wat het mogelijke voordeel is en hoe u de link correct gebruikt vóór uw bestelling.",
  url: absoluteUrl("/tesla-kortingscode"),
  publisher: { "@type": "Organization", name: "TeslaKortingscode.com", url: siteUrl },
  datePublished: "2026-04-29",
  dateModified: "2026-04-29",
};

export default function TeslaKortingscode() {
  return (
    <main className="pb-28 pt-28">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={articleJsonLd} />

      {/* Hero */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Gratis · Geen registratie · Direct naar Tesla.nl
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Tesla kortingscode: mogelijk 2.000 gratis Supercharging km of €500 voordeel
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Een Tesla kortingscode werkt via een persoonlijke referral link. Open de link <strong className="text-white">vóór</strong> uw bestelling,
              controleer het voordeel in de checkout en lees altijd de officiële Tesla-voorwaarden.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={dealPath}>
                Gebruik Tesla kortingscode — gratis
                <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <CopyReferralButton />
            </div>
            <p className="mt-4 text-sm text-zinc-500">✓ Gratis &nbsp;·&nbsp; ✓ Geen account nodig &nbsp;·&nbsp; ✓ Direct naar Tesla.nl</p>
          </div>
          <ReferralCard />
        </div>
      </section>

      {/* Wat is een Tesla kortingscode? */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader title="Wat is een Tesla kortingscode?" />
          <div className="mt-8 space-y-6 text-base leading-8 text-zinc-300">
            <p>
              Een <strong className="text-white">Tesla kortingscode</strong> is geen traditionele kortingscode die u handmatig invoert tijdens het afrekenen.
              In plaats daarvan werkt Tesla via een <strong className="text-white">referral link</strong>: een persoonlijke link die het voordeel automatisch koppelt
              aan uw bestelling, op voorwaarde dat u de link <em>opent vóórdat</em> u bestelt.
            </p>
            <p>
              Wanneer u via een geldige referral link een eligible Tesla-product bestelt, kan Tesla volgens de actuele voorwaarden een buyer benefit tonen —
              zoals <strong className="text-white">2.000 gratis Supercharging kilometers</strong> of <strong className="text-white">€500 korting</strong>.
              Controleer altijd de actuele Tesla-voorwaarden, want eligibility, beschikbaarheid en het exacte voordeel kunnen per datum, model en account variëren.
            </p>
            <p>
              Let op: Tesla geeft expliciet aan dat referral links <strong className="text-white">niet achteraf</strong> kunnen worden toegevoegd nadat een bestelling is geplaatst.
              Gebruik de link dus altijd als eerste stap in uw bestelproces.
            </p>
          </div>

          {/* Warning */}
          <div className="mt-8 flex gap-4 rounded-2xl border border-red-300/20 bg-red-500/10 p-5">
            <CircleAlert className="mt-1 h-6 w-6 flex-none text-red-200" aria-hidden="true" />
            <p className="text-base leading-7 text-red-50">
              <strong>Belangrijk:</strong> Open de Tesla kortingscode link altijd <strong>vóór</strong> uw bestelling.
              Controleer in de Tesla checkout of het voordeel zichtbaar is. Kan het voordeel niet worden bevestigd? Lees dan de officiële Tesla-voorwaarden voordat u verdergaat.
            </p>
          </div>
        </div>
      </section>

      {/* Hoe werkt het */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader title="Hoe gebruik je de Tesla kortingscode in 3 stappen?" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { step: "1", title: "Open de deal-link", body: "Klik op 'Gebruik Tesla kortingscode' op deze pagina. De link opent de officiële Tesla-website met uw referral gekoppeld." },
              { step: "2", title: "Configureer uw Tesla", body: "Kies uw Tesla op Tesla.nl en controleer of het referral voordeel zichtbaar is in de checkout, vóórdat u uw bestelling bevestigt." },
              { step: "3", title: "Controleer en bestel", body: "Is het voordeel zichtbaar? Lees de voorwaarden en rond dan pas uw bestelling af bij Tesla." },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-white/10 bg-white/[0.055] p-6">
                <div className="mb-4 text-3xl font-bold text-red-200">{item.step}</div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Voordeel */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white/[0.055] p-8">
          <Zap className="h-8 w-8 text-red-200" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-semibold text-white">Wat is het mogelijke voordeel van een Tesla kortingscode?</h2>
          <p className="mt-4 text-base leading-7 text-zinc-300">
            Afhankelijk van Tesla's actuele referral programma kan het voordeel zijn:
          </p>
          <ul className="mt-4 space-y-2 text-base text-zinc-300">
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-1 h-4 w-4 flex-none text-red-200" /><span><strong className="text-white">2.000 gratis Supercharging kilometers</strong> — geldig op eligible Tesla-modellen</span></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-1 h-4 w-4 flex-none text-red-200" /><span><strong className="text-white">€500 korting</strong> — afhankelijk van Tesla's lopende programma</span></li>
          </ul>
          <p className="mt-6 text-sm leading-6 text-zinc-400">
            Geen enkel voordeel is gegarandeerd. Beschikbaarheid, eligibility en de exacte benefit kunnen wijzigen per land, datum, Tesla-account en model.
            Controleer altijd de actuele voorwaarden op de officiële Tesla-website.
          </p>
          <ButtonLink href={termsUrl} external variant="ghost" className="mt-6">
            <FileText className="mr-2 h-4 w-4" />
            Lees officiële Tesla referral voorwaarden
          </ButtonLink>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader title="Veelgestelde vragen over de Tesla kortingscode" />
          <div className="mt-8 space-y-3">
            {faqs.slice(0, 6).map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-white/10 bg-white/[0.055] p-5">
                <summary className="cursor-pointer list-none font-semibold text-white">
                  <span className="flex items-center justify-between gap-4">
                    {faq.question}
                    <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-white/8 text-zinc-300 transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-zinc-300">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/12 bg-white/[0.075] p-8 text-center">
          <h2 className="text-2xl font-semibold text-white">Klaar om de Tesla kortingscode te gebruiken?</h2>
          <p className="mt-3 text-base text-zinc-300">Open de gratis referral link vóór uw bestelling — het kost niets.</p>
          <ButtonLink href={dealPath} className="mt-6">
            Gebruik Tesla kortingscode — gratis
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </ButtonLink>
          <p className="mt-4 text-xs text-zinc-500">
            TeslaKortingscode.com is onafhankelijk en niet gelieerd aan Tesla, Inc.
          </p>
        </div>
      </section>
    </main>
  );
}
