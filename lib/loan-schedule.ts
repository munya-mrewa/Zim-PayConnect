import { sanitizeCsvCell } from "@/lib/utils";
import { RawPayrollRecord } from "@/lib/ephemeral-engine/types";

export interface LoanScheduleRow {
  employeeId: string;
  name: string;
  installmentNumber: number;
  periodLabel: string;
  openingBalance: number;
  principalComponent: number;
  interestComponent: number;
  installmentAmount: number;
  closingBalance: number;
}

/**
 * Simple annuity loan amortization (equal installments each month).
 * All calculations are ephemeral and derived solely from the CSV metadata per record.
 */
export function buildLoanScheduleForRecord(
  record: RawPayrollRecord,
): LoanScheduleRow[] {
  const principal = record.loanPrincipal;
  const annualRate = record.loanAnnualRate;
  const termMonths = record.loanTermMonths;

  if (
    !principal ||
    principal <= 0 ||
    !annualRate ||
    annualRate < 0 ||
    !termMonths ||
    termMonths <= 0
  ) {
    return [];
  }

  const monthlyRate = annualRate / 12;

  // If interest rate is zero, straight-line principal over term
  let installment = 0;
  if (monthlyRate === 0) {
    installment = principal / termMonths;
  } else {
    // Standard annuity formula: A = P * r / (1 - (1 + r)^-n)
    const factor = Math.pow(1 + monthlyRate, termMonths);
    installment = principal * (monthlyRate * factor) / (factor - 1);
  }

  const rows: LoanScheduleRow[] = [];
  let balance = principal;

  for (let n = 1; n <= termMonths; n++) {
    const interest = balance * monthlyRate;
    const principalComponent =
      monthlyRate === 0 ? installment : installment - interest;
    const closingBalance = balance - principalComponent;

    rows.push({
      employeeId: record.employeeId,
      name: record.name,
      installmentNumber: n,
      periodLabel: record.period || `Month ${n}`,
      openingBalance: balance,
      principalComponent,
      interestComponent: interest,
      installmentAmount: installment,
      closingBalance: closingBalance < 0 ? 0 : closingBalance,
    });

    balance = closingBalance;
    if (balance <= 0) break;
  }

  return rows;
}

export function buildLoanScheduleCsv(records: RawPayrollRecord[]): string | null {
  const header =
    "EmployeeID,Name,Installment_No,Period,Opening_Balance,Principal,Interest,Installment,Closing_Balance\n";
  let body = "";

  records.forEach((r) => {
    const schedule = buildLoanScheduleForRecord(r);
    if (!schedule.length) return;

    schedule.forEach((row) => {
      body += [
        sanitizeCsvCell(row.employeeId),
        sanitizeCsvCell(row.name),
        row.installmentNumber,
        sanitizeCsvCell(row.periodLabel),
        row.openingBalance.toFixed(2),
        row.principalComponent.toFixed(2),
        row.interestComponent.toFixed(2),
        row.installmentAmount.toFixed(2),
        row.closingBalance.toFixed(2),
      ].join(",") + "\n";
    });
  });

  if (!body) return null;
  return header + body;
}

