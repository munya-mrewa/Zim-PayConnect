import { TaxResult, RawPayrollRecord } from "./types";

type FullRecord = RawPayrollRecord & { taxResult: TaxResult };

export type GLFormat = "STANDARD" | "SAGE" | "QUICKBOOKS";

export function generateGLCSV(records: FullRecord[], orgName: string, format: GLFormat = "STANDARD"): string {
  // 1. Aggregates
  let totalBasic = 0;
  let totalAllowances = 0;
  let totalGross = 0;
  let totalNSSA_Employee = 0;
  let totalNEC_Employee = 0;
  let totalPAYE = 0;
  let totalAidsLevy = 0;
  let totalNetPay = 0;
  let totalSDF_Employer = 0;
  // We assume Employer NSSA matches Employee NSSA for simplicity in this ephemeral mode
  // unless we have specific employer calc logic. Usually it's 1:1 up to ceiling.
  // So Total NSSA Payable = Employee * 2.
  
  records.forEach(r => {
      const t = r.taxResult;
      totalBasic += r.basicSalary;
      totalAllowances += (r.allowances || 0);
      totalGross += t.grossIncome;
      totalNSSA_Employee += t.nssa;
      totalNEC_Employee += (t.nec || 0);
      totalPAYE += t.paye;
      totalAidsLevy += t.aidsLevy;
      totalNetPay += t.netPay;
      totalSDF_Employer += (t.sdf || 0);
  });

  const totalNSSA_Employer = totalNSSA_Employee; // 1:1 match assumption
  const totalNEC_Employer = totalNEC_Employee; // Often 1:1 match too
  const totalNSSA_Payable = totalNSSA_Employee + totalNSSA_Employer;
  const totalNEC_Payable = totalNEC_Employee + totalNEC_Employer;

  const today = new Date().toISOString().split('T')[0];
  const reference = `PAYROLL-${today}`;
  const period = new Date().getMonth() + 1; // Sage Period (1-12)

  // 2. Journal Entries (Double Entry)
  
  let header = "";
  let rows: string[] = [];

  const addRow = (desc: string, debit: number, credit: number) => {
      if (format === "SAGE") {
          // Period,Date,Reference,Description,Account,Debit,Credit,TaxType
          rows.push(`${period},${today},${reference},${desc},,${debit.toFixed(2)},${credit.toFixed(2)},00`);
      } else if (format === "QUICKBOOKS") {
          // Date,RefNumber,Account,Memo,Debit,Credit
          rows.push(`${today},${reference},,${desc},${debit.toFixed(2)},${credit.toFixed(2)}`);
      } else {
          // STANDARD: Date,Reference,Description,Account,Debit,Credit
          rows.push(`${today},${reference},${desc},,${debit.toFixed(2)},${credit.toFixed(2)}`);
      }
  };

  if (format === "SAGE") {
      header = `Period,Date,Reference,Description,Account,Debit,Credit,TaxType`;
  } else if (format === "QUICKBOOKS") {
      header = `Date,RefNumber,Account,Memo,Debit,Credit`;
  } else {
      header = `Date,Reference,Description,Account,Debit,Credit`;
  }

  // DEBITS (Expenses)
  addRow("Salaries & Wages Expense", totalGross, 0);
  addRow("Employer NSSA Expense", totalNSSA_Employer, 0);
  addRow("Employer NEC Expense", totalNEC_Employer, 0);
  addRow("SDF Expense", totalSDF_Employer, 0);

  // CREDITS (Liabilities)
  addRow("Net Salaries Payable", 0, totalNetPay);
  addRow("PAYE Payable", 0, totalPAYE);
  addRow("AIDS Levy Payable", 0, totalAidsLevy);
  addRow("NSSA Payable", 0, totalNSSA_Payable);
  addRow("NEC Payable", 0, totalNEC_Payable);
  addRow("SDF Payable", 0, totalSDF_Employer);

  return [header, ...rows].join("\n");
}
