import { ArrowUpRight, FileText, Link2 } from "lucide-react";

import { referralActions } from "@/data/content";
import { dealPath, termsUrl } from "@/lib/site";

import { ButtonLink } from "./ButtonLink";
import { CopyReferralButton } from "./CopyReferralButton";

type ReferralCardProps = {
  locale?: "nl" | "en";
};

export function ReferralCard({ locale = "nl" }: ReferralCardProps) {
  const isEnglish = locale === "en";
  const actions = isEnglish
    ? [
        {
          icon: Link2,
          title: "Tesla deal link",
          text: "Open the secure Tesla link and verify the visible buyer benefit at checkout."
        },
        {
          icon: referralActions[1].icon,
          title: "Potential benefit",
          text: "2,000 free Supercharging kilometers or €500 benefit, depending on Tesla’s current terms."
        },
        {
          icon: referralActions[2].icon,
          title: "Ordering path",
          text: "Open the link before placing your order and check the benefit on Tesla’s checkout page."
        }
      ]
    : referralActions;

  return (
    <section
      aria-labelledby="referral-card-title"
      className="relative min-w-0 overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.075] p-5 shadow-panel backdrop-blur-2xl sm:p-6"
    >
      <div className="absolute -right-24 -top-24 h-52 w-52 rounded-full bg-red-500/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="referral-card-title" className="text-xl font-semibold text-white">
              {isEnglish ? "Tesla deal link" : "Tesla deal-link"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {isEnglish
                ? "Open the Tesla link before ordering and verify the visible benefit at checkout."
                : "Open deze link vóór uw bestelling en controleer het zichtbare voordeel bij Tesla."}
            </p>
          </div>
          <div className="rounded-full border border-red-300/30 bg-red-500/15 p-3 text-red-100">
            <Link2 className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/12 bg-graphite-950/65 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {isEnglish ? "Official checkout" : "Officiële checkout"}
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {isEnglish ? "Open Tesla and check the active offer" : "Open Tesla en controleer de actuele aanbieding"}
          </p>
          <p className="mt-3 text-sm text-zinc-400">
            {isEnglish
              ? "The raw referral URL is not displayed on this page."
              : "De ruwe referral-URL wordt niet zichtbaar op deze pagina getoond."}
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ButtonLink href={dealPath} className="w-full">
            {isEnglish ? "Open Tesla deal" : "Open Tesla deal"}
            <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </ButtonLink>
          <CopyReferralButton compact />
          <ButtonLink href={termsUrl} external variant="ghost" className="w-full sm:col-span-2">
            <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
            {isEnglish ? "Open Tesla Terms & Conditions" : "Open Tesla voorwaarden"}
          </ButtonLink>
        </div>

        <div className="mt-6 grid gap-3">
          {actions.map((item) => (
            <div key={item.title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <item.icon className="mt-0.5 h-5 w-5 flex-none text-red-200" aria-hidden="true" />
              <div>
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-300">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
