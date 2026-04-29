"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dealPath, legalDisclaimerEn, legalDisclaimerNl, termsUrl } from "@/lib/site";

import { BrandLogo } from "./BrandLogo";

const footerColsNl = [
  {
    heading: "Kortingscode",
    links: [
      { href: "/tesla-kortingscode", label: "Tesla kortingscode" },
      { href: "/tesla-referral-link", label: "Tesla referral link" },
      { href: "/tesla-referral-code-nederland", label: "Referral code Nederland" },
      { href: "/gratis-supercharging", label: "Gratis Supercharging" },
    ],
  },
  {
    heading: "Per model",
    links: [
      { href: "/tesla-model-3-referral", label: "Model 3 referral" },
      { href: "/tesla-model-y-referral", label: "Model Y referral" },
    ],
  },
  {
    heading: "Info",
    links: [
      { href: "/veelgestelde-vragen", label: "Veelgestelde vragen" },
      { href: "/blog", label: "Blog & Gidsen" },
      { href: dealPath, label: "Open Tesla deal ↗", external: true },
      { href: termsUrl, label: "Tesla voorwaarden ↗", external: true },
      { href: "/privacy", label: "Privacy" },
      { href: "/disclaimer", label: "Disclaimer" },
    ],
  },
];

const footerColsEn = [
  {
    heading: "Referral",
    links: [
      { href: "/en", label: "Home" },
      { href: "/gratis-supercharging", label: "Free Supercharging" },
      { href: dealPath, label: "Open Tesla deal ↗", external: true },
      { href: termsUrl, label: "Tesla Terms ↗", external: true },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/en/faq", label: "FAQ" },
      { href: "/en/privacy", label: "Privacy" },
      { href: "/en/disclaimer", label: "Disclaimer" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  const isEnglish = pathname.startsWith("/en");
  const cols = isEnglish ? footerColsEn : footerColsNl;

  return (
    <footer className="border-t border-white/10 bg-graphite-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          {/* Brand + disclaimer */}
          <div>
            <BrandLogo href={isEnglish ? "/en" : "/"} locale={isEnglish ? "en" : "nl"} />
            <p className="mt-4 text-sm leading-6 text-zinc-400 max-w-xs">
              {isEnglish ? legalDisclaimerEn : legalDisclaimerNl}
            </p>
            <p className="mt-4 text-xs text-zinc-600">
              Bijgewerkt: april 2026
            </p>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.heading}>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{col.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-zinc-300 transition hover:text-white"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-zinc-300 transition hover:text-white"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/8 pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} TeslaKortingscode.com · {isEnglish ? "Independent deals guide" : "Onafhankelijke dealgids"} · Niet gelieerd aan Tesla, Inc.
          </p>
          <p className="text-xs text-zinc-600">
            {isEnglish ? "Last updated: April 2026" : "Bijgewerkt: april 2026"}
          </p>
        </div>
      </div>
    </footer>
  );
}
