export const siteConfig = {
  name: "Zim-PayConnect",
  description: "ZIMRA TaRMS 2025-2026 Compliant Payroll Engine. Secure, ephemeral payroll processing. Automates FDS/Non-FDS splitting, ZiG/USD tax forecasting, and December Reconciliation.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://zimpayconnect.online",
  ogImage: "https://zimpayconnect.online/og.jpg",
  links: {
    twitter: "https://twitter.com/zimpayconnect",
    github: "https://github.com/zimpayconnect",
  },
  keywords: [
    "ZIMRA TaRMS payroll software 2025",
    "FDS and Non-FDS payroll split tool",
    "Zimbabwe PAYE calculator ZiG and USD",
    "ZIMRA employee management module upload",
    "ITF16 alternative Zimbabwe",
    "Secure payroll processing Zimbabwe",
    "Payroll software Zimbabwe",
    "TaRMS compliance tool",
    "NSSA",
    "NEC",
    "Payslip",
    "Compliance",
    "Ephemeral Engine",
  ],
  authors: [
    {
      name: "Zim-PayConnect Team",
      url: "https://zimpayconnect.online",
    },
  ],
  creator: "Zim-PayConnect",
  googleSiteVerificationId: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION_ID || "YOUR_GOOGLE_VERIFICATION_ID_HERE",
};

export type SiteConfig = typeof siteConfig;
