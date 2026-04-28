import type { Metadata } from "next";

import { ButtonLink } from "@/components/ButtonLink";
import { absoluteUrl, dealPath, legalDisclaimerEn, termsUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Disclaimer for this independent Tesla deals guide.",
  alternates: {
    canonical: absoluteUrl("/en/disclaimer")
  }
};

export default function EnglishDisclaimerPage() {
  return (
    <main className="pb-28 pt-28">
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-semibold text-white sm:text-6xl">Disclaimer</h1>
          <div className="mt-8 space-y-6 text-base leading-8 text-zinc-300">
            <p>{legalDisclaimerEn}</p>
            <p>
              This website provides practical information about Tesla discounts, deal links and referral benefits. It is
              not legal, financial or official Tesla advice. Tesla’s own website, terms and checkout are always leading.
            </p>
          </div>
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
    </main>
  );
}
