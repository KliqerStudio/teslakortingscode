import {
  BadgeCheck,
  Car,
  CircleAlert,
  ExternalLink,
  FileText,
  Link2,
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";

import { termsUrl } from "@/lib/site";

export const navItems = [
  { href: "#hoe-het-werkt", label: "Hoe het werkt" },
  { href: "/tesla-kortingscode", label: "Kortingscode" },
  { href: "/gratis-supercharging", label: "Supercharging" },
  { href: "/blog", label: "Blog" },
  { href: "/veelgestelde-vragen", label: "FAQ" }
];

export const heroCopy = {
  title:
    "Tesla kortingscode 2026 — mogelijk 2.000 gratis Supercharging km of €500 korting",
  subtitle:
    "Bestel je binnenkort een Tesla? Open de gratis referral link vóór je bestelling en ontvang mogelijk een Tesla-kortingscode benefit. Controleer altijd het actuele aanbod op de officiële Tesla-website."
};

export const steps = [
  "Klik op 'Open Tesla deal' hieronder.",
  "Kies je Tesla op de officiële Tesla-website.",
  "Controleer of het referral voordeel zichtbaar is in de checkout.",
  "Plaats daarna pas je bestelling.",
  "Lees altijd de actuele Tesla-voorwaarden."
];

export const trustItems = [
  {
    icon: ShieldCheck,
    title: "100% gratis te gebruiken",
    text: "De referral link kost u niets. U bestelt en betaalt uitsluitend via de officiële Tesla-website."
  },
  {
    icon: BadgeCheck,
    title: "Onafhankelijke dealgids",
    text: "Wij zijn geen officiële Tesla-pagina. Wij helpen u de referral link correct toe te passen voor uw bestelling."
  },
  {
    icon: ExternalLink,
    title: "Direct naar Tesla checkout",
    text: "Alle knoppen openen de officiële Tesla-website. U controleert de actuele benefit zelf in de checkout."
  },
  {
    icon: FileText,
    title: "Altijd voorwaarden controleren",
    text: "Referral benefits kunnen wijzigen per datum, model en account. Controleer de actuele voorwaarden bij Tesla."
  },
  {
    icon: Sparkles,
    title: "Heldere stap-voor-stap uitleg",
    text: "Geen verborgen stappen. We leggen exact uit hoe u de Tesla referral link gebruikt vóór uw bestelling."
  },
  {
    icon: CircleAlert,
    title: "Geen affiliatie met Tesla",
    text: "Tesla, Model 3, Model Y, Model S, Model X en Supercharging zijn handelsmerken van Tesla, Inc."
  }
];

export const models = [
  { name: "Model 3", badge: "Populairste keuze" },
  { name: "Model Y", badge: "Meest verkocht NL" },
  { name: "Model S", badge: "Flagship" },
  { name: "Model X", badge: "SUV" }
].map((m) => ({
  ...m,
  description:
    "Controleer op Tesla.nl of dit model momenteel in aanmerking komt voor referral voordelen en gratis Supercharging."
}));

export const faqs = [
  {
    question: "Wat is een Tesla kortingscode of referral link?",
    answer:
      "Een Tesla kortingscode (referral link) is een persoonlijke link waarmee Tesla volgens de actuele voorwaarden een buyer benefit kan tonen bij aankoop van een eligible Tesla — zoals 2.000 gratis Supercharging kilometers of €500 korting."
  },
  {
    question: "Hoe gebruik ik de Tesla referral link?",
    answer:
      "Klik op 'Open Tesla deal', kies uw Tesla op de officiële Tesla-website en controleer of het referral voordeel zichtbaar is in de checkout. Plaats uw bestelling pas daarna."
  },
  {
    question: "Kan ik de referral link achteraf toevoegen?",
    answer:
      "Nee. Volgens Tesla kunnen referral-links niet worden toegepast nadat een bestelling is geplaatst. Open daarom eerst de link en controleer het voordeel vóór uw order."
  },
  {
    question: "Krijg ik gegarandeerd 2.000 Supercharging km of €500 korting?",
    answer:
      "Nee — referral benefits zijn niet gegarandeerd. Beschikbaarheid, eligibility en het exacte voordeel kunnen wijzigen per land, datum, model en Tesla-account. Controleer altijd de actuele Tesla-voorwaarden en de checkout."
  },
  {
    question: "Werkt deze referral link in Nederland?",
    answer:
      "Ja, de link is bedoeld voor Nederland. Controleer op Tesla.nl en in de checkout of het referral voordeel zichtbaar is voor uw bestelling."
  },
  {
    question: "Werkt dit ook in België of andere Europese landen?",
    answer:
      "Tesla referral-programma's kunnen per land verschillen. Open de link, ga naar de juiste Tesla-landpagina en controleer of de benefit zichtbaar is tijdens het bestellen."
  },
  {
    question: "Is TeslaKortingscode.com officieel van Tesla?",
    answer:
      "Nee. Deze website is onafhankelijk en niet gelieerd aan, goedgekeurd door of gesponsord door Tesla, Inc."
  },
  {
    question: "Waar vind ik de officiële Tesla referral voorwaarden?",
    answer: `De officiële voorwaarden staan op ${termsUrl}. Lees deze altijd vóór uw bestelling.`
  }
];

export const referralActions = [
  {
    icon: Link2,
    title: "Gratis referral link",
    text: "Open de Tesla deal-link — het kost u niets extra. Controleer de zichtbare benefit in de officiële checkout."
  },
  {
    icon: Zap,
    title: "Mogelijk voordeel",
    text: "2.000 gratis Supercharging kilometers of €500 korting, afhankelijk van Tesla's actuele programma."
  },
  {
    icon: Car,
    title: "Zo werkt het",
    text: "Open de link vóór uw bestelling en controleer het voordeel op Tesla's checkoutpagina. Dat is alles."
  }
];
