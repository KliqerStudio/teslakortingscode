import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Privacyverklaring voor deze onafhankelijke Tesla dealgids. De site verzamelt geen persoonlijke gegevens zonder aanvullende analytics of formulieren.",
  alternates: {
    canonical: absoluteUrl("/privacy")
  }
};

export default function PrivacyPage() {
  return (
    <main className="pb-28 pt-28">
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-semibold text-white sm:text-6xl">Privacy</h1>
          <div className="mt-8 space-y-6 text-base leading-8 text-zinc-300">
            <p>
              Deze website is een eenvoudige statische dealgids. Er worden geen formulieren aangeboden en de site
              vraagt bezoekers niet om persoonlijke gegevens.
            </p>
            <p>
              Als er later analytics, tracking, cookies of contactformulieren worden toegevoegd, moet deze privacyverklaring
              worden bijgewerkt voordat die functies live gaan.
            </p>
            <p>
              Wanneer u op de deal-link of de voorwaardenlink klikt, verlaat u deze website en gaat u naar Tesla’s
              officiële website. Tesla’s eigen privacybeleid en voorwaarden zijn dan van toepassing.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
