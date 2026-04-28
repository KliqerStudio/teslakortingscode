import type { Metadata } from "next";

import { ButtonLink } from "@/components/ButtonLink";
import { JsonLd } from "@/components/JsonLd";
import { faqsEn } from "@/data/content-en";
import { absoluteUrl, dealPath, termsUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "FAQ",
  description: "FAQ about Tesla deal links, referral benefits, Supercharging kilometers, €500 benefit and official terms.",
  alternates: {
    canonical: absoluteUrl("/en/faq")
  }
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqsEn.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer
    }
  }))
};

export default function EnglishFaqPage() {
  return (
    <main className="pb-28 pt-28">
      <JsonLd data={faqJsonLd} />
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-6xl">
            FAQ about Tesla coupons and referral benefits
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-300">
            Answers for Tesla shoppers who want to check deal links before ordering.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={dealPath}>
              Open Tesla deal
            </ButtonLink>
            <ButtonLink href={termsUrl} external variant="secondary">
              Read Tesla terms
            </ButtonLink>
          </div>
        </div>
      </section>
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-4">
          {faqsEn.map((faq) => (
            <article key={faq.question} className="rounded-3xl border border-white/10 bg-white/[0.055] p-6">
              <h2 className="text-xl font-semibold text-white">{faq.question}</h2>
              <p className="mt-4 text-base leading-8 text-zinc-300">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
