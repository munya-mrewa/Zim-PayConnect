export interface RawPayrollRecord {
  employeeId: string;
  name: string;
  tin?: string;
  basicSalary: number;
  allowances?: number; // Added for completeness
  ytdTaxPaid?: number; // Optional: For Year-End Reconciliation
  period?: string; // e.g. "2026-02"
  currency: "USD" | "ZiG";
  isPermanent: boolean;
}

export interface TaxConfig {
  defaultCurrency: "USD" | "ZiG";
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
  ytdTaxPaid?: string; // Mapping for YTD Tax
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
