import { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSection } from "@/components/hero-section";
import { FeatureSection } from "@/components/feature-section";
import { PricingSection } from "@/components/pricing-section";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Ephemeral Engine | ZIMRA TaRMS Payroll Software 2025",
  description:
    "Simplify 2025 ZIMRA compliance with Ephemeral Engine. Automate FDS/Non-FDS split, ZiG/USD tax, & 12th-month reconciliation. Secure, RAM-only processing.",
  keywords: [
    "ZIMRA TaRMS payroll software 2025",
    "FDS and Non-FDS payroll split tool",
    "Zimbabwe PAYE calculator ZiG and USD",
    "ZIMRA employee management module upload",
    "ITF16 alternative Zimbabwe",
    "Secure payroll processing Zimbabwe",
    "Payroll software Zimbabwe",
    "TaRMS compliance tool",
  ],
  openGraph: {
    title: "Ephemeral Engine | ZIMRA TaRMS Payroll Software 2025",
    description:
      "The only payroll engine that automates FDS/Non-FDS splitting and simulates December Reconciliation for ZIMRA TaRMS. Zero data storage, 100% compliance.",
    url: siteConfig.url,
    siteName: "Ephemeral Engine",
    images: [
      {
        url: `${siteConfig.url}/og-ephemeral.jpg`,
        width: 1200,
        height: 630,
        alt: "Ephemeral Engine Dashboard showing ZIMRA Compliance",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ephemeral Engine | ZIMRA TaRMS Payroll Software 2025",
    description:
      "Automate ZIMRA TaRMS compliance: FDS splitting, ZiG/USD tax calc, and zero-storage processing.",
    images: [`${siteConfig.url}/og-ephemeral.jpg`],
  },
  alternates: {
    canonical: siteConfig.url,
  },
};

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "Ephemeral Engine",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web application",
        "description": "A secure, ephemeral payroll processing engine designed for Zimbabwe's 2025 ZIMRA TaRMS compliance. Features automated FDS/Non-FDS splitting and multi-currency tax calculation.",
        "url": siteConfig.url,
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "featureList": [
          "ZIMRA TaRMS Compliance",
          "FDS and Non-FDS Splitting",
          "ZiG and USD Tax Calculation",
          "Ephemeral RAM-only Processing"
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How to split FDS and Non-FDS for ZIMRA?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Ephemeral Engine automatically categorizes employees based on their tax status (Final Deduction System vs. Non-FDS) and generates the distinct upload files required for the ZIMRA TaRMS portal."
            }
          },
          {
            "@type": "Question",
            "name": "What replaces the ITF16 return in 2025?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The new ZIMRA monthly transaction model replaces the annual ITF16 return. Ephemeral Engine simulates the 'December Reconciliation' monthly to ensure you remain compliant throughout the tax year."
            }
          },
          {
            "@type": "Question",
            "name": "Is my payroll data stored on your servers?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No. Our unique 'ephemeral' architecture processes your sensitive payroll data in RAM solely to calculate taxes and generate compliance files. Once the session ends, all data is instantly destroyed."
            }
          }
        ]
      }
    ]
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <FeatureSection />
        <PricingSection />
      </main>
      <SiteFooter />
    </div>
  );
}
