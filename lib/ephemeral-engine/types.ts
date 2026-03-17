export interface RawPayrollRecord {
  employeeId: string;
  name: string;
  tin?: string;
  nationalId?: string;
  basicSalary: number;
  allowances?: number; // Total Allowances
  exemptAllowances?: number; // Portion of Allowances that is Tax Exempt
  ytdGross?: number; // Required for FDS (Previous Months Total)
  ytdTaxPaid?: number; // Required for FDS (Previous Months Total)
  period?: string; // e.g. "2026-02"
  currency: "USD" | "ZiG";
  isPermanent: boolean;

  // Ephemeral master data enrichment (never persisted as employees)
  department?: string;
  costCenter?: string;
  bankName?: string;
  bankAccountLast4?: string;

  necGrade?: string;

  // Optional loan/advance metadata for amortization helper outputs
  loanPrincipal?: number;
  loanAnnualRate?: number; // e.g. 0.12 for 12% p.a.
  loanTermMonths?: number;
  loanInstallmentNumber?: number; // Current installment number for this period
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
  nationalId?: string;
  isPermanent?: string;
  ytdGross?: string;
  ytdTaxPaid?: string;
  exemptAllowances?: string;
  allowances?: string;

  department?: string;
  costCenter?: string;
  bankName?: string;
  bankAccountLast4?: string;
  necGrade?: string;
  loanPrincipal?: string;
  loanAnnualRate?: string;
  loanTermMonths?: string;
  loanInstallmentNumber?: string;
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
