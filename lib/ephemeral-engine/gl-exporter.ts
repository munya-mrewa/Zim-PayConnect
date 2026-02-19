import { TaxResult, RawPayrollRecord } from "./types";

type FullRecord = RawPayrollRecord & { taxResult: TaxResult };

export function generateGLCSV(records: FullRecord[], orgName: string): string {
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

  // 2. Journal Entries (Double Entry)
  // Format: Date, Reference, Description, AccountCode (Placeholder), Debit, Credit
  
  const lines = [
      `Date,Reference,Description,Account,Debit,Credit`
  ];

  // DEBITS (Expenses)
  lines.push(`${today},${reference},Salaries & Wages Expense,,${totalGross.toFixed(2)},0.00`);
  lines.push(`${today},${reference},Employer NSSA Expense,,${totalNSSA_Employer.toFixed(2)},0.00`);
  lines.push(`${today},${reference},Employer NEC Expense,,${totalNEC_Employer.toFixed(2)},0.00`);
  lines.push(`${today},${reference},SDF Expense,,${totalSDF_Employer.toFixed(2)},0.00`);

  // CREDITS (Liabilities)
  lines.push(`${today},${reference},Net Salaries Payable,,0.00,${totalNetPay.toFixed(2)}`);
  lines.push(`${today},${reference},PAYE Payable,,0.00,${totalPAYE.toFixed(2)}`);
  lines.push(`${today},${reference},AIDS Levy Payable,,0.00,${totalAidsLevy.toFixed(2)}`);
  lines.push(`${today},${reference},NSSA Payable,,0.00,${totalNSSA_Payable.toFixed(2)}`);
  lines.push(`${today},${reference},NEC Payable,,0.00,${totalNEC_Payable.toFixed(2)}`);
  lines.push(`${today},${reference},SDF Payable,,0.00,${totalSDF_Employer.toFixed(2)}`);

  return lines.join("\n");
}
