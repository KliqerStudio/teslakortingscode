import type { Metadata } from "next";
import { ArrowUpRight, CheckCircle2, CircleAlert, FileText } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { CopyReferralButton } from "@/components/CopyReferralButton";
import { JsonLd } from "@/components/JsonLd";
import { ReferralCard } from "@/components/ReferralCard";
import { SectionHeader } from "@/components/SectionHeader";
import { absoluteUrl, dealPath, siteUrl, termsUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Tesla Model Y Referral Nederland 2026 | Kortingscode & Gratis Supercharging",
  description:
    "Bestel een Tesla Model Y via een referral link en ontvang mogelijk 2.000 gratis Supercharging km of €500 korting. Open de link vóór uw bestelling — gratis, direct naar Tesla.nl.",
  alternates: { canonical: absoluteUrl("/tesla-model-y-referral") },
  openGraph: {
    title: "Tesla Model Y Referral 2026 | Gratis Supercharging of €500 Korting",
    description: "Gebruik de Tesla Model Y referral link vóór uw bestelling en ontvang mogelijk extra voordeel bij Tesla.",
    url: absoluteUrl("/tesla-model-y-referral"),
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Tesla Model Y Referral", item: absoluteUrl("/tesla-model-y-referral") },
  ],
};

const modelYFaqs = [
  { question: "Werkt een referral link bij de Tesla Model Y?", answer: "Controleer op Tesla.nl of de Model Y momenteel eligible is voor het referral programma. Open de referral link vóór uw bestelling en bekijk in de checkout of het voordeel zichtbaar is." },
  { question: "Is de Tesla Model Y de meest verkochte Tesla in Nederland?", answer: "De Model Y is inderdaad een van de bestverkopende elektrische auto's in Nederland. Of referral eligibility beschikbaar is, hangt af van Tesla's actuele programma — controleer de officiële Tesla-website." },
  { question: "Kan ik een referral toepassen op een Model Y uit voorraad?", answer: "Dit kan variëren per periode en voorraadmodel. Controleer op Tesla.nl of voorraadmodellen eligible zijn voor referral benefits en of het voordeel zichtbaar is in de checkout." },
  { question: "Wat is het voordeel bij een Tesla Model Y via referral?", answer: "Het mogelijke voordeel is 2.000 gratis Supercharging kilometers of €500 korting, afhankelijk van Tesla's actuele programma. Controleer altijd de actuele Tesla-voorwaarden — geen enkel voordeel is gegarandeerd." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: modelYFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function TeslaModelYReferralPage() {
  return (
    <main className="pb-28 pt-28">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Tesla Model Y · Meest verkocht NL
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Tesla Model Y referral Nederland — mogelijk 2.000 gratis Supercharging km of €500 korting
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Bestel je binnenkort een Tesla Model Y? Open de referral link <strong className="text-white">vóór</strong> uw bestelling,
              controleer het voordeel in de Tesla checkout en lees altijd de officiële Tesla-voorwaarden.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={dealPath}>
                Open Model Y deal-link — gratis
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </ButtonLink>
              <CopyReferralButton />
            </div>
            <p className="mt-4 text-sm text-zinc-500">✓ Gratis &nbsp;·&nbsp; ✓ Direct naar Tesla.nl &nbsp;·&nbsp; ✓ Geen registratie</p>
          </div>
          <ReferralCard />
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader title="Checklist: Tesla Model Y bestellen via referral link" />
          <div className="mt-8 space-y-3">
            {[
              "Open de referral link als eerste stap — vóór uw bestelling op Tesla.nl",
              "Configureer uw Tesla Model Y op de officiële Tesla-website",
              "Controleer in de checkout of het referral voordeel zichtbaar is",
              "Lees de actuele Tesla-voorwaarden vóór u uw bestelling plaatst",
              "Twijfelt u? Neem contact op met Tesla klantenservice voor bevestiging",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.055] p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-red-200" />
                <p className="text-base text-white">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex gap-4 rounded-2xl border border-red-300/20 bg-red-500/10 p-5">
            <CircleAlert className="mt-1 h-6 w-6 flex-none text-red-200" />
            <p className="text-sm leading-6 text-red-50">
              <strong>Belangrijk:</strong> Referral links kunnen <strong>niet achteraf</strong> worden toegepast.
              Open de link vóór uw bestelling en controleer het voordeel in de checkout.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader title="Veelgestelde vragen: Tesla Model Y referral" />
          <div className="mt-8 space-y-3">
            {modelYFaqs.map((faq) => (
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

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">Zie ook</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a href="/tesla-model-3-referral" className="rounded-xl border border-white/10 bg-white/[0.055] p-4 transition hover:border-red-300/35">
              <p className="font-semibold text-white">Tesla Model 3 referral →</p>
              <p className="mt-1 text-sm text-zinc-400">Referral link voor de Tesla Model 3</p>
            </a>
            <a href="/gratis-supercharging" className="rounded-xl border border-white/10 bg-white/[0.055] p-4 transition hover:border-red-300/35">
              <p className="font-semibold text-white">Gratis Supercharging →</p>
              <p className="mt-1 text-sm text-zinc-400">Hoe werkt 2.000 km gratis Supercharging?</p>
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/12 bg-white/[0.075] p-8 text-center">
          <h2 className="text-2xl font-semibold text-white">Bestel uw Tesla Model Y via referral link</h2>
          <p className="mt-3 text-base text-zinc-300">Open de link vóór uw bestelling — gratis, direct naar Tesla.nl.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={dealPath}>Open Model Y deal-link <ArrowUpRight className="ml-2 h-4 w-4" /></ButtonLink>
            <ButtonLink href={termsUrl} external variant="secondary"><FileText className="mr-2 h-4 w-4" /> Tesla voorwaarden</ButtonLink>
          </div>
          <p className="mt-4 text-xs text-zinc-500">TeslaKortingscode.com is onafhankelijk en niet gelieerd aan Tesla, Inc.</p>
        </div>
      </section>
    </main>
  );
}
