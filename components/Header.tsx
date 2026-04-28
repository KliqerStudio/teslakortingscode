"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItems } from "@/data/content";
import { dealPath } from "@/lib/site";

import { BrandLogo } from "./BrandLogo";
import { ButtonLink } from "./ButtonLink";

export function Header() {
  const pathname = usePathname();
  const isEnglish = pathname.startsWith("/en");
  const homeHref = isEnglish ? "/en" : "/";
  const alternateHref = isEnglish ? "/" : "/en";
  const nav = isEnglish
    ? [
        { href: "#how-it-works", label: "How it works" },
        { href: "#benefit", label: "Deal check" },
        { href: "#models", label: "Models" },
        { href: "#faq", label: "FAQ" }
      ]
    : navItems;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-graphite-950/72 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-[22rem] items-center justify-between px-4 sm:max-w-7xl sm:px-6 lg:px-8">
        <BrandLogo href={homeHref} locale={isEnglish ? "en" : "nl"} />
        <nav aria-label={isEnglish ? "Main navigation" : "Hoofdnavigatie"} className="hidden items-center gap-6 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-zinc-300 transition hover:text-white focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={alternateHref}
            hrefLang={isEnglish ? "nl" : "en"}
            className="hidden rounded-full border border-white/12 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:text-white sm:inline-flex"
          >
            {isEnglish ? "NL" : "EN"}
          </Link>
          <ButtonLink href={dealPath} className="min-h-10 px-4">
            <span>{isEnglish ? "Open deal" : "Open deal"}</span>
            <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
