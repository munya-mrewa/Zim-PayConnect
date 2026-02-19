export interface RawPayrollRecord {
  employeeId: string;
  name: string;
  tin?: string;
  basicSalary: number;
  allowances?: number; // Total Allowances
  exemptAllowances?: number; // Portion of Allowances that is Tax Exempt
  ytdGross?: number; // Required for FDS (Previous Months Total)
  ytdTaxPaid?: number; // Required for FDS (Previous Months Total)
  period?: string; // e.g. "2026-02"
  currency: "USD" | "ZiG";
  isPermanent: boolean;
}

export interface TaxConfig {
  defaultCurrency: "USD" | "ZiG";
  processingMonth: number; // 1-12 (e.g. 1 = Jan), required for FDS
  casualTaxRate: number; // e.g. 0.20 (20%)
  nssaEnabled: boolean;
  nssaRate: number;
  nssaCeilingUSD: number;
  nssaCeilingZiG: number;
  necEnabled: boolean;
  necRate: number;
  sdfEnabled: boolean;
  sdfRate: number;
}

export interface ColumnMapping {
  employeeId: string;
  name: string;
  basicSalary: string;
  currency?: string;
  tin?: string;
  isPermanent?: string;
  ytdGross?: string;
  ytdTaxPaid?: string;
  exemptAllowances?: string;
  allowances?: string;
}

export interface TaxResult {
  grossIncome: number;
  nssa: number; // 4.5% capped
  nec: number;  // National Employment Council
  taxableIncome: number;
  paye: number;
  aidsLevy: number;
  totalDeductions: number;
  netPay: number;
  sdf: number; // Standards Development Fund (Employer Cost)
  currency: "USD" | "ZiG";
  method: "FDS" | "PAYE" | "FLAT"; // Track which method was used
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ReconciliationResult {
  employeeId: string;
  name: string;
  currency: "USD" | "ZiG";
  annualGross: number;
  annualTaxable: number;
  correctAnnualTax: number;
  correctAidsLevy: number;
  taxPaidYtd: number;
  variance: number; // Positive = Underpaid (Owe ZIMRA), Negative = Overpaid (Refund)
  status: "Balanced" | "Underpaid" | "Overpaid";
}
