import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, CheckCircle2, CircleAlert, FileText, Route, Zap } from "lucide-react";

import { ButtonLink } from "@/components/ButtonLink";
import { CopyReferralButton } from "@/components/CopyReferralButton";
import { JsonLd } from "@/components/JsonLd";
import { ReferralCard } from "@/components/ReferralCard";
import { SectionHeader } from "@/components/SectionHeader";
import { blogPosts } from "@/data/blogs";
import { faqs, heroCopy, models, steps, trustItems } from "@/data/content";
import { absoluteUrl, dealPath, termsUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  alternates: {
    canonical: absoluteUrl("/")
  }
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer
    }
  }))
};

export default function HomePage() {
  return (
    <main id="top" className="overflow-hidden pb-28">
      <JsonLd data={faqJsonLd} />
      <section className="relative min-h-screen px-4 pb-28 pt-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-20">
          <Image
            src="/images/ev-hero.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-44"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#050608_0%,rgba(5,6,8,0.88)_36%,rgba(5,6,8,0.35)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,8,0.12)_0%,#050608_94%)]" />
        </div>
        <div className="route-grid absolute inset-x-0 top-16 -z-10 h-[32rem] opacity-40" />
        <div className="mx-auto grid max-w-7xl items-start gap-10 lg:min-h-[calc(100vh-8rem)] lg:grid-cols-[1.08fr_0.92fr]">
          <div className="reveal min-w-0 max-w-[22rem] sm:max-w-4xl">
            <h1 className="max-w-[22rem] break-words text-balance text-4xl font-semibold leading-[1.05] tracking-normal text-white sm:max-w-5xl sm:text-5xl lg:text-[3.25rem] xl:text-6xl">
              {heroCopy.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-200 sm:text-xl">{heroCopy.subtitle}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={dealPath} className="sm:min-w-60">
                Open Tesla deal
                <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <CopyReferralButton />
            </div>
            <p className="mt-5 text-sm font-medium text-zinc-300">
              Geen code overtypen: open de deal-link vóórdat u bestelt en controleer de benefit bij Tesla.
            </p>
          </div>
          <div className="reveal min-w-0 lg:pt-8" style={{ animationDelay: "120ms" }}>
            <ReferralCard />
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
                <h2 className="text-2xl font-semibold text-white">Let op voordat u bestelt</h2>
                <p className="mt-3 text-lg leading-8 text-zinc-200">
                  Volgens Tesla kunnen referral-links niet worden toegepast nadat uw bestelling is geplaatst. Open
                  daarom eerst de deal-link en controleer tijdens het bestellen of het voordeel zichtbaar is.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="hoe-het-werkt" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Zo gebruikt u de Tesla deal-link correct"
            description="De belangrijkste stap is de volgorde: eerst de deal-link openen, daarna pas bestellen via Tesla."
          />
          <div className="mt-10 grid gap-4 lg:grid-cols-5">
            {steps.map((step, index) => (
              <div
                key={step}
                className="reveal rounded-3xl border border-white/10 bg-white/[0.055] p-5 transition hover:-translate-y-1 hover:border-red-300/35 hover:bg-white/[0.075]"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="mb-8 flex items-center justify-between">
                  <span className="text-sm font-semibold text-red-200">Stap {index + 1}</span>
                  <Route className="h-5 w-5 text-zinc-500" aria-hidden="true" />
                </div>
                <p className="text-base font-medium leading-7 text-white">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="voordeel" className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 -z-10 mx-auto h-72 max-w-5xl rounded-full bg-red-500/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <SectionHeader title="Wat is het mogelijke voordeel?" />
            <div className="mt-8 flex gap-3 rounded-3xl border border-red-300/20 bg-red-500/10 p-5 text-red-50">
              <Zap className="mt-1 h-6 w-6 flex-none" aria-hidden="true" />
              <p className="text-base leading-7">
                Een actuele Tesla referral benefit kan 2.000 gratis Supercharging kilometers of €500 voordeel tonen.
                Controleer altijd de officiële Tesla voorwaarden voordat u bestelt.
              </p>
            </div>
          </div>
          <div className="glass rounded-[2rem] p-6 sm:p-8">
            <p className="text-xl font-semibold leading-9 text-white">
              Een Tesla referral-aanbieding kan worden weergegeven als “2.000 Free Supercharging kilometers” of
              “€500 off”, afhankelijk van Tesla’s actuele programma.
            </p>
            <p className="mt-5 text-base leading-8 text-zinc-300">
              Dit kan per model, land, datum en Tesla-programma verschillen. Controleer daarom altijd de actuele
              voorwaarden bij Tesla en kijk in de checkout of het voordeel zichtbaar is voordat u uw bestelling plaatst.
            </p>
            <ButtonLink href={termsUrl} external variant="ghost" className="mt-6">
              <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
              Lees officiële Tesla voorwaarden
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Gebouwd voor vertrouwen, niet voor druk"
            description="Deze pagina helpt u controleren wat u doet voordat u bestelt. De bestelling zelf loopt altijd via Tesla."
            align="center"
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trustItems.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.055] p-6">
                <item.icon className="h-6 w-6 text-red-200" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="modellen" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Tesla modellen en referral controle"
            description="Tesla kan eligibility aanpassen. Controleer daarom per model op Tesla.nl of het referral voordeel geldt."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {models.map((model) => (
              <article
                key={model.name}
                className="group relative min-h-64 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-6 transition hover:-translate-y-1 hover:border-red-300/35"
              >
                <div className="absolute inset-x-6 top-16 h-px bg-gradient-to-r from-transparent via-red-200/60 to-transparent" />
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-red-500/10 blur-2xl transition group-hover:bg-red-500/20" />
                <p className="text-sm font-semibold text-zinc-500">Tesla</p>
                <h3 className="mt-2 text-3xl font-semibold text-white">{model.name}</h3>
                <p className="mt-24 text-sm leading-6 text-zinc-300">{model.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <SectionHeader
              title="Veelgestelde vragen"
              description="Korte antwoorden voor mensen die vóór hun Tesla-bestelling referral informatie zoeken."
            />
            <ButtonLink href="/veelgestelde-vragen" variant="secondary" className="mt-8">
              Bekijk uitgebreide FAQ
            </ButtonLink>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-white/10 bg-white/[0.055] p-5">
                <summary className="cursor-pointer list-none text-base font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
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
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Actueel over Tesla FSD in Nederland"
            description="Diepgaande gidsen over Full Self-Driving (Supervised), RDW-goedkeuring, kosten en Europese beschikbaarheid."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {blogPosts.slice(0, 4).map((post) => (
              <a
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 transition hover:-translate-y-1 hover:border-red-300/35"
              >
                <p className="text-sm font-semibold text-red-200">{post.readingTime}</p>
                <h3 className="mt-4 text-2xl font-semibold leading-tight text-white">{post.title}</h3>
                <p className="mt-4 text-sm leading-6 text-zinc-300">{post.description}</p>
              </a>
            ))}
          </div>
          <ButtonLink href="/blog" variant="secondary" className="mt-8">
            Bekijk alle FSD artikelen
          </ButtonLink>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/12 bg-white/[0.075] p-7 text-center shadow-panel backdrop-blur-2xl sm:p-10">
          <CheckCircle2 className="mx-auto h-10 w-10 text-red-200" aria-hidden="true" />
          <h2 className="mt-5 text-3xl font-semibold text-white sm:text-5xl">Klaar om uw Tesla te bestellen?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-300">
            Open eerst de deal-link, controleer de actuele benefit bij Tesla en lees de officiële voorwaarden voordat
            u de order afrondt.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={dealPath}>
              Open Tesla deal
              <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href={termsUrl} external variant="secondary">
              Lees Tesla voorwaarden
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}
