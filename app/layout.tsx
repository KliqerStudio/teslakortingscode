import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LanguageDocument } from "@/components/LanguageDocument";
import { StickyCta } from "@/components/StickyCta";
import { absoluteUrl, siteUrl } from "@/lib/site";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

const title = "Tesla Kortingscode Nederland 2026 | Gratis Supercharging via Referral Link";
const description =
  "Gebruik een geldige Tesla referral link en ontvang mogelijk 2.000 gratis Supercharging kilometers of €500 korting. Open de deal-link vóór uw bestelling — gratis, direct naar Tesla.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | TeslaKortingscode.com"
  },
  description,
  applicationName: "TeslaKortingscode.com",
  keywords: [
    "Tesla kortingscode",
    "Tesla kortingscode 2026",
    "Tesla referral code Nederland",
    "Tesla referral link Nederland",
    "Tesla gratis Supercharging",
    "Tesla €500 korting",
    "Tesla referral Nederland",
    "Tesla Model 3 referral",
    "Tesla Model Y referral",
    "Tesla 2000 Supercharging kilometers",
    "Tesla referral code gratis",
    "Tesla referral Europe",
    "Tesla coupon code",
    "Tesla coupon Nederland"
  ],
  alternates: {
    canonical: absoluteUrl("/"),
    languages: {
      "nl": absoluteUrl("/"),
      "en": absoluteUrl("/en"),
      "x-default": absoluteUrl("/")
    }
  },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    alternateLocale: ["en_US"],
    url: absoluteUrl("/"),
    siteName: "TeslaKortingscode.com",
    title,
    description,
    images: [
      {
        url: absoluteUrl("/og-image.png"),
        width: 1200,
        height: 630,
        alt: "Tesla kortingscode — mogelijk 2.000 gratis Supercharging km of €500 voordeel"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [absoluteUrl("/og-image.png")]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  verification: {
    google: undefined
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050608"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TeslaKortingscode.com",
    url: siteUrl,
    description,
    inLanguage: ["nl-NL", "en"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/blog?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TeslaKortingscode.com",
    url: siteUrl,
    logo: absoluteUrl("/icon.svg"),
    sameAs: []
  };

  return (
    <html lang="nl" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <link rel="alternate" hrefLang="nl" href={absoluteUrl("/")} />
        <link rel="alternate" hrefLang="en" href={absoluteUrl("/en")} />
        <link rel="alternate" hrefLang="x-default" href={absoluteUrl("/")} />
      </head>
      <body className="font-sans">
        <LanguageDocument />
        <Header />
        {children}
        <Footer />
        <StickyCta />
      </body>
    </html>
  );
}
