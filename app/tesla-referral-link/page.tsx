import type { Metadata } from "next";
import { ArrowUpRight, CircleAlert, FileText, Link2, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { CopyReferralButton } from "@/components/CopyReferralButton";
import { JsonLd } from "@/components/JsonLd";
import { ReferralCard } from "@/components/ReferralCard";
import { SectionHeader } from "@/components/SectionHeader";
import { absoluteUrl, dealPath, referralCode, siteUrl, termsUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Tesla Referral Link Nederland 2026 | Hoe Werkt Het & Wat is het Voordeel?",
  description:
    "Alles over de Tesla referral link in Nederland: hoe het werkt, wat het mogelijke voordeel is en hoe u de link correct gebruikt vóór uw bestelling. Gratis, direct naar Tesla.nl.",
  alternates: { canonical: absoluteUrl("/tesla-referral-link") },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Tesla Referral Link", item: absoluteUrl("/tesla-referral-link") },
  ],
};

const referralLinkFaqs = [
  { question: "Wat is een Tesla referral link?", answer: "Een Tesla referral link is een persoonlijke URL die automatisch een buyer benefit koppelt aan uw bestelling, op voorwaarde dat u de link opent vóórdat u bestelt bij Tesla." },
  { question: "Hoe weet ik of de Tesla referral link werkt?", answer: "Controleer in de Tesla checkout of het referral voordeel zichtbaar is nadat u de link geopend heeft. Is het voordeel niet zichtbaar? Open dan de link opnieuw en ga naar Tesla.nl." },
  { question: "Moet ik de referral link code handmatig invoeren?", answer: "Nee. U hoeft geen code over te typen. Klik simpelweg op de deal-link en ga direct naar Tesla. De referral wordt automatisch gekoppeld aan uw sessie." },
  { question: "Verloopt een Tesla referral link?", answer: "Tesla kan het referral programma, de geldigheid van links en de eligibility op elk moment aanpassen. Controleer altijd de actuele Tesla-voorwaarden vóór uw bestelling." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: referralLinkFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function TeslaReferralLinkPage() {
  return (
    <main className="pb-28 pt-28">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200">
              <Link2 className="h-3.5 w-3.5" /> Geldige referral link voor Nederland
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Tesla referral link Nederland — hoe werkt het en wat is het voordeel?
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              Een Tesla referral link koppelt automatisch een potentieel voordeel aan uw bestelling.
              Open de link <strong className="text-white">vóór</strong> uw bestelling, controleer de checkout en lees de officiële Tesla-voorwaarden.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={dealPath}>
                Open Tesla referral link
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </ButtonLink>
              <CopyReferralButton />
            </div>
          </div>
          <ReferralCard />
        </div>
      </section>

      {/* Hoe werkt een referral link */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader title="Hoe werkt een Tesla referral link precies?" />
          <div className="mt-8 space-y-6 text-base leading-8 text-zinc-300">
            <p>
              Een <strong className="text-white">Tesla referral link</strong> is een persoonlijke URL in het formaat <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm font-mono text-red-200">ts.la/[naam]</code>.
              Wanneer u via deze link de Tesla-website bezoekt, koppelt Tesla het referral account automatisch aan uw browsersessie.
            </p>
            <p>
              Als u daarna een eligible Tesla-product bestelt, kan Tesla een buyer benefit tonen in de checkout — zoals <strong className="text-white">2.000 gratis Supercharging kilometers</strong> of <strong className="text-white">€500 korting</strong>.
              U hoeft zelf geen code in te voeren.
            </p>
            <p>
              <strong className="text-white">Belangrijk:</strong> De referral link moet geopend zijn <em>vóórdat</em> uw bestelling is geplaatst.
              Tesla geeft aan dat referral links niet achteraf kunnen worden toegepast.
            </p>
          </div>

          {/* Referral code display */}
          <div className="mt-8 rounded-2xl border border-white/12 bg-white/[0.055] p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Referral code</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-white">{referralCode}</p>
            <p className="mt-2 text-sm text-zinc-400">U hoeft deze code niet handmatig in te voeren. Gebruik de deal-link knop hierboven.</p>
          </div>

          <div className="mt-8 flex gap-4 rounded-2xl border border-red-300/20 bg-red-500/10 p-5">
            <CircleAlert className="mt-1 h-6 w-6 flex-none text-red-200" />
            <p className="text-sm leading-6 text-red-50">
              Referral benefits zijn niet gegarandeerd. Eligibility, beschikbaarheid en het exacte voordeel kunnen wijzigen per datum, model, land en Tesla-account.
              Controleer altijd de actuele voorwaarden bij Tesla.
            </p>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader title="Waarom deze referral link veilig is" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { icon: ShieldCheck, title: "Directe link naar Tesla.nl", body: "De referral link opent de officiële Tesla-website. U bestelt en betaalt uitsluitend bij Tesla zelf." },
              { icon: Link2, title: "Geen handmatige code nodig", body: "U hoeft geen code over te typen. De referral wordt automatisch gekoppeld via de link." },
              { icon: ShieldCheck, title: "Gratis te gebruiken", body: "De referral link kost u niets. Er zijn geen verborgen kosten of verplichtingen." },
              { icon: FileText, title: "Onafhankelijk en transparant", body: "TeslaKortingscode.com is onafhankelijk en niet gesponsord door Tesla, Inc." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.055] p-5">
                <item.icon className="h-5 w-5 text-red-200" />
                <h3 className="mt-3 font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader title="Veelgestelde vragen over de Tesla referral link" />
          <div className="mt-8 space-y-3">
            {referralLinkFaqs.map((faq) => (
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
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <a href="/tesla-kortingscode" className="rounded-xl border border-white/10 bg-white/[0.055] p-4 transition hover:border-red-300/35">
              <p className="font-semibold text-white">Tesla kortingscode →</p>
            </a>
            <a href="/tesla-model-3-referral" className="rounded-xl border border-white/10 bg-white/[0.055] p-4 transition hover:border-red-300/35">
              <p className="font-semibold text-white">Model 3 referral →</p>
            </a>
            <a href="/tesla-model-y-referral" className="rounded-xl border border-white/10 bg-white/[0.055] p-4 transition hover:border-red-300/35">
              <p className="font-semibold text-white">Model Y referral →</p>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
