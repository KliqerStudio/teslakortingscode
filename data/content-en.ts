import { termsUrl } from "@/lib/site";

export const heroCopyEn = {
  title: "Tesla coupon and referral benefit: possible 2,000 free Supercharging kilometers or €500 benefit",
  subtitle:
    "Ordering a new Tesla soon? Open the Tesla deal link before placing your order and always verify the current benefit on Tesla’s official website."
};

export const stepsEn = [
  "Open the Tesla deal link.",
  "Choose your Tesla on the official Tesla website.",
  "Check whether the referral benefit is visible.",
  "Only then place your order.",
  "Always read Tesla’s current terms."
];

export const modelsEn = ["Model 3", "Model Y", "Model S", "Model X"].map((name) => ({
  name,
  description: "Check Tesla’s website to see whether this model currently qualifies for referral benefits."
}));

export const faqsEn = [
  {
    question: "What is a Tesla referral link?",
    answer:
      "A Tesla referral link is a link that may show a buyer benefit for an eligible Tesla product under Tesla’s current terms, such as Supercharging kilometers or a discount."
  },
  {
    question: "How do I use the Tesla deal link?",
    answer:
      "Open the deal link before ordering, choose your Tesla on the official Tesla website, and check during checkout whether the referral benefit is visible."
  },
  {
    question: "Can I add the referral link after ordering?",
    answer:
      "Tesla says referral links cannot be applied after an order has been placed. Open the deal link and verify the benefit before completing your order."
  },
  {
    question: "Do I always get 2,000 free Supercharging kilometers or €500 off?",
    answer:
      "No. Treat this as a possible benefit, not a guarantee. Referral benefits, eligibility and availability can vary by country, date, account, model and Tesla program."
  },
  {
    question: "Does this work in the Netherlands?",
    answer:
      "The deal link is intended for shoppers ordering through Tesla’s official website. Check Tesla.nl and checkout to verify whether the current referral benefit is visible for your order."
  },
  {
    question: "Does this work in Belgium or other European countries?",
    answer:
      "Tesla referral programs can differ by country. Open the link, use the correct Tesla website for your country and verify the benefit during checkout."
  },
  {
    question: "Is this website official Tesla?",
    answer:
      "No. This website is independently owned and is not affiliated with, endorsed by, or sponsored by Tesla, Inc."
  },
  {
    question: "Where can I find the official terms?",
    answer: `Tesla’s official referral terms are available at ${termsUrl}. Always read that page before ordering.`
  }
];
