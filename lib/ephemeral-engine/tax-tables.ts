// ZIMRA Tax Tables for 2025/2026
// Source: ZIMRA Public Notices & Statutory Instruments (Placeholder structures based on standard progressive tax)

export interface TaxBracket {
  lower: number;
  upper: number;
  rate: number;
  deduction: number; // Cumulative deduction to simplify calc
}

// USD Tax Tables (Monthly)
export const USD_TAX_TABLE_2025: TaxBracket[] = [
  { lower: 0, upper: 100, rate: 0, deduction: 0 },
  { lower: 100, upper: 300, rate: 0.20, deduction: 0 }, // 20%
  { lower: 300, upper: 1000, rate: 0.25, deduction: 15 }, // Example deduction logic
  { lower: 1000, upper: 3000, rate: 0.30, deduction: 65 },
  { lower: 3000, upper: Infinity, rate: 0.40, deduction: 365 }
];

// ZiG Tax Tables (Monthly) - Hypothetical 2025/2026 values
// Exchange rate volatility often leads to adjustments.
export const ZIG_TAX_TABLE_2025: TaxBracket[] = [
  { lower: 0, upper: 2800, rate: 0, deduction: 0 },
  { lower: 2800, upper: 8400, rate: 0.20, deduction: 0 },
  { lower: 8400, upper: 28000, rate: 0.25, deduction: 420 },
  { lower: 28000, upper: 84000, rate: 0.30, deduction: 1820 },
  { lower: 84000, upper: Infinity, rate: 0.40, deduction: 10220 }
];

// NSSA Limits (Monthly)
// POBS: Pension and Other Benefits Scheme
export const NSSA_CONFIG = {
  rate: 0.045, // 4.5%
  usdCeiling: 700, // Insurable earnings ceiling
  zigCeiling: 19600 // Equivalent ~28x or prevailing rate
};

// NEC (National Employment Council) - Varies by Industry
// Using a generic commercial sector placeholder
export const NEC_CONFIG = {
  rate: 0.0, // Default to 0 unless configured, usually ~1-2% or fixed
  deductFromTaxable: true
};

// Casual / Non-FDS Configuration
export const CASUAL_CONFIG = {
  rate: 0.20, // 20% Flat Rate
  exemptFromNSSA: true // Often casuals don't pay NSSA if short-term, strictly configurable
};

// AIDS Levy
export const AIDS_LEVY_RATE = 0.03;
