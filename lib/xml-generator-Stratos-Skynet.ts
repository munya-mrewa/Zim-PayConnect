import { TaxResult, RawPayrollRecord } from "@/lib/ephemeral-engine/types";

type FullRecord = RawPayrollRecord & { taxResult: TaxResult };

export function generateZimraXml(records: FullRecord[], orgName: string, tin: string): string {
  // ISO Date for file generation
  const generatedAt = new Date().toISOString();
  
  // Basic XML Header and Root
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<ZimraReturn xmlns="http://www.zimra.co.zw/XMLSchema/TaRMS/v1">
  <Header>
    <OrganizationName>${escapeXml(orgName)}</OrganizationName>
    <TIN>${escapeXml(tin)}</TIN>
    <SubmissionDate>${generatedAt}</SubmissionDate>
    <RecordCount>${records.length}</RecordCount>
    <ReturnType>PAYE_MONTHLY</ReturnType>
  </Header>
  <Employees>
`;

  // Iterate records
  records.forEach(record => {
    const t = record.taxResult;
    xml += `    <Employee>
      <EmployeeID>${escapeXml(record.employeeId)}</EmployeeID>
      <Name>${escapeXml(record.name)}</Name>
      <TIN>${escapeXml(record.tin || "")}</TIN>
      <EmploymentStatus>${record.isPermanent ? "PERMANENT" : "CASUAL"}</EmploymentStatus>
      <Earnings>
        <BasicSalary>${record.basicSalary.toFixed(2)}</BasicSalary>
        <Allowances>${(record.allowances || 0).toFixed(2)}</Allowances>
        <GrossIncome>${t.grossIncome.toFixed(2)}</GrossIncome>
      </Earnings>
      <Deductions>
        <NSSA>${t.nssa.toFixed(2)}</NSSA>
        <NEC>${(t.nec || 0).toFixed(2)}</NEC>
        <Pension>0.00</Pension>
      </Deductions>
      <TaxCalculation>
        <TaxableIncome>${t.taxableIncome.toFixed(2)}</TaxableIncome>
        <PAYE>${t.paye.toFixed(2)}</PAYE>
        <AidsLevy>${t.aidsLevy.toFixed(2)}</AidsLevy>
        <TaxMethod>${t.method || "PAYE"}</TaxMethod>
      </TaxCalculation>
      <NetPay>${t.netPay.toFixed(2)}</NetPay>
    </Employee>
`;
  });

  // Close Root
  xml += `  </Employees>
</ZimraReturn>`;

  return xml;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
    }
    return c;
  });
}
