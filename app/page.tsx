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
import { absoluteUrl, dealPath, siteUrl, termsUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Tesla Kortingscode 2026 | Referral Link voor Gratis Supercharging of €500",
  description:
    "Ontvang mogelijk 2.000 gratis Supercharging kilometers of €500 Tesla korting. Gebruik onze gratis referral link vóór uw bestelling. Snel, gratis, direct naar Tesla.nl.",
  alternates: {
    canonical: absoluteUrl("/"),
    languages: {
      "nl": absoluteUrl("/"),
      "en": absoluteUrl("/en")
    }
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

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl
    }
  ]
};

export default function HomePage() {
  return (
    <main id="top" className="overflow-hidden pb-28">
      <JsonLd data={faqJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      {/* ── HERO ── */}
      <section className="relative min-h-screen px-4 pb-28 pt-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-20">
          <Image
            src="/images/ev-hero.png"
            alt="Tesla elektrische auto op de snelweg"
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
            {/* Trust badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Gratis te gebruiken · Direct naar Tesla.nl
            </div>

            <h1 className="max-w-[22rem] break-words text-balance text-4xl font-semibold leading-[1.05] tracking-normal text-white sm:max-w-5xl sm:text-5xl lg:text-[3.25rem] xl:text-6xl">
              {heroCopy.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-200 sm:text-xl">{heroCopy.subtitle}</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={dealPath} className="sm:min-w-60">
                Claim Tesla kortingscode
                <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <CopyReferralButton />
            </div>

            <p className="mt-5 text-sm font-medium text-zinc-400">
              ✓ Gratis &nbsp;·&nbsp; ✓ Geen registratie &nbsp;·&nbsp; ✓ Direct naar officiële Tesla-website
            </p>
          </div>

          <div className="reveal min-w-0 lg:pt-8" style={{ animationDelay: "120ms" }}>
            <ReferralCard />
          </div>
        </div>
      </section>

      {/* ── WARNING BANNER ── */}
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="glass reveal rounded-[2rem] p-5 sm:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <div className="grid h-12 w-12 flex-none place-items-center rounded-full bg-red-500/15 text-red-100">
                <CircleAlert className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">⚠️ Belangrijk: open de link vóór uw bestelling</h2>
                <p className="mt-3 text-lg leading-8 text-zinc-200">
                  Tesla referral kortingscodes kunnen <strong className="text-white">niet achteraf</strong> worden toegevoegd.
                  Open daarom eerst de Tesla deal-link en controleer of het voordeel zichtbaar is in de checkout — voordat u uw order plaatst.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOE HET WERKT ── */}
      <section id="hoe-het-werkt" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Hoe gebruik je de Tesla kortingscode referral link?"
            description="Volg deze 5 stappen om de Tesla referral benefit correct toe te passen vóór uw bestelling."
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
          <div className="mt-8 text-center">
            <ButtonLink href={dealPath}>
              Stap 1: Open Tesla deal-link nu
              <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── VOORDEEL ── */}
      <section id="voordeel" className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 -z-10 mx-auto h-72 max-w-5xl rounded-full bg-red-500/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <SectionHeader title="Wat is het mogelijke Tesla referral voordeel?" />
            <div className="mt-8 flex gap-3 rounded-3xl border border-red-300/20 bg-red-500/10 p-5 text-red-50">
              <Zap className="mt-1 h-6 w-6 flex-none" aria-hidden="true" />
              <p className="text-base leading-7">
                <strong>2.000 gratis Supercharging kilometers</strong> of <strong>€500 korting</strong> — afhankelijk van Tesla's actuele programma.
                Controleer altijd de officiële Tesla-voorwaarden vóór uw bestelling.
              </p>
            </div>
          </div>
          <div className="glass rounded-[2rem] p-6 sm:p-8">
            <p className="text-xl font-semibold leading-9 text-white">
              De actuele Tesla kortingscode benefit kan "2.000 Free Supercharging km" of "€500 off" zijn —
              afhankelijk van Tesla's lopende referral programma.
            </p>
            <p className="mt-5 text-base leading-8 text-zinc-300">
              Het voordeel kan per model, land, datum en Tesla-programma verschillen. Controleer de actuele
              voorwaarden bij Tesla en kijk in de checkout of het voordeel zichtbaar is vóór uw bestelling.
            </p>
            <ButtonLink href={termsUrl} external variant="ghost" className="mt-6">
              <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
              Lees officiële Tesla referral voorwaarden
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── VERTROUWEN ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Waarom TeslaKortingscode.com?"
            description="We helpen u de Tesla referral link correct te gebruiken. Gratis, transparant, direct naar Tesla.nl."
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

      {/* ── MODELLEN ── */}
      <section id="modellen" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Tesla referral kortingscode per model"
            description="Controleer per model op Tesla.nl of de referral benefit van toepassing is op uw specifieke bestelling."
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
                <div className="mt-1 inline-block rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-200">
                  {model.badge}
                </div>
                <p className="mt-20 text-sm leading-6 text-zinc-300">{model.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <SectionHeader
              title="Veelgestelde vragen over de Tesla kortingscode"
              description="Alles wat u moet weten over Tesla referral links, voordelen en hoe u de kortingscode correct gebruikt."
            />
            <ButtonLink href="/veelgestelde-vragen" variant="secondary" className="mt-8">
              Bekijk alle FAQ
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

      {/* ── BLOG ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Actueel over Tesla in Nederland"
            description="Diepgaande gidsen over Tesla FSD, referral programma's, RDW-goedkeuring en de nieuwste modellen."
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
            Bekijk alle artikelen
          </ButtonLink>
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/12 bg-white/[0.075] p-7 text-center shadow-panel backdrop-blur-2xl sm:p-10">
          <CheckCircle2 className="mx-auto h-10 w-10 text-red-200" aria-hidden="true" />
          <h2 className="mt-5 text-3xl font-semibold text-white sm:text-5xl">
            Klaar om uw Tesla kortingscode te gebruiken?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-300">
            Open de gratis Tesla referral link, controleer de actuele benefit in de checkout en lees de officiële voorwaarden.
            Helemaal gratis — u betaalt uitsluitend bij Tesla zelf.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={dealPath}>
              Claim Tesla kortingscode — gratis
              <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href={termsUrl} external variant="secondary">
              Lees Tesla voorwaarden
            </ButtonLink>
          </div>
          <p className="mt-5 text-xs text-zinc-500">
            ✓ Gratis · ✓ Geen account vereist · ✓ Direct naar officiële Tesla-website
          </p>
        </div>
      </section>
    </main>
  );
}
