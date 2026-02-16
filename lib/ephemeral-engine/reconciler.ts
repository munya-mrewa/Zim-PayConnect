import { RawPayrollRecord, ReconciliationResult } from "./types";
import { USD_TAX_TABLE_2025, ZIG_TAX_TABLE_2025, NSSA_CONFIG, TaxBracket, AIDS_LEVY_RATE } from "./tax-tables";

// Helper to annualize tax tables
function annualizeTable(monthlyTable: TaxBracket[]): TaxBracket[] {
  return monthlyTable.map(b => ({
    lower: b.lower * 12,
    upper: b.upper === Infinity ? Infinity : b.upper * 12,
    rate: b.rate,
    deduction: b.deduction * 12
  }));
}

const ANNUAL_USD_TABLE = annualizeTable(USD_TAX_TABLE_2025);
const ANNUAL_ZIG_TABLE = annualizeTable(ZIG_TAX_TABLE_2025);

function calculateProgressiveTax(income: number, table: TaxBracket[]): number {
  let tax = 0;
  
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

export function reconcileYearEnd(records: RawPayrollRecord[]): ReconciliationResult[] {
  const results: ReconciliationResult[] = [];

  for (const record of records) {
      const gross = record.basicSalary + (record.allowances || 0);
      const currency = record.currency;

      // 1. Calculate Annual NSSA (Capped)
      const monthlyCeiling = currency === "USD" ? NSSA_CONFIG.usdCeiling : NSSA_CONFIG.zigCeiling;
      const annualCeiling = monthlyCeiling * 12;
      const nssaInsurable = Math.min(gross, annualCeiling);
      const annualNssa = nssaInsurable * NSSA_CONFIG.rate;

      // 2. Determine Taxable Income (Assuming NEC is handled or negligible for this mock)
      // For accurate FDS, we should deduct NEC if applicable. 
      // We'll stick to NSSA deduction for the MVP Reconciliation.
      const annualTaxable = gross - annualNssa;

      // 3. Calculate Correct Annual Tax
      const table = currency === "USD" ? ANNUAL_USD_TABLE : ANNUAL_ZIG_TABLE;
      const annualPaye = calculateProgressiveTax(annualTaxable, table);
      const annualAidsLevy = annualPaye * AIDS_LEVY_RATE;

      // 4. Compare
      const taxPaid = record.ytdTaxPaid || 0;
      const totalLiability = annualPaye + annualAidsLevy; // Compare Total vs Total
      
      // Note: ytdTaxPaid usually implies PAYE + AIDS Levy in user inputs, 
      // but sometimes just PAYE. We will assume it covers the total tax bill.
      
      const variance = totalLiability - taxPaid;

      let status: "Balanced" | "Underpaid" | "Overpaid" = "Balanced";
      if (variance > 1) status = "Underpaid"; // Allow small tolerance
      if (variance < -1) status = "Overpaid";

      results.push({
          employeeId: record.employeeId,
          name: record.name,
          currency: currency,
          annualGross: gross,
          annualTaxable: annualTaxable,
          correctAnnualTax: annualPaye,
          correctAidsLevy: annualAidsLevy,
          taxPaidYtd: taxPaid,
          variance: variance,
          status: status
      });
  }

  return results;
}
