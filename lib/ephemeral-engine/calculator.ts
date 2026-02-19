import { RawPayrollRecord, TaxResult, TaxConfig } from "./types";
import { USD_TAX_TABLE_2025, ZIG_TAX_TABLE_2025, NSSA_CONFIG, NEC_CONFIG, AIDS_LEVY_RATE, TaxBracket, CASUAL_CONFIG } from "./tax-tables";

export function calculateTax(record: RawPayrollRecord, config: Partial<TaxConfig> = {}): TaxResult {
  const currency = record.currency;
  const grossIncome = record.basicSalary + (record.allowances || 0);
  
  // Configuration with Fallbacks
  const nssaRate = config.nssaRate ?? NSSA_CONFIG.rate;
  const nssaCeiling = currency === "USD" 
      ? (config.nssaCeilingUSD ?? NSSA_CONFIG.usdCeiling) 
      : (config.nssaCeilingZiG ?? NSSA_CONFIG.zigCeiling);
  
  const necRate = config.necRate ?? NEC_CONFIG.rate;
  const sdfRate = config.sdfRate ?? 0.01;
  const casualRate = config.casualTaxRate ?? CASUAL_CONFIG.rate;

  // Determine Calculation Method
  let method: "FDS" | "PAYE" | "FLAT" = "PAYE";
  if (!record.isPermanent) {
      method = "FLAT";
  } else if (record.ytdGross !== undefined && config.processingMonth && config.processingMonth > 0) {
      method = "FDS";
  }

  // 1. Calculate NSSA (Pension)
  // Enforce exemption for Casuals (FLAT method) unless explicitly overridden (future-proof)
  // Currently, we assume Flat Rate Casuals do NOT pay NSSA/NEC.
  const isCasual = method === "FLAT";
  
  const nssaConfigured = config.nssaEnabled ?? true; // Default to true if not passed
  const nssaEnabled = isCasual ? false : nssaConfigured; // Casuals exempt by default
  
  let nssa = 0;
  if (nssaEnabled) {
      const nssaInsurable = Math.min(grossIncome, nssaCeiling);
      nssa = nssaInsurable * nssaRate;
  }

  // 2. Calculate NEC
  const necConfigured = config.necEnabled ?? NEC_CONFIG.rate > 0;
  const necEnabled = isCasual ? false : necConfigured; // Casuals exempt by default
  
  let nec = 0;
  if (necEnabled) {
      nec = grossIncome * necRate;
  }

  // 3. Determine Taxable Income
  // Deduct NSSA, NEC, and Exempt Allowances from Gross
  const exemptAllowances = record.exemptAllowances || 0;
  let taxableIncome = grossIncome - nssa - nec - exemptAllowances;
  
  if (taxableIncome < 0) taxableIncome = 0;

  // 4. Calculate Tax (PAYE) based on Method
  let paye = 0;
  const table = currency === "USD" ? USD_TAX_TABLE_2025 : ZIG_TAX_TABLE_2025;

  if (method === "FLAT") {
      // Casual / Flat Rate Logic
      // Applied on Taxable Income (which is == Gross if NSSA/NEC are 0)
      paye = taxableIncome * casualRate;
  } else if (method === "FDS") {
      // FDS (Cumulative) Logic
      const month = config.processingMonth || 1;
      const ytdGross = record.ytdGross || 0;
      const ytdTaxPaid = record.ytdTaxPaid || 0; // Previous Tax Paid

      // Cumulative Totals (Previous + Current)
      // Note: We need Cumulative Taxable, not just Gross.
      // We assume YTD Gross is effectively YTD Taxable for simplicity if YTD deductions aren't known?
      // Better: We approximate YTD Taxable = YTD Gross - (YTD NSSA/NEC Estimate)
      // Or we just ask for YTD Taxable? The prompt agreed to "YTD Gross".
      // Let's assume proportional deductions for YTD part.
      
      const cumulativeGross = ytdGross + grossIncome;
      // Estimate YTD Deductions based on current ratio? 
      // Or just apply deductions to current and assume YTD was already net of deductions?
      // "Taxable Income" is the base. 
      // Standard: Cumulative Taxable = (YTD Taxable) + Current Taxable.
      // We only have YTD Gross. We'll estimate YTD Taxable = YTD Gross * (Current Taxable / Current Gross).
      // Fallback: If Current Gross is 0 (unlikely), use 1.
      
      const deductionRatio = grossIncome > 0 ? (taxableIncome / grossIncome) : 1;
      const cumulativeTaxable = (ytdGross * deductionRatio) + taxableIncome;

      // Annual Projection
      const projectedAnnualTaxable = (cumulativeTaxable / month) * 12;

      // Annual Tax Calculation
      const annualTable = annualizeTable(table);
      const projectedAnnualTax = calculateProgressiveTax(projectedAnnualTaxable, annualTable);

      // Tax Liability To Date
      const taxLiabilityToDate = (projectedAnnualTax / 12) * month;

      // Current Month Tax
      paye = taxLiabilityToDate - ytdTaxPaid;
      
      // Safety: Tax cannot be negative? In FDS it CAN be negative (Refund).
      // But ZIMRA usually handles refunds via adjustment. We will allow negative for internal calc
      // but generated payslip logic often floors at 0 unless it's a specific refund process.
      // For ephemeral, we'll keep the exact math.
  } else {
      // Standard Monthly PAYE
      paye = calculateProgressiveTax(taxableIncome, table);
  }
  
  // Floor tax at 0 (unless refund logic is explicitly desired, usually strictly handled)
  // Re-reading FDS: Refunds are permitted. We will allow it.

  // 5. Calculate AIDS Levy (3% of PAYE)
  // If PAYE is negative (refund), AIDS levy is also refunded? Usually yes.
  const aidsLevy = paye * AIDS_LEVY_RATE;

  // 6. Total Deductions & Net Pay
  const totalDeductions = nssa + nec + paye + aidsLevy;
  const netPay = grossIncome - totalDeductions;

  // 7. Employer Costs (SDF)
  const sdfEnabled = config.sdfEnabled ?? true;
  let sdf = 0;
  if (sdfEnabled) {
      sdf = grossIncome * sdfRate;
  }

  return {
    grossIncome: grossIncome,
    nssa: nssa,
    nec: nec,
    taxableIncome: taxableIncome,
    paye: paye,
    aidsLevy: aidsLevy,
    totalDeductions: totalDeductions,
    netPay: netPay,
    sdf: sdf,
    currency: currency,
    method: method
  } as TaxResult;
}

function calculateProgressiveTax(income: number, table: TaxBracket[]): number {
  let tax = 0;
  // Handle negative income (shouldn't happen for Taxable, but safety)
  if (income <= 0) return 0;

  for (const bracket of table) {
    if (income > bracket.lower) {
      const taxableAmountInBracket = Math.min(income, bracket.upper) - bracket.lower;
      tax += taxableAmountInBracket * bracket.rate;
    } else {
      break; 
    }
  }
  return tax;
}

function annualizeTable(monthlyTable: TaxBracket[]): TaxBracket[] {
  return monthlyTable.map(b => ({
    lower: b.lower * 12,
    upper: b.upper === Infinity ? Infinity : b.upper * 12,
    rate: b.rate,
    deduction: b.deduction * 12
  }));
}
