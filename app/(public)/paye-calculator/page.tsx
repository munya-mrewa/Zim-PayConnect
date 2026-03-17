import { PublicCalculator } from "@/components/public-calculator";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zimbabwe PAYE Calculator 2025 | ZiG & USD Tax",
  description: "Free online Zimbabwe PAYE calculator for 2025. Calculate your net pay, ZIMRA tax, NSSA, and AIDS Levy in both USD and ZiG currencies. Instant results, no signup required.",
  keywords: [
    "Zimbabwe PAYE calculator 2025",
    "ZiG salary calculator",
    "USD salary calculator Zimbabwe",
    "ZIMRA tax calculator 2025",
    "Net pay calculator Zimbabwe",
    "NSSA calculator 2025",
    "AIDS levy calculator",
    "Payroll tax Zimbabwe",
  ],
};

export default function CalculatorPage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">
          Zimbabwe PAYE Calculator 2025
        </h1>
        <p className="max-w-[700px] text-zinc-400 md:text-xl/relaxed">
          Calculate your net salary and tax breakdown for 2025 in USD or ZiG.
          Based on the latest ZIMRA tax tables.
        </p>
      </div>
      
      <PublicCalculator />

      <div className="mt-20 max-w-4xl mx-auto space-y-8 text-zinc-400 text-sm md:text-base">
        <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Understanding Your Payslip</h2>
            <p>
                In Zimbabwe, your payslip is subject to several statutory deductions. This calculator helps you estimate your "Take Home" (Net) pay by deducting the mandatory contributions from your Gross Income.
            </p>
        </section>

        <section className="grid md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-xl font-medium text-white mb-2">1. NSSA (Pension)</h3>
                <p>
                    The National Social Security Authority (NSSA) pension scheme is mandatory for all employees. 
                    The current rate is <strong>4.5%</strong> of your basic salary, up to a maximum insurable earning limit ($700 USD or equivalent in ZiG).
                </p>
            </div>
            <div>
                <h3 className="text-xl font-medium text-white mb-2">2. PAYE (Income Tax)</h3>
                <p>
                    Pay As You Earn (PAYE) is the income tax deducted from your salary. It is calculated using a progressive tax table, meaning higher earners pay a higher percentage. 
                    The tax-free threshold for 2025 is $100 USD (or equivalent ZiG).
                </p>
            </div>
            <div>
                <h3 className="text-xl font-medium text-white mb-2">3. AIDS Levy</h3>
                <p>
                    This is a <strong>3%</strong> surcharge calculated on the PAYE amount (not on your gross salary). If you pay $0 tax, you pay $0 AIDS Levy.
                </p>
            </div>
            <div>
                <h3 className="text-xl font-medium text-white mb-2">4. NEC (Optional)</h3>
                <p>
                    National Employment Council (NEC) dues vary by industry (e.g., Commercial, Mining, Agriculture). This calculator does not include NEC by default as rates differ, but employers must deduct it where applicable.
                </p>
            </div>
        </section>
      </div>
    </div>
  );
}
