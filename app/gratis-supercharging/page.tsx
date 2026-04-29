import type { Metadata } from "next";
import { ArrowUpRight, CircleAlert, FileText, MapPin, Zap } from "lucide-react";

import { ButtonLink } from "@/components/ButtonLink";
import { CopyReferralButton } from "@/components/CopyReferralButton";
import { JsonLd } from "@/components/JsonLd";
import { ReferralCard } from "@/components/ReferralCard";
import { SectionHeader } from "@/components/SectionHeader";
import { absoluteUrl, dealPath, siteUrl, termsUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Tesla Gratis Supercharging via Referral Link | 2.000 km Mogelijk",
  description:
    "Ontvang mogelijk 2.000 gratis Supercharging kilometers bij uw nieuwe Tesla via een referral link. Controleer altijd de actuele Tesla-voorwaarden. Open de link vóór uw bestelling.",
  alternates: { canonical: absoluteUrl("/gratis-supercharging") },
  openGraph: {
    title: "Tesla Gratis Supercharging 2026 | 2.000 km via Referral Link",
    description: "Mogelijk 2.000 gratis Supercharging kilometers bij nieuwe Tesla via referral link. Open link vóór bestelling, controleer bij Tesla.",
    url: absoluteUrl("/gratis-supercharging"),
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Gratis Supercharging", item: absoluteUrl("/gratis-supercharging") },
  ],
};

const superchargingFaqs = [
  { question: "Hoe krijg ik gratis Supercharging bij Tesla?", answer: "Via een geldige Tesla referral link kunt u mogelijk 2.000 gratis Supercharging kilometers ontvangen. Open de link vóór uw bestelling en controleer in de checkout of het voordeel zichtbaar is." },
  { question: "Hoeveel zijn 2.000 gratis Supercharging kilometers waard?", answer: "De exacte waarde varieert per tarief en locatie. Supercharging kost gemiddeld €0,30–0,45 per kWh in Nederland. 2.000 km Supercharging vertegenwoordigt een significante besparing, afhankelijk van uw rijgedrag." },
  { question: "Kan ik gratis Supercharging achteraf aanvragen?", answer: "Nee. Referral links — en daarmee het gratis Supercharging voordeel — kunnen niet achteraf worden toegepast. Open de link altijd vóór uw bestelling." },
  { question: "Zijn de 2.000 gratis Supercharging kilometers gegarandeerd?", answer: "Nee. Tesla kan de referral benefits, eligibility en het programma op elk moment wijzigen. Controleer altijd de actuele voorwaarden op de officiële Tesla-website vóór uw bestelling." },
  { question: "Voor welke Tesla-modellen geldt gratis Supercharging via referral?", answer: "Controleer op Tesla.nl per model of het referral Supercharging voordeel van toepassing is. Tesla past eligibility per model, regio en periode aan." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: superchargingFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function GratisSuperchargingPage() {
  return (
    <main className="pb-28 pt-28">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />

      {/* Hero */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200">
              <Zap className="h-3.5 w-3.5" />
              Mogelijk 2.000 km gratis Supercharging
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Tesla gratis Supercharging via referral link — mogelijk 2.000 km
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Bestel je binnenkort een Tesla? Via een geldige referral link kunt u mogelijk <strong className="text-white">2.000 gratis Supercharging kilometers</strong> ontvangen.
              Open de link <strong className="text-white">vóór</strong> uw bestelling en controleer altijd het actuele voordeel bij Tesla.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={dealPath}>
                Ontvang mogelijk gratis Supercharging
                <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <CopyReferralButton />
            </div>
            <p className="mt-4 text-sm text-zinc-500">✓ Gratis &nbsp;·&nbsp; ✓ Geen registratie &nbsp;·&nbsp; ✓ Controleer zelf bij Tesla</p>
          </div>
          <ReferralCard />
        </div>
      </section>

      {/* Wat is Supercharging */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader title="Wat is Tesla Supercharging?" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-6">
              <Zap className="h-6 w-6 text-red-200" />
              <h3 className="mt-4 text-lg font-semibold text-white">Snel opladen onderweg</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                Tesla Superchargers zijn snellaadstations verspreid door heel Europa. Met een Model 3 of Model Y laadt u in 15–25 minuten
                voldoende op voor honderden kilometers rijbereik.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-6">
              <MapPin className="h-6 w-6 text-red-200" />
              <h3 className="mt-4 text-lg font-semibold text-white">Superchargers in Nederland</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                Nederland heeft een uitgebreid Supercharger-netwerk langs snelwegen en in steden. Via de Tesla-app of in-car navigatie
                vindt u de dichtstbijzijnde locaties eenvoudig.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hoe werkt gratis supercharging via referral */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader title="Hoe werkt 2.000 gratis Supercharging via een referral link?" />
          <div className="mt-8 space-y-6 text-base leading-8 text-zinc-300">
            <p>
              Tesla biedt via het referral programma soms een <strong className="text-white">gratis Supercharging voordeel</strong> aan kopers die een nieuwe Tesla bestellen
              via een geldige referral link. Het voordeel wordt automatisch gekoppeld aan uw account wanneer u de link opent vóórdat u bestelt.
            </p>
            <p>
              Wanneer het voordeel actief is, ontvangt u <strong className="text-white">2.000 gratis Supercharging kilometers</strong> die u kunt gebruiken bij Tesla
              Supercharger-stations. Dit vertegenwoordigt een aanzienlijke besparing op laadkosten.
            </p>
          </div>

          {/* Warning */}
          <div className="mt-8 flex gap-4 rounded-2xl border border-red-300/20 bg-red-500/10 p-5">
            <CircleAlert className="mt-1 h-6 w-6 flex-none text-red-200" />
            <div>
              <p className="font-semibold text-red-100">Controleer altijd de actuele Tesla-voorwaarden</p>
              <p className="mt-2 text-sm leading-6 text-red-200">
                2.000 gratis Supercharging kilometers zijn niet gegarandeerd. Tesla kan het referral programma, de eligibility per model,
                en het exacte voordeel op elk moment aanpassen. Controleer de checkout en de officiële Tesla-voorwaarden vóór uw bestelling.
              </p>
            </div>
          </div>

          <ButtonLink href={termsUrl} external variant="ghost" className="mt-6">
            <FileText className="mr-2 h-4 w-4" />
            Lees officiële Tesla referral voorwaarden
          </ButtonLink>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader title="Veelgestelde vragen over gratis Supercharging" />
          <div className="mt-8 space-y-3">
            {superchargingFaqs.map((faq) => (
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

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/12 bg-white/[0.075] p-8 text-center">
          <Zap className="mx-auto h-10 w-10 text-red-200" />
          <h2 className="mt-5 text-2xl font-semibold text-white">Ontvang mogelijk gratis Supercharging</h2>
          <p className="mt-3 text-base text-zinc-300">Open de gratis referral link vóór uw Tesla-bestelling. Controleer zelf bij Tesla of het voordeel actief is.</p>
          <ButtonLink href={dealPath} className="mt-6">
            Open Tesla deal-link — gratis
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </ButtonLink>
          <p className="mt-4 text-xs text-zinc-500">TeslaKortingscode.com is onafhankelijk en niet gelieerd aan Tesla, Inc.</p>
        </div>
      </section>
    </main>
  );
}
