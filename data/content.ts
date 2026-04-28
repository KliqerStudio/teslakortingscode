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
  { href: "#voordeel", label: "Deal check" },
  { href: "#modellen", label: "Modellen" },
  { href: "/blog", label: "FSD blog" },
  { href: "#faq", label: "FAQ" }
];

export const heroCopy = {
  title:
    "Tesla kortingscode en referral voordeel: mogelijk 2.000 gratis Supercharging kilometers of €500 voordeel",
  subtitle:
    "Bestel je binnenkort een nieuwe Tesla? Open de Tesla deal-link vóórdat je je bestelling plaatst en controleer altijd het actuele voordeel op de officiële Tesla-website."
};

export const steps = [
  "Open de Tesla deal-link.",
  "Kies je Tesla op de officiële Tesla-website.",
  "Controleer of het referral voordeel zichtbaar is.",
  "Plaats pas daarna je bestelling.",
  "Lees altijd de actuele voorwaarden van Tesla."
];

export const trustItems = [
  {
    icon: ShieldCheck,
    title: "Onafhankelijke dealgids",
    text: "Deze website is een transparante coupon- en referral-gids, niet een officiële Tesla-pagina."
  },
  {
    icon: BadgeCheck,
    title: "Geen verborgen kosten",
    text: "De link stuurt u direct naar Tesla. U bestelt en betaalt uitsluitend via de officiële Tesla-website."
  },
  {
    icon: ExternalLink,
    title: "Directe Tesla-checkout",
    text: "De actieknoppen openen Tesla zodat u de actuele benefit in de officiële checkout kunt controleren."
  },
  {
    icon: FileText,
    title: "Voorwaarden centraal",
    text: "Controleer altijd het actuele voordeel, de beschikbaarheid en de voorwaarden voordat u bestelt."
  },
  {
    icon: Sparkles,
    title: "Heldere uitleg",
    text: "Geen gegarandeerde kortingsclaims, maar een praktische uitleg van de stappen en aandachtspunten."
  },
  {
    icon: CircleAlert,
    title: "Geen affiliatie met Tesla",
    text: "Tesla, Model S, Model 3, Model X, Model Y en Supercharging zijn handelsmerken van Tesla, Inc."
  }
];

export const models = ["Model 3", "Model Y", "Model S", "Model X"].map((name) => ({
  name,
  description:
    "Controleer op Tesla.nl of dit model momenteel in aanmerking komt voor referral voordelen."
}));

export const faqs = [
  {
    question: "Wat is een Tesla referral link?",
    answer:
      "Een Tesla referral link is een link waarmee Tesla volgens de actuele voorwaarden een buyer benefit kan tonen bij aankoop van een eligible Tesla-product, zoals Supercharging kilometers of korting."
  },
  {
    question: "Hoe gebruik ik de Tesla deal-link?",
    answer:
      "Open de deal-link voordat u bestelt, kies uw Tesla op de officiële Tesla-website en controleer tijdens het bestelproces of het referral voordeel zichtbaar is."
  },
  {
    question: "Kan ik de referral link achteraf toevoegen?",
    answer:
      "Volgens Tesla kunnen referral-links niet worden toegepast nadat een bestelling al is geplaatst. Open daarom eerst de deal-link en controleer het voordeel voordat u de order afrondt."
  },
  {
    question: "Krijg ik altijd 2.000 gratis Supercharging kilometers of €500 korting?",
    answer:
      "Nee. Dit mag u niet als gegarandeerd voordeel zien. Referral benefits, eligibility en beschikbaarheid kunnen verschillen per land, datum, account, model en Tesla-programma. Controleer altijd de actuele Tesla-voorwaarden en de checkout."
  },
  {
    question: "Werkt deze deal-link in Nederland?",
    answer:
      "De link is bedoeld voor mensen in Nederland die via de officiële Tesla-website bestellen. Controleer op Tesla.nl en in de checkout of het actuele referral voordeel zichtbaar is voor uw bestelling."
  },
  {
    question: "Werkt dit in België of andere Europese landen?",
    answer:
      "Tesla referral-programma’s kunnen per land verschillen. Open de link, ga naar de juiste Tesla-site voor uw land en controleer of de benefit tijdens het bestellen zichtbaar is."
  },
  {
    question: "Is deze website officieel van Tesla?",
    answer:
      "Nee. Deze website is onafhankelijk eigendom en is niet gelieerd aan, goedgekeurd door of gesponsord door Tesla, Inc."
  },
  {
    question: "Waar vind ik de officiële voorwaarden?",
    answer: `De officiële Tesla referral voorwaarden staan op ${termsUrl}. Lees die pagina altijd voordat u bestelt.`
  }
];

export const referralActions = [
  {
    icon: Link2,
    title: "Tesla deal-link",
    text: "Open de beveiligde Tesla-link en controleer de zichtbare buyer benefit in de checkout."
  },
  {
    icon: Zap,
    title: "Mogelijk voordeel",
    text: "2.000 gratis Supercharging kilometers of €500 voordeel, afhankelijk van Tesla’s actuele voorwaarden."
  },
  {
    icon: Car,
    title: "Bestelroute",
    text: "Open de link vóór uw order en controleer het voordeel op Tesla’s checkoutpagina."
  }
];
