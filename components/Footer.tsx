"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dealPath, legalDisclaimerEn, legalDisclaimerNl, termsUrl } from "@/lib/site";

import { BrandLogo } from "./BrandLogo";

const footerLinksNl = [
  { href: dealPath, label: "Tesla deal-link", external: true },
  { href: termsUrl, label: "Tesla voorwaarden", external: true },
  { href: "/privacy", label: "Privacy" },
  { href: "/disclaimer", label: "Disclaimer" }
];

const footerLinksEn = [
  { href: dealPath, label: "Tesla deal link", external: true },
  { href: termsUrl, label: "Tesla Terms & Conditions", external: true },
  { href: "/en/privacy", label: "Privacy" },
  { href: "/en/disclaimer", label: "Disclaimer" }
];

export function Footer() {
  const pathname = usePathname();
  const isEnglish = pathname.startsWith("/en");
  const footerLinks = isEnglish ? footerLinksEn : footerLinksNl;

  return (
    <footer className="border-t border-white/10 bg-graphite-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <BrandLogo href={isEnglish ? "/en" : "/"} locale={isEnglish ? "en" : "nl"} />
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {isEnglish ? legalDisclaimerEn : legalDisclaimerNl}
            </p>
          </div>
          <nav aria-label="Footer" className="grid gap-3 text-sm sm:grid-cols-2 lg:min-w-96">
            {footerLinks.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 transition hover:text-white focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-zinc-300 transition hover:text-white focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
        </div>
        <p className="mt-8 text-xs text-zinc-500">
          © {new Date().getFullYear()} {isEnglish ? "Independent deals guide." : "Onafhankelijke dealgids."}
        </p>
      </div>
    </footer>
  );
}
