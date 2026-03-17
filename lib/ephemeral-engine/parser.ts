import { RawPayrollRecord, ColumnMapping } from "./types";
import { parse } from "csv-parse";
import { Readable } from "stream";

export class MappingRequiredError extends Error {
  headers: string[];
  constructor(headers: string[]) {
    super("Column mapping required");
    this.name = "MappingRequiredError";
    this.headers = headers;
  }
}

export function parseCSV(fileBuffer: Buffer): RawPayrollRecord[] {
  const content = fileBuffer.toString('utf-8');
  // Handle different newline formats
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

  const records: RawPayrollRecord[] = [];

  // Skip Header (Simple assumption: first line is header)
  const dataLines = lines.slice(1);

  for (const line of dataLines) {
    const cols = line.split(',').map(c => c.trim());

    if (cols.length < 4) continue; 

    // Test Input: ID,Name,TIN,Salary,Currency,Permanent
    const id = cols[0];
    const name = cols[1];
    const salaryStr = cols[3]; 
    const currencyStr = cols[4]; 

    if (!id || !name || !salaryStr) continue;

    const salary = parseFloat(salaryStr);
    
    if (isNaN(salary) || salary <= 0) continue; 

    let currency: "USD" | "ZiG" = "ZiG";
    if (currencyStr) {
        const c = currencyStr.toUpperCase();
        if (c === 'USD') currency = 'USD';
        else if (c === 'ZIG' || c === 'ZWG') currency = 'ZiG';
    }

    records.push({
      employeeId: id,
      name: name,
      basicSalary: salary,
      currency: currency,
      isPermanent: cols[5]?.toLowerCase() === 'true'
    });
  }

  return records;
}

