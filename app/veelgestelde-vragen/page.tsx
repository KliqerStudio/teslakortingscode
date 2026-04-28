import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";

import { ButtonLink } from "@/components/ButtonLink";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { faqs } from "@/data/content";
import { absoluteUrl, dealPath, siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Veelgestelde Vragen Tesla Kortingscode & Referral | FAQ",
  description:
    "Antwoorden op alle vragen over de Tesla kortingscode en referral link in Nederland. Hoe werkt het? Werkt het in België? Wat is het voordeel?",
  alternates: {
    canonical: absoluteUrl("/veelgestelde-vragen")
  }
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer }
  }))
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Veelgestelde Vragen", item: absoluteUrl("/veelgestelde-vragen") }
  ]
};

export default function VeelgesteldeVragenPage() {
  return (
    <main className="pb-28 pt-28">
      <JsonLd data={faqJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader
            title="Veelgestelde vragen over de Tesla kortingscode"
            description="Alles wat u moet weten over Tesla referral links, kortingscodes en hoe u het voordeel correct gebruikt in Nederland."
          />
          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-white/10 bg-white/[0.055] p-6">
                <summary className="cursor-pointer list-none text-base font-semibold text-white">
                  <span className="flex items-center justify-between gap-4">
                    {faq.question}
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-white/8 text-zinc-300 transition group-open:rotate-45 group-open:text-red-100">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-zinc-300">{faq.answer}</p>
              </details>
            ))}
          </div>

          <div className="mt-14 rounded-[2rem] border border-white/12 bg-white/[0.075] p-7 text-center">
            <h2 className="text-2xl font-semibold text-white">Klaar om uw Tesla kortingscode te gebruiken?</h2>
            <p className="mt-3 text-base text-zinc-300">Open de gratis Tesla deal-link vóór uw bestelling.</p>
            <ButtonLink href={dealPath} className="mt-6">
              Claim Tesla kortingscode — gratis
              <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}
