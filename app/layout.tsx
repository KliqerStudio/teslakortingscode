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

const title =
  "Tesla kortingscode Nederland | Deal-link voor mogelijk Supercharging of €500 voordeel";
const description =
  "Open de Tesla deal-link vóór uw bestelling en controleer altijd het actuele voordeel en de officiële Tesla voorwaarden.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | TeslaKortingscode.com"
  },
  description,
  applicationName: "TeslaKortingscode.com",
  keywords: [
    "Tesla referral code Nederland",
    "Tesla referral link Nederland",
    "Tesla kortingscode",
    "Tesla referral Nederland",
    "Tesla Model 3 referral",
    "Tesla Model Y referral",
    "Tesla Supercharging referral",
    "Tesla €500 korting",
    "Tesla 2000 gratis Supercharging kilometers",
    "Tesla referral Europe"
  ],
  alternates: {
    canonical: absoluteUrl("/")
  },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: absoluteUrl("/"),
    siteName: "TeslaKortingscode.com",
    title,
    description,
    images: [
      {
        url: absoluteUrl("/images/ev-hero.png"),
        width: 1536,
        height: 1024,
        alt: "Premium elektrische auto op een donkere Europese snelweg"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [absoluteUrl("/images/ev-hero.png")]
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050608"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl" className={inter.variable}>
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