function normalize(h: string) {
    return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function* parseCSVStream(stream: Readable, mapping?: ColumnMapping): AsyncGenerator<RawPayrollRecord> {
  const parser = stream.pipe(parse({
    columns: false, 
    trim: true,
    skip_empty_lines: true
  }));

  let headers: string[] | null = null;
  let indices: (Record<keyof ColumnMapping, number> & {
    // Ensure we always have numeric indices, but we'll mark unknowns as -1
  }) | null = null;

  for await (const record of parser) {
    if (!headers) {
        headers = record as string[];
        
        // 1. Identify Indices
        const headerMap = new Map(headers.map((h, i) => [normalize(h), i]));

        // Helper to find index
        const find = (keys: string[], mappedName?: string): number => {
            if (mappedName) {
                 const idx = headers!.indexOf(mappedName);
                 if (idx !== -1) return idx;
            }
            // Try heuristics
            for (const key of keys) {
                if (headerMap.has(normalize(key))) return headerMap.get(normalize(key))!;
            }
            return -1;
        };

        const idIdx = find(["id", "employeeid", "empid", "staffid", "code"], mapping?.employeeId);
        const nameIdx = find(["name", "fullname", "employee", "employeename"], mapping?.name);
        const salaryIdx = find(["salary", "basic", "basicsalary", "gross", "amount", "income"], mapping?.basicSalary);
        
        // Optional fields
        const tinIdx = find(["tin", "taxid"], mapping?.tin);
        const currIdx = find(["currency", "curr", "denomination"], mapping?.currency);
        const permIdx = find(["permanent", "ispermanent", "type", "contract"], mapping?.isPermanent);
        const ytdTaxIdx = find(["ytdtax", "taxpaid", "yeartodate", "ptd"], mapping?.ytdTaxPaid);
        const ytdGrossIdx = find(["ytdgross", "grossytd", "totalgross", "cumgross", "grosstodate"], mapping?.ytdGross);
        
        const exemptIdx = find(["exempt", "taxfree", "nontaxable", "exemptallowance"], mapping?.exemptAllowances);
        const allowIdx = find(["allowance", "allowances", "benefits"], mapping?.allowances);

        const nationalIdIdx = find(["nationalid", "idnumber", "id_no"], mapping?.nationalId);

        // Master data enrichment (optional)
        const departmentIdx = find(["department", "dept"], mapping?.department);
        const costCenterIdx = find(["costcenter", "costcentre", "cost_centre"], mapping?.costCenter);
        const bankNameIdx = find(["bank", "bankname"], mapping?.bankName);
        const bankLast4Idx = find(["accountlast4", "acctlast4", "banklast4"], mapping?.bankAccountLast4);

        // Loan / advance (optional)
        const loanPrincipalIdx = find(["loanprincipal", "loan_amount", "principal"], mapping?.loanPrincipal);
        const loanRateIdx = find(["loanrate", "loaninterestrate", "rate"], mapping?.loanAnnualRate);
        const loanTermIdx = find(["loanterm", "loanmonths", "termmonths"], mapping?.loanTermMonths);
        const loanInstallmentIdx = find(["installmentno", "installment", "instalment"], mapping?.loanInstallmentNumber);

        // Check required
        if (idIdx === -1 || nameIdx === -1 || salaryIdx === -1) {
            throw new MappingRequiredError(headers);
        }

        indices = {
            employeeId: idIdx,
            name: nameIdx,
            basicSalary: salaryIdx,
            tin: tinIdx,
            currency: currIdx,
            isPermanent: permIdx,
            ytdTaxPaid: ytdTaxIdx,
            ytdGross: ytdGrossIdx,
            exemptAllowances: exemptIdx,
            allowances: allowIdx,
            department: departmentIdx,
            costCenter: costCenterIdx,
            bankName: bankNameIdx,
            bankAccountLast4: bankLast4Idx,
            nationalId: nationalIdIdx,
            necGrade: find(["necgrade", "grade"], mapping?.necGrade),
            loanPrincipal: loanPrincipalIdx,
            loanAnnualRate: loanRateIdx,
            loanTermMonths: loanTermIdx,
            loanInstallmentNumber: loanInstallmentIdx,
        };
        continue;
    }

    if (!indices) continue; 

    const id = record[indices.employeeId];
    const name = record[indices.name];
    const salaryStr = record[indices.basicSalary];
    
    // Optional
    const tin = indices.tin !== -1 ? record[indices.tin] : undefined;
    const currencyStr = indices.currency !== -1 ? record[indices.currency] : undefined;
    const permanentStr = indices.isPermanent !== -1 ? record[indices.isPermanent] : undefined;
    
    const ytdTaxPaidStr = indices.ytdTaxPaid !== -1 ? record[indices.ytdTaxPaid] : undefined;
    const ytdTaxPaid = ytdTaxPaidStr ? parseFloat(ytdTaxPaidStr.replace(/[^0-9.-]/g, '')) : undefined;

    const ytdGrossStr = indices.ytdGross !== -1 ? record[indices.ytdGross] : undefined;
    const ytdGross = ytdGrossStr ? parseFloat(ytdGrossStr.replace(/[^0-9.-]/g, '')) : undefined;

    const exemptStr = indices.exemptAllowances !== -1 ? record[indices.exemptAllowances] : undefined;
    const exemptAllowances = exemptStr ? parseFloat(exemptStr.replace(/[^0-9.-]/g, '')) : undefined;

    const allowStr = indices.allowances !== -1 ? record[indices.allowances] : undefined;
    const allowances = allowStr ? parseFloat(allowStr.replace(/[^0-9.-]/g, '')) : undefined;

    const department = indices.department !== -1 ? record[indices.department] : undefined;
    const costCenter = indices.costCenter !== -1 ? record[indices.costCenter] : undefined;
    const bankName = indices.bankName !== -1 ? record[indices.bankName] : undefined;
    const bankAccountLast4 = indices.bankAccountLast4 !== -1 ? record[indices.bankAccountLast4] : undefined;

    const nationalId = indices.nationalId !== -1 ? record[indices.nationalId] : undefined;
    const necGrade = indices.necGrade !== -1 ? record[indices.necGrade] : undefined;

    const loanPrincipalStr = indices.loanPrincipal !== -1 ? record[indices.loanPrincipal] : undefined;
    const loanPrincipal = loanPrincipalStr ? parseFloat(loanPrincipalStr.replace(/[^0-9.-]/g, '')) : undefined;

    const loanRateStr = indices.loanAnnualRate !== -1 ? record[indices.loanAnnualRate] : undefined;
    const loanAnnualRate = loanRateStr ? parseFloat(loanRateStr.replace(/[^0-9.-]/g, '')) : undefined;

    const loanTermStr = indices.loanTermMonths !== -1 ? record[indices.loanTermMonths] : undefined;
    const loanTermMonths = loanTermStr ? parseInt(loanTermStr.replace(/[^0-9]/g, ''), 10) : undefined;

    const loanInstStr = indices.loanInstallmentNumber !== -1 ? record[indices.loanInstallmentNumber] : undefined;
    const loanInstallmentNumber = loanInstStr ? parseInt(loanInstStr.replace(/[^0-9]/g, ''), 10) : undefined;

    if (!id || !name || !salaryStr) continue;

    const salary = parseFloat(salaryStr.replace(/[^0-9.-]/g, ''));
    if (isNaN(salary) || salary <= 0) continue;

    let validCurrency: "USD" | "ZiG" = "ZiG"; // Default
    
    if (currencyStr) {
        const c = currencyStr.toUpperCase();
        if (c === 'USD') validCurrency = 'USD';
        else if (c === 'ZIG' || c === 'ZWG') validCurrency = 'ZiG';
    } 

    yield {
      employeeId: id,
      name: name,
      tin: tin || undefined,
      basicSalary: salary,
      currency: validCurrency,
      isPermanent: permanentStr ? (permanentStr.toLowerCase() === 'true' || permanentStr.toLowerCase() === 'yes' || permanentStr === '1') : true,
      ytdTaxPaid: !isNaN(ytdTaxPaid!) ? ytdTaxPaid : undefined,
      ytdGross: !isNaN(ytdGross!) ? ytdGross : undefined,
      exemptAllowances: !isNaN(exemptAllowances!) ? exemptAllowances : undefined,
      allowances: !isNaN(allowances!) ? allowances : undefined,
      department: department || undefined,
      costCenter: costCenter || undefined,
      bankName: bankName || undefined,
      bankAccountLast4: bankAccountLast4 || undefined,
      nationalId: nationalId || undefined,
      necGrade: necGrade || undefined,
      loanPrincipal: !isNaN(loanPrincipal!) ? loanPrincipal : undefined,
      loanAnnualRate: !isNaN(loanAnnualRate!) ? loanAnnualRate : undefined,
      loanTermMonths: !isNaN(loanTermMonths!) ? loanTermMonths : undefined,
      loanInstallmentNumber: !isNaN(loanInstallmentNumber!) ? loanInstallmentNumber : undefined,
    };
  }
}
