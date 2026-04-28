import type { Metadata } from "next";
import { ArrowUpRight, CircleAlert, Copy, FileText } from "lucide-react";

import { ButtonLink } from "@/components/ButtonLink";
import { CopyReferralButton } from "@/components/CopyReferralButton";
import { ReferralCard } from "@/components/ReferralCard";
import { SectionHeader } from "@/components/SectionHeader";
import { faqs, models, steps } from "@/data/content";
import { absoluteUrl, dealPath, termsUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Tesla kortingscode Nederland",
  description:
    "Zo gebruikt u een Tesla deal-link in Nederland. Open de link vóór uw bestelling en controleer het actuele Tesla voordeel.",
  alternates: {
    canonical: absoluteUrl("/tesla-referral-code-nederland")
  },
  openGraph: {
    title: "Tesla kortingscode Nederland",
    description:
      "Open de Tesla deal-link voor Nederland en controleer altijd de officiële Tesla voorwaarden voordat u bestelt.",
    url: absoluteUrl("/tesla-referral-code-nederland")
  }
};

export default function TeslaReferralCodeNederlandPage() {
  return (
    <main className="pb-28 pt-28">
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
              Tesla kortingscode Nederland: controleer uw deal vóór de bestelling
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Zoekt u Tesla korting of een referral voordeel in Nederland? Open de deal-link voordat u bestelt,
              controleer in Tesla’s checkout of het voordeel zichtbaar is en lees altijd de officiële voorwaarden.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={dealPath}>
                Open Tesla deal
                <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <CopyReferralButton />
            </div>
          </div>
          <ReferralCard />
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-red-300/20 bg-red-500/10 p-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <CircleAlert className="h-7 w-7 flex-none text-red-100" aria-hidden="true" />
            <p className="text-lg leading-8 text-red-50">
              Tesla geeft aan dat referral-links niet achteraf kunnen worden toegepast. Gebruik de link dus voordat u
              bestelt en controleer of het referral voordeel zichtbaar is voordat u de order plaatst.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Tesla deal-link Nederland gebruiken"
            description="Deze volgorde voorkomt dat u de referral stap mist tijdens het bestellen."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {steps.map((step, index) => (
              <div key={step} className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
                <p className="text-sm font-semibold text-red-200">Stap {index + 1}</p>
                <p className="mt-5 text-sm leading-6 text-zinc-200">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <div className="glass rounded-[2rem] p-7">
            <Copy className="h-7 w-7 text-red-200" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-semibold text-white">Deal-link zonder handmatig overtypen</h2>
            <p className="mt-4 text-base leading-7 text-zinc-300">
              U hoeft geen zichtbare code of ruwe URL over te typen. Gebruik de actieknop, ga direct naar Tesla en
              controleer of het actuele voordeel in de officiële checkout zichtbaar is.
            </p>
          </div>
          <div className="glass rounded-[2rem] p-7">
            <FileText className="h-7 w-7 text-red-200" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-semibold text-white">Altijd voorwaarden controleren</h2>
            <p className="mt-4 text-base leading-7 text-zinc-300">
              Tesla kan het referral-programma, eligible producten en buyer benefits wijzigen. Controleer daarom de
              officiële voorwaarden en de checkout voordat u bestelt.
            </p>
            <ButtonLink href={termsUrl} external variant="ghost" className="mt-6">
              Lees Tesla voorwaarden
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title="Model 3, Model Y, Model S en Model X" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {models.map((model) => (
              <article key={model.name} className="rounded-3xl border border-white/10 bg-white/[0.055] p-6">
                <h3 className="text-2xl font-semibold text-white">{model.name}</h3>
                <p className="mt-4 text-sm leading-6 text-zinc-300">{model.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader title="Veelgestelde vragen over Tesla korting en referral voordelen" />
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
