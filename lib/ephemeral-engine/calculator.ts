import { RawPayrollRecord, TaxResult, TaxConfig } from "./types";
import { USD_TAX_TABLE_2025, ZIG_TAX_TABLE_2025, NSSA_CONFIG, NEC_CONFIG, AIDS_LEVY_RATE, TaxBracket } from "./tax-tables";

export function calculateTax(record: RawPayrollRecord, config: Partial<TaxConfig> = {}): TaxResult {
  const currency = record.currency;
  const grossIncome = record.basicSalary + (record.allowances || 0); // Include allowances
  
  // Configuration with Fallbacks
  const nssaRate = config.nssaRate ?? NSSA_CONFIG.rate;
  const nssaCeiling = currency === "USD" 
      ? (config.nssaCeilingUSD ?? NSSA_CONFIG.usdCeiling) 
      : (config.nssaCeilingZiG ?? NSSA_CONFIG.zigCeiling);
  
  const necRate = config.necRate ?? NEC_CONFIG.rate;
  const sdfRate = config.sdfRate ?? 0.01;

  // 1. Calculate NSSA (Pension)
  // Limited by ceiling * rate
  // If nssaEnabled is explicitly false, skip. Default to true.
  const nssaEnabled = config.nssaEnabled ?? true;
  let nssa = 0;
  if (nssaEnabled) {
      const nssaInsurable = Math.min(grossIncome, nssaCeiling);
      nssa = nssaInsurable * nssaRate;
  }

  // 2. Calculate NEC (National Employment Council)
  // If necEnabled is explicitly false, skip. Default to false (per original config).
  const necEnabled = config.necEnabled ?? NEC_CONFIG.rate > 0;
  let nec = 0;
  if (necEnabled) {
      nec = grossIncome * necRate;
  }

  // 3. Determine Taxable Income
  // Deduct NSSA & NEC from Gross
  const taxableIncome = grossIncome - nssa - nec;

  // 4. Apply Tax Tables (PAYE)
  let paye = 0;
  const table = currency === "USD" ? USD_TAX_TABLE_2025 : ZIG_TAX_TABLE_2025;
  paye = calculateProgressiveTax(taxableIncome, table);

  // 5. Calculate AIDS Levy (3% of PAYE)
  const aidsLevy = paye * AIDS_LEVY_RATE;

  // 6. Total Deductions & Net Pay
  const totalDeductions = nssa + nec + paye + aidsLevy;
  const netPay = grossIncome - totalDeductions;

  // 7. Calculate Employer Costs (SDF)
  // Usually 1% of total wage bill. We calc per employee.
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
    currency: currency
  } as TaxResult;
}

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
