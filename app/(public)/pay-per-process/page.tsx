import { PayPerProcessHero } from "@/components/pay-per-process-hero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pay Per Process | One-Off Payroll Reports | Zim-PayConnect",
  description:
    "Process a single ZIMRA TaRMS-compliant payroll report for $5. No subscription, no commitment. Buy a credit, upload your CSV, and download your report instantly.",
  keywords: [
    "pay per process payroll Zimbabwe",
    "one-off payroll report ZIMRA",
    "single payroll batch processing",
    "ZIMRA TaRMS report no subscription",
    "payroll credit Zimbabwe",
  ],
};

export default function PayPerProcessPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <div className="container py-16 md:py-24">
        <PayPerProcessHero />
      </div>
    </div>
  );
}
