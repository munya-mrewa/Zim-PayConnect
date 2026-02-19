// ZIMRA Tax Tables for 2025/2026
// Source: ZIMRA 2025 Tax Tables (USD unchanged from 2024; ZiG introduced April 2024 mirrored at ~28x)

export interface TaxBracket {
  lower: number;
  upper: number;
  rate: number;
  deduction: number; // Unused in current calculator logic (cumulative method), kept for reference
}

// USD Tax Tables (Monthly)
export const USD_TAX_TABLE_2025: TaxBracket[] = [
  { lower: 0, upper: 100, rate: 0, deduction: 0 },
  { lower: 100, upper: 300, rate: 0.20, deduction: 0 }, // 20%
  { lower: 300, upper: 1000, rate: 0.25, deduction: 0 }, // 25%
  { lower: 1000, upper: 2000, rate: 0.30, deduction: 0 }, // 30%
  { lower: 2000, upper: 3000, rate: 0.35, deduction: 0 }, // 35%
  { lower: 3000, upper: Infinity, rate: 0.40, deduction: 0 } // 40%
];

// ZiG Tax Tables (Monthly) - Based on ZiG 2025 Gazette (Mirrors USD at ~28.0)
export const ZIG_TAX_TABLE_2025: TaxBracket[] = [
  { lower: 0, upper: 2800, rate: 0, deduction: 0 },
  { lower: 2800, upper: 8400, rate: 0.20, deduction: 0 },
  { lower: 8400, upper: 28000, rate: 0.25, deduction: 0 },
  { lower: 28000, upper: 56000, rate: 0.30, deduction: 0 },
  { lower: 56000, upper: 84000, rate: 0.35, deduction: 0 },
  { lower: 84000, upper: Infinity, rate: 0.40, deduction: 0 }
];

// NSSA Limits (Monthly)
// POBS: Pension and Other Benefits Scheme
export const NSSA_CONFIG = {
  rate: 0.045, // 4.5%
  usdCeiling: 700, // Insurable earnings ceiling
  zigCeiling: 19600 // Equivalent ~28x (700 * 28)
};

// NEC (National Employment Council) - Varies by Industry
// Using a generic commercial sector placeholder
export const NEC_CONFIG = {
  rate: 0.0, // Default to 0 unless configured, usually ~1-2% or fixed
  deductFromTaxable: true
};

// Casual / Non-FDS Configuration
export const CASUAL_CONFIG = {
  rate: 0.20, // 20% Flat Rate (Withholding Tax)
  exemptFromNSSA: true // Casuals strictly exempt by default
};

// AIDS Levy
export const AIDS_LEVY_RATE = 0.03;
