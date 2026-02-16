export const siteConfig = {
  name: "Zim-PayConnect",
  description: "ZIMRA TaRMS 2025-2026 Compliant Payroll Engine. Secure, ephemeral payroll processing for Zimbabwean businesses.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://zim-payconnect.com",
  ogImage: "https://zim-payconnect.com/og.jpg",
  links: {
    twitter: "https://twitter.com/zimpayconnect",
    github: "https://github.com/zimpayconnect",
  },
  keywords: [
    "ZIMRA",
    "TaRMS",
    "Payroll",
    "Zimbabwe",
    "Tax",
    "NSSA",
    "NEC",
    "Payslip",
    "Compliance",
    "Payroll Software",
    "ZiG",
    "USD Payroll",
  ],
  authors: [
    {
      name: "Zim-PayConnect Team",
      url: "https://zim-payconnect.com",
    },
  ],
  creator: "Zim-PayConnect",
};

export type SiteConfig = typeof siteConfig;
