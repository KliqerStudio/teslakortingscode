import type { Metadata } from "next";

import { ButtonLink } from "@/components/ButtonLink";
import { absoluteUrl, dealPath, legalDisclaimerNl, termsUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Disclaimer voor deze onafhankelijke Tesla referral gids. Niet gelieerd aan, goedgekeurd door of gesponsord door Tesla, Inc.",
  alternates: {
    canonical: absoluteUrl("/disclaimer")
  }
};

export default function DisclaimerPage() {
  return (
    <main className="pb-28 pt-28">
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-semibold text-white sm:text-6xl">Disclaimer</h1>
          <div className="mt-8 space-y-6 text-base leading-8 text-zinc-300">
            <p>{legalDisclaimerNl}</p>
            <p>
              Deze website geeft praktische informatie over Tesla korting, deal-links en referral voordelen. De inhoud is geen
              juridisch, financieel of officieel Tesla-advies. Tesla’s eigen website, voorwaarden en checkout zijn altijd
              leidend.
            </p>
            <p>
              De genoemde referral benefits, zoals 2.000 gratis Supercharging kilometers of €500 voordeel, zijn
              afhankelijk van Tesla’s actuele programma, land, product, account en datum. Controleer altijd of het
              voordeel zichtbaar is voordat u een bestelling plaatst.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={dealPath}>
              Open Tesla deal
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
