import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Zim-PayConnect, the ephemeral payroll compliance engine for Zimbabwe.",
};

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-white">About Zim-PayConnect</h1>
        <p className="text-xl text-zinc-400">The Ephemeral Compliance Engine.</p>
      </div>

      <div className="prose prose-invert max-w-none text-zinc-300 space-y-6 leading-relaxed">
        <p>
          <strong className="text-white">Zim-PayConnect</strong> is the pioneering zero-liability payroll solution engineered specifically for Zimbabwe's 
          <strong> 2025-2026 ZIMRA TaRMS framework</strong>.
        </p>
        
        <p>
          In an era where data breaches are a liability, we believe the safest data is the data you don't hold. 
          Our proprietary <strong>Ephemeral Processing Engine</strong> executes complex payroll calculations entirely in volatile memory (RAM). 
          Once your tax returns and pay slips are generated, all sensitive employee data is immediately and permanently destroyed.
        </p>

        <p>
          Designed for the modern Zimbabwean economy, our system features a robust <strong>Dual Currency Engine</strong> that seamlessly unifies 
          <strong> ZiG and USD</strong> payrolls. We handle real-time exchange rate unification via auto-fetch feeds, statutory deduction splitting (NSSA, AIDS Levy), 
          and Final Deduction System (FDS) compliance with mathematical precision.
        </p>

        <p>
          Beyond compliance, we streamline your workflow with <strong>General Ledger (GL) Exports</strong> for Sage and QuickBooks, closing the loop between 
          payroll calculation and financial reporting.
        </p>

        <p>
          We provide audit-ready compliance without the risk of data retention.
        </p>
      </div>
    </div>
  );
}
