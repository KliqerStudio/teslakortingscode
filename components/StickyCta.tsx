"use client";

import { ExternalLink } from "lucide-react";
import { usePathname } from "next/navigation";

import { dealPath, termsUrl } from "@/lib/site";

import { CopyReferralButton } from "./CopyReferralButton";

export function StickyCta() {
  const pathname = usePathname();
  const isEnglish = pathname.startsWith("/en");

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-graphite-950/86 px-4 py-3 backdrop-blur-2xl sm:px-6">
      <div className="mx-auto flex max-w-[22rem] flex-col gap-3 sm:max-w-7xl sm:flex-row sm:items-center sm:justify-between">
        <div className="hidden min-w-0 sm:block">
          <p className="text-sm font-semibold text-white">
            {isEnglish ? "Order only after the Tesla benefit is visible." : "Bestel pas nadat u het voordeel bij Tesla ziet."}
          </p>
          <a
            href={termsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 underline-offset-4 transition hover:text-white hover:underline"
          >
            {isEnglish ? "Read the official terms" : "Lees de officiële voorwaarden"}
          </a>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <CopyReferralButton compact shortLabel />
          <a
            href={dealPath}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-graphite-950 transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:px-5"
          >
            <span className="sm:hidden">{isEnglish ? "Open" : "Open"}</span>
            <span className="hidden sm:inline">{isEnglish ? "Open Tesla deal" : "Open Tesla deal"}</span>
            <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
