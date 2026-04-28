import { absoluteUrl } from "@/lib/site";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated: string;
  readingTime: string;
  keywords: string[];
  intro: string;
  sections: Array<{
    heading: string;
    body: string[];
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  sources: Array<{
    label: string;
    url: string;
  }>;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "tesla-fsd-nederland-rdw-goedkeuring",
    title: "Tesla FSD Nederland: wat betekent de RDW-goedkeuring voor kopers?",
    description:
      "Heldere uitleg over Tesla Full Self-Driving (Supervised) in Nederland, de RDW-goedkeuring, verantwoordelijkheid van de bestuurder en wat u vóór aankoop moet controleren.",
    date: "2026-04-28",
    updated: "2026-04-28",
    readingTime: "6 min lezen",
    keywords: [
      "Tesla FSD Nederland",
      "Full Self-Driving Nederland",
      "RDW Tesla FSD",
      "FSD Supervised Nederland",
      "Tesla Model Y FSD Nederland"
    ],
    intro:
      "Nederland is het eerste Europese land waar Tesla Full Self-Driving (Supervised) officieel mag worden gebruikt. Dat klinkt groot, maar de nuance is belangrijk: FSD Supervised is geen autonome auto. Het is een geavanceerd rijhulpsysteem waarbij de bestuurder verantwoordelijk blijft.",
    sections: [
      {
        heading: "Wat heeft de RDW precies goedgekeurd?",
        body: [
          "De RDW heeft op 10 april 2026 een typegoedkeuring afgegeven voor Tesla FSD Supervised met voorlopige geldigheid in Nederland. Volgens de RDW is het systeem meer dan anderhalf jaar onderzocht en getest op de testbaan en openbare weg.",
          "De goedkeuring geldt voor nu alleen in Nederland. Een bredere Europese toelating vraagt nog aanvullende stappen via de Europese Commissie en stemming door lidstaten."
        ]
      },
      {
        heading: "FSD Supervised is niet zelfrijdend",
        body: [
          "De belangrijkste boodschap voor kopers: een Tesla met FSD Supervised is niet autonoom. De bestuurder moet opletten, blijft onderdeel van het verkeer en moet direct kunnen ingrijpen.",
          "Tesla en RDW gebruiken daarom nadrukkelijk het woord ‘Supervised’. Het systeem kan veel rijtaken ondersteunen, maar neemt de juridische verantwoordelijkheid niet over."
        ]
      },
      {
        heading: "Waarom dit relevant is bij een nieuwe Tesla bestellen",
        body: [
          "Wie in Nederland een nieuwe Model 3 of Model Y overweegt, ziet FSD nu niet meer alleen als toekomstige belofte. Het is een actuele optie die u in de configuratie en voorwaarden moet meenemen.",
          "Controleer vóór bestelling welke hardware, softwareversie, modeljaar en abonnementsopties gelden. Tesla geeft zelf aan dat beschikbaarheid kan afhangen van voertuigconfiguratie, hardware, softwareversie, model, uitvoering en modeljaar."
        ]
      },
      {
        heading: "Praktische checklist vóór aankoop",
        body: [
          "Controleer op Tesla.nl of FSD Supervised beschikbaar is voor het specifieke model dat u bestelt.",
          "Bekijk of de deal-link of referral benefit zichtbaar is voordat u de order afrondt.",
          "Lees Tesla’s actuele FSD-voorwaarden en referral-voorwaarden, omdat prijzen, beschikbaarheid en eligibility kunnen wijzigen."
        ]
      }
    ],
    faqs: [
      {
        question: "Is Tesla FSD legaal in Nederland?",
        answer:
          "FSD Supervised is door de RDW goedgekeurd voor gebruik in Nederland, maar alleen als rijhulpsysteem onder toezicht van de bestuurder."
      },
      {
        question: "Rijdt een Tesla met FSD in Nederland zelfstandig?",
        answer:
          "Nee. RDW en Tesla geven aan dat de bestuurder verantwoordelijk blijft en altijd moet opletten en kunnen ingrijpen."
      }
    ],
    sources: [
      {
        label: "RDW toelichting typegoedkeuring Tesla FSD Supervised",
        url: "https://www.rdw.nl/over-rdw/nieuws/2026/toelichting-rdw-op-europese-typegoedkeuring-tesla"
      },
      {
        label: "Tesla Nederland: Full Self-Driving (Supervised)",
        url: "https://www.tesla.com/nl_nl/support/fsd"
      },
      {
        label: "NotaTeslaApp: Tesla starts rolling out FSD Supervised in the Netherlands",
        url: "https://www.notateslaapp.com/news/3959/tesla-starts-rolling-out-fsd-supervised-in-the-netherlands"
      }
    ]
  },
  {
    slug: "tesla-fsd-supervised-nederland-kosten-abonnement",
    title: "Tesla FSD abonnement Nederland: kosten, proefperiode en voorwaarden",
    description:
      "Wat kost Full Self-Driving (Supervised) in Nederland, hoe werkt het abonnement en waar moet u op letten voordat u een Tesla bestelt?",
    date: "2026-04-28",
    updated: "2026-04-28",
    readingTime: "5 min lezen",
    keywords: [
      "Tesla FSD abonnement Nederland",
      "Tesla FSD kosten Nederland",
      "Full Self-Driving prijs Nederland",
      "Tesla FSD €99",
      "Tesla FSD proefperiode"
    ],
    intro:
      "Tesla vermeldt op de Nederlandse supportpagina dat Full Self-Driving (Supervised) als abonnement beschikbaar is voor €99 per maand inclusief btw. Voor kopers is vooral belangrijk dat prijs, eligibility en functies onder voorbehoud blijven.",
    sections: [
      {
        heading: "Wat kost FSD Supervised in Nederland?",
        body: [
          "Tesla noemt voor Nederland een maandabonnement van €99 inclusief btw. Het abonnement wordt volgens Tesla maandelijks automatisch verlengd totdat u opzegt.",
          "Omdat Tesla prijzen en voorwaarden kan aanpassen, is het verstandig om de prijs altijd in uw eigen Tesla-account, configurator of Tesla-app te controleren."
        ]
      },
      {
        heading: "Kan ik FSD proberen?",
        body: [
          "Tesla vermeldt dat sommige eigenaren mogelijk in aanmerking komen voor een gratis proefperiode van 30 dagen. De voorwaarden bepalen wie hiervoor in aanmerking komt.",
          "Voor nieuwe kopers kan een testrit bij Tesla nuttig zijn, vooral omdat FSD Supervised in Nederland anders werkt dan de Amerikaanse FSD-video’s die veel mensen online zien."
        ]
      },
      {
        heading: "Wanneer is FSD beschikbaar op uw auto?",
        body: [
          "Tesla geeft aan dat een draadloze software-update nodig kan zijn voordat FSD Supervised beschikbaar is. OTA-updates worden geleidelijk uitgerold.",
          "Beschikbaarheid kan afhangen van voertuigconfiguratie, hardware, softwareversie, land, wettelijke goedkeuringen, model, uitvoering en modeljaar."
        ]
      }
    ],
    faqs: [
      {
        question: "Kost Tesla FSD in Nederland €99 per maand?",
        answer:
          "Tesla vermeldt op de Nederlandse supportpagina €99 per maand inclusief btw, maar prijs en beschikbaarheid zijn onder voorbehoud."
      },
      {
        question: "Kan ik FSD later toevoegen?",
        answer:
          "Tesla vermeldt dat u zich via de Tesla-app kunt abonneren als FSD Supervised voor uw auto beschikbaar is."
      }
    ],
    sources: [
      {
        label: "Tesla Nederland: FSD kosten en abonnement",
        url: "https://www.tesla.com/nl_nl/support/fsd"
      },
      {
        label: "NotaTeslaApp: Europese FSD verschillen",
        url: "https://www.notateslaapp.com/news/3963/tesla-fsd-supervised-in-europe-heres-whats-different"
      }
    ]
  },
  {
    slug: "tesla-fsd-nederland-vs-autopilot",
    title: "Tesla FSD Supervised vs Autopilot in Nederland: wat is het verschil?",
    description:
      "Vergelijk Tesla Autopilot, Enhanced Autopilot en Full Self-Driving (Supervised) in Nederland zonder marketingruis.",
    date: "2026-04-28",
    updated: "2026-04-28",
    readingTime: "7 min lezen",
    keywords: [
      "Tesla FSD vs Autopilot Nederland",
      "Tesla Enhanced Autopilot Nederland",
      "Full Self-Driving Supervised verschil",
      "Tesla rijhulpsysteem Nederland"
    ],
    intro:
      "De namen Autopilot en Full Self-Driving zorgen vaak voor verwarring. In Nederland is het verschil extra belangrijk, omdat FSD Supervised is goedgekeurd als rijhulpsysteem, niet als autonome rijfunctie.",
    sections: [
      {
        heading: "Autopilot is de basis",
        body: [
          "Autopilot ondersteunt vooral rijstrookhouden en adaptieve cruisecontrol. Het is bedoeld om de bestuurder te ondersteunen, niet om zelfstandig te rijden.",
          "Ook bij Autopilot blijft de bestuurder verantwoordelijk voor snelheid, omgeving en ingrijpen."
        ]
      },
      {
        heading: "FSD Supervised gaat verder",
        body: [
          "Volgens Tesla kan FSD Supervised navigatieroutes volgen, bochten maken, kruispunten oversteken, rotondes nemen en snelwegen op- en afrijden, afhankelijk van omstandigheden en beschikbaarheid.",
          "Daar staat tegenover dat de bestuurder continu alert moet blijven. De auto wordt niet autonoom."
        ]
      },
      {
        heading: "Waarom Nederlandse kopers extra goed moeten lezen",
        body: [
          "De Europese FSD-versie is niet één-op-één te vergelijken met de Amerikaanse versie. RDW benadrukt dat Europa andere eisen stelt en dat Europese auto’s andere softwareversies gebruiken.",
          "Baseer uw keuze daarom op Tesla Nederland, RDW en uw eigen testrit, niet alleen op Amerikaanse YouTube-video’s."
        ]
      }
    ],
    faqs: [
      {
        question: "Is FSD beter dan Autopilot?",
        answer:
          "FSD Supervised ondersteunt meer rijtaken dan basis-Autopilot, maar blijft een rijhulpsysteem onder toezicht."
      },
      {
        question: "Kan ik FSD vergelijken met Amerikaanse video’s?",
        answer:
          "Voorzichtig. RDW geeft aan dat Amerikaanse en Europese softwareversies en functies niet één-op-één vergelijkbaar zijn."
      }
    ],
    sources: [
      {
        label: "RDW: Europese en Amerikaanse FSD-versies zijn niet 1-op-1 vergelijkbaar",
        url: "https://www.rdw.nl/over-rdw/nieuws/2026/toelichting-rdw-op-europese-typegoedkeuring-tesla"
      },
      {
        label: "Tesla Nederland: FSD functies en toezicht",
        url: "https://www.tesla.com/nl_nl/support/fsd"
      }
    ]
  },
  {
    slug: "tesla-fsd-europa-nederland-eerst",
    title: "Tesla FSD in Europa: waarom Nederland eerst is en wat dit betekent",
    description:
      "Nederland loopt voorop met Tesla FSD Supervised. Lees wat dit betekent voor België, Duitsland en de rest van Europa.",
    date: "2026-04-28",
    updated: "2026-04-28",
    readingTime: "6 min lezen",
    keywords: [
      "Tesla FSD Europa",
      "Tesla FSD België",
      "Tesla FSD Duitsland",
      "FSD Supervised Europe",
      "Nederland eerste land FSD"
    ],
    intro:
      "De Nederlandse goedkeuring is belangrijk voor Europese Tesla-rijders, maar betekent niet automatisch dat FSD Supervised direct in elk EU-land werkt.",
    sections: [
      {
        heading: "Nederland heeft voorlopige geldigheid",
        body: [
          "De RDW schrijft dat de typegoedkeuring voor nu alleen in Nederland geldig is. Voor gebruik in de hele Europese Unie moeten nog formele stappen worden doorlopen.",
          "Dat betekent dat een Belgische of Duitse koper de eigen lokale Tesla-site en wetgeving moet controleren voordat hij FSD verwacht te kunnen gebruiken."
        ]
      },
      {
        heading: "Wat gebeurt er aan de grens?",
        body: [
          "Tesla vermeldt dat FSD Supervised wordt geblokkeerd in regio’s waar nog geen goedkeuring is verleend. Als FSD actief is en u een land binnenrijdt zonder goedkeuring, wordt het systeem uitgeschakeld nadat u bent gewaarschuwd over de naderende grens.",
          "Voor Nederlandse rijders die vaak naar België of Duitsland gaan, is dat een belangrijke praktische beperking."
        ]
      },
      {
        heading: "Waarom Nederland belangrijk blijft",
        body: [
          "Nederland is een technisch en juridisch referentiepunt geworden voor de Europese introductie van FSD Supervised. RDW heeft de goedkeuring gebaseerd op langdurige tests en Europese veiligheidseisen.",
          "Een bredere EU-uitrol kan volgen, maar blijft afhankelijk van formele procedures en nationale acceptatie."
        ]
      }
    ],
    faqs: [
      {
        question: "Werkt Tesla FSD al in België?",
        answer:
          "Tesla vermeldt dat gebruik momenteel beschikbaar is in Nederland. Andere landen hangen af van verdere ontwikkelingen en wettelijke goedkeuring."
      },
      {
        question: "Is Nederlandse goedkeuring automatisch EU-goedkeuring?",
        answer:
          "Nee. RDW beschrijft nog aanvullende stappen voordat gebruik in alle EU-lidstaten mogelijk is."
      }
    ],
    sources: [
      {
        label: "RDW: voorlopig alleen Nederland, mogelijk later EU",
        url: "https://www.rdw.nl/over-rdw/nieuws/2026/toelichting-rdw-op-europese-typegoedkeuring-tesla"
      },
      {
        label: "Tesla Nederland: Europese beschikbaarheid FSD Supervised",
        url: "https://www.tesla.com/nl_nl/support/fsd"
      },
      {
        label: "NotaTeslaApp: FSD Supervised in Europe differences",
        url: "https://www.notateslaapp.com/news/3963/tesla-fsd-supervised-in-europe-heres-whats-different"
      }
    ]
  }
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function blogUrl(slug: string) {
  return absoluteUrl(`/blog/${slug}`);
}
