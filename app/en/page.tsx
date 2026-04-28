import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, CheckCircle2, CircleAlert, FileText, Route, Zap } from "lucide-react";

import { ButtonLink } from "@/components/ButtonLink";
import { CopyReferralButton } from "@/components/CopyReferralButton";
import { JsonLd } from "@/components/JsonLd";
import { ReferralCard } from "@/components/ReferralCard";
import { SectionHeader } from "@/components/SectionHeader";
import { faqsEn, heroCopyEn, modelsEn, stepsEn } from "@/data/content-en";
import { absoluteUrl, dealPath, termsUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Tesla coupon Europe",
  description:
    "Open the Tesla deal link before ordering and verify the current referral benefit, Supercharging kilometers or discount on Tesla’s official website.",
  alternates: {
    canonical: absoluteUrl("/en"),
    languages: {
      nl: absoluteUrl("/"),
      en: absoluteUrl("/en")
    }
  },
  openGraph: {
    title: "Tesla coupon and referral benefit guide",
    description: "A neutral guide for checking Tesla referral benefits before ordering in Europe.",
    url: absoluteUrl("/en")
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

export default function EnglishHomePage() {
  return (
    <main id="top" className="overflow-hidden pb-28">
      <JsonLd data={faqJsonLd} />
      <section className="relative min-h-screen px-4 pb-28 pt-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-20">
          <Image src="/images/ev-hero.png" alt="" fill priority sizes="100vw" className="object-cover opacity-44" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#050608_0%,rgba(5,6,8,0.88)_36%,rgba(5,6,8,0.35)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,8,0.12)_0%,#050608_94%)]" />
        </div>
        <div className="route-grid absolute inset-x-0 top-16 -z-10 h-[32rem] opacity-40" />
        <div className="mx-auto grid max-w-7xl items-start gap-10 lg:min-h-[calc(100vh-8rem)] lg:grid-cols-[1.08fr_0.92fr]">
          <div className="reveal min-w-0 max-w-[22rem] sm:max-w-4xl">
            <h1 className="max-w-[22rem] break-words text-balance text-4xl font-semibold leading-[1.05] tracking-normal text-white sm:max-w-5xl sm:text-5xl lg:text-[3.25rem] xl:text-6xl">
              {heroCopyEn.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-200 sm:text-xl">{heroCopyEn.subtitle}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={dealPath} className="sm:min-w-60">
                Open Tesla deal
                <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <CopyReferralButton />
            </div>
            <p className="mt-5 text-sm font-medium text-zinc-300">
              No code typing required: open the deal link before ordering and verify the benefit at Tesla.
            </p>
          </div>
          <div className="reveal min-w-0 lg:pt-8" style={{ animationDelay: "120ms" }}>
            <ReferralCard locale="en" />
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="glass reveal rounded-[2rem] p-5 sm:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <div className="grid h-12 w-12 flex-none place-items-center rounded-full bg-red-500/15 text-red-100">
                <CircleAlert className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Important before ordering</h2>
                <p className="mt-3 text-lg leading-8 text-zinc-200">
                  Tesla says referral links cannot be applied after an order has been placed. Open the deal link first
                  and check during checkout whether the benefit is visible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="How to use the Tesla deal link correctly"
            description="The sequence matters: open the deal link first, then order through Tesla."
          />
          <div className="mt-10 grid gap-4 lg:grid-cols-5">
            {stepsEn.map((step, index) => (
              <div key={step} className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
                <div className="mb-8 flex items-center justify-between">
                  <span className="text-sm font-semibold text-red-200">Step {index + 1}</span>
                  <Route className="h-5 w-5 text-zinc-500" aria-hidden="true" />
                </div>
                <p className="text-base font-medium leading-7 text-white">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="benefit" className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <SectionHeader title="What benefit may be available?" />
            <div className="mt-8 flex gap-3 rounded-3xl border border-red-300/20 bg-red-500/10 p-5 text-red-50">
              <Zap className="mt-1 h-6 w-6 flex-none" aria-hidden="true" />
              <p className="text-base leading-7">
                A current Tesla referral benefit may show 2,000 free Supercharging kilometers or €500 benefit. Always
                verify the official Tesla terms before ordering.
              </p>
            </div>
          </div>
          <div className="glass rounded-[2rem] p-6 sm:p-8">
            <p className="text-xl font-semibold leading-9 text-white">
              Tesla referral benefits can vary by model, country, date and program.
            </p>
            <p className="mt-5 text-base leading-8 text-zinc-300">
              Check Tesla’s official terms and make sure the benefit is visible in checkout before completing your
              order. Do not treat any benefit as guaranteed.
            </p>
            <ButtonLink href={termsUrl} external variant="ghost" className="mt-6">
              <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
              Read official Tesla terms
            </ButtonLink>
          </div>
        </div>
      </section>

      <section id="models" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Tesla models and referral eligibility"
            description="Tesla can change eligibility. Check Tesla’s website for each model before ordering."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {modelsEn.map((model) => (
              <article key={model.name} className="rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-6">
                <p className="text-sm font-semibold text-zinc-500">Tesla</p>
                <h3 className="mt-2 text-3xl font-semibold text-white">{model.name}</h3>
                <p className="mt-16 text-sm leading-6 text-zinc-300">{model.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <SectionHeader title="Frequently asked questions" description="Short answers for Tesla shoppers in Europe." />
            <ButtonLink href="/en/faq" variant="secondary" className="mt-8">
              View full FAQ
            </ButtonLink>
          </div>
          <div className="space-y-3">
            {faqsEn.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-white/10 bg-white/[0.055] p-5">
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
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/12 bg-white/[0.075] p-7 text-center shadow-panel backdrop-blur-2xl sm:p-10">
          <CheckCircle2 className="mx-auto h-10 w-10 text-red-200" aria-hidden="true" />
          <h2 className="mt-5 text-3xl font-semibold text-white sm:text-5xl">Ready to order your Tesla?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-300">
            Open the deal link first, verify the current benefit at Tesla and read the official terms before completing
            your order.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={dealPath}>
              Open Tesla deal
              <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href={termsUrl} external variant="secondary">
              Read Tesla terms
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}
