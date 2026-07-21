export const plans = [
  {
    id: "STARTER",
    name: "Starter",
    price: 0,
    currency: "INR",
    period: "/mo",
    purchasable: false,
    description: "Everything you need to explore NovaNest and ship your first resume.",
    features: [
      "1 AI resume build",
      "5 interview questions / week",
      "1 cover letter / month",
      "Industry overview",
    ],
    cta: "Start free",
    href: "/dashboard",
    highlighted: false,
  },
  {
    id: "PRO",
    name: "Pro",
    price: 1499,
    currency: "INR",
    period: "/mo",
    purchasable: true,
    description: "For active job seekers who want the full AI workspace, unlimited.",
    features: [
      "Unlimited resumes & cover letters",
      "Unlimited mock interviews + voice mode",
      "Live industry insights & alerts",
      "Application tracker board",
      "NovaScore readiness analytics",
      "Priority AI generation",
    ],
    cta: "Go Pro",
    href: "/dashboard",
    highlighted: true,
  },
  {
    id: "TEAMS",
    name: "Teams",
    price: 3999,
    currency: "INR",
    period: "/mo",
    purchasable: true,
    description: "For career teams, bootcamps, and universities coaching many candidates.",
    features: [
      "Everything in Pro",
      "Up to 10 seats",
      "Shared candidate pipelines",
      "Team analytics dashboard",
      "SSO + admin controls",
    ],
    cta: "Get Teams",
    href: "/dashboard",
    highlighted: false,
  },
];

// Currency code → display symbol. Keep here so the pricing component never
// hardcodes a currency glyph.
export const CURRENCY_SYMBOL = {
  INR: "₹",
  USD: "$",
};