export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://teslakortingscode.com"
).replace(/\/$/, "");

export const referralLink =
  process.env.NEXT_PUBLIC_TESLA_REFERRAL_LINK || "https://ts.la/tristan462970";

export const referralCode =
  process.env.NEXT_PUBLIC_TESLA_REFERRAL_CODE || "tristan462970";

export const termsUrl =
  process.env.NEXT_PUBLIC_TESLA_TERMS_URL ||
  "https://www.tesla.com/nl_nl/support/refer-and-earn";

export const dealPath = "/go";

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalizedPath}`;
}

export const legalDisclaimerNl =
  "Deze website is onafhankelijk eigendom en is niet gelieerd aan, goedgekeurd door of gesponsord door Tesla, Inc. Tesla, Model S, Model 3, Model X, Model Y, Supercharging en gerelateerde merken zijn handelsmerken van Tesla, Inc. Links op deze website kunnen referral-links zijn. Referral-voordelen, eligibility en beschikbaarheid kunnen wijzigen per land, datum, account en product. Controleer altijd de actieve aanbieding en voorwaarden op Tesla’s officiële website voordat u bestelt.";

export const legalDisclaimerEn =
  "This website is independently owned and is not affiliated with, endorsed by, or sponsored by Tesla, Inc. Tesla, Model S, Model 3, Model X, Model Y, Supercharging, and related marks are trademarks of Tesla, Inc. Links on this website may be referral links. Referral benefits, eligibility, and availability may change by country, date, account, and product. Always verify the active offer and terms on Tesla’s official website before ordering.";

export const legalDisclaimer = legalDisclaimerEn;
