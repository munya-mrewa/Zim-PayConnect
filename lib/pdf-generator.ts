import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JSZip from "jszip";
import { TaxResult, RawPayrollRecord } from "@/lib/ephemeral-engine/types";
import { generateZimraXml } from "@/lib/xml-generator";
import { generateGLCSV, GLFormat } from "@/lib/ephemeral-engine/gl-exporter";
import { sanitizeCsvCell, sanitizeFilename } from "@/lib/utils";
import { buildLoanScheduleCsv } from "@/lib/loan-schedule";

// Combine raw record and calculation result
type FullRecord = RawPayrollRecord & { taxResult: TaxResult };

export async function generatePayslipPDF(records: FullRecord | FullRecord[], orgName: string, logoUrl?: string | null, removeBranding: boolean = false): Promise<ArrayBuffer> {
  const doc = new jsPDF();
  const recordList = Array.isArray(records) ? records : [records];
  const primaryRecord = recordList[0];

  // If we have mixed currencies, we sort them USD first for consistency
  recordList.sort((a, b) => (a.currency === 'USD' ? -1 : 1));

  const yOffset = 20;

  // Add Logo if available
  if (logoUrl) {
    try {
        // Create an image element to load the logo
        // Note: In a browser environment, we might need to fetch the image data first
        // or use an existing Image object. For now, we'll try to add it directly if it's a base64 string
        // or a URL that jsPDF can handle (CORS might be an issue with external URLs).
        // Assuming Data URI or simple URL for now.
        
        // For simple URL implementation in client-side jsPDF:
        const img = new Image();
        img.src = logoUrl;
        await new Promise((resolve, reject) => {
             img.onload = resolve;
             img.onerror = reject;
        });
        
        // Calculate aspect ratio to fit in a box of 40x20
        const maxWidth = 40;
        const maxHeight = 20;
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;

        doc.addImage(img, "PNG", 14, 10, width, height);
    } catch (e) {
        console.warn("Failed to load logo", e);
    }
  }

  // Header
  doc.setFontSize(18);
  doc.text(orgName, 105, yOffset, { align: "center" });
  doc.setFontSize(14);
  doc.text("Payslip", 105, yOffset + 10, { align: "center" });
  
  doc.setFontSize(10);
  doc.text(`Employee: ${primaryRecord.name} (${primaryRecord.employeeId})`, 14, 45);
  doc.text(`TIN: ${primaryRecord.tin || "N/A"}`, 14, 50);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 45);
  
  // Dynamic header based on single vs multi-currency
  if (recordList.length > 1) {
      doc.text(`Currency: Multi (${recordList.map(r => r.currency).join(" & ")})`, 150, 50);
  } else {
      doc.text(`Currency: ${primaryRecord.currency}`, 150, 50);
      doc.text(`Tax Method: ${primaryRecord.taxResult.method || "PAYE"}`, 150, 55);
  }

  // Table Data Generation
  // If multi-currency, we create columns for each currency
  const head = [["Description"]];
  const colStyles: any = { 0: { cellWidth: 80 } };

  recordList.forEach((rec, index) => {
      head[0].push(`Amount (${rec.currency})`);
      // index + 1 because column 0 is Description
      colStyles[index + 1] = { cellWidth: 40, halign: "right" };
  });

  // Helper to get value safely
  const val = (rec: FullRecord, key: keyof RawPayrollRecord | keyof TaxResult) => {
      if (key in rec) return (rec as any)[key];
      if (key in rec.taxResult) return (rec.taxResult as any)[key];
      return 0;
  };

  const fmt = (v: number) => v.toFixed(2);

  // Rows structure
  const rows = [
    { label: "Basic Salary", key: "basicSalary" },
    { label: "Allowances", key: "allowances" },
    { label: "Exempt Allowances", key: "exemptAllowances", optional: true },
    { label: "Gross Income", key: "grossIncome", bold: true },
    { label: "", key: "spacer" },
    { label: "Deductions", key: "header" },
    { label: "NSSA (Pension)", key: "nssa", negative: true },
    { label: "NEC", key: "nec", negative: true },
    { label: "PAYE (Tax)", key: "paye", negative: true },
    { label: "AIDS Levy", key: "aidsLevy", negative: true },
    { label: "Total Deductions", key: "totalDeductions", bold: true, negative: true },
    { label: "", key: "spacer" },
    { label: "NET PAY", key: "netPay", highlight: true }
  ];

  const bodyData: any[] = [];

  rows.forEach(row => {
      if (row.key === "spacer") {
          bodyData.push(["", ...recordList.map(() => "")]);
          return;
      }
      if (row.key === "header") {
          bodyData.push([row.label, ...recordList.map(() => "")]);
          return;
      }

      // Check if optional row should be hidden (hide if ALL records have 0)
      if (row.optional) {
          const hasValue = recordList.some(r => val(r, row.key as any) > 0);
          if (!hasValue) return;
      }

      const line = [
          row.bold ? { content: row.label, styles: { fontStyle: "bold" } } 
                   : row.highlight ? { content: row.label, styles: { fillColor: [220, 255, 220], fontStyle: "bold", fontSize: 12 } }
                   : row.label
      ];

      recordList.forEach(rec => {
          const value = val(rec, row.key as any) || 0;
          let text = fmt(value);
          
          if (row.negative) text = `-${text}`;

          if (row.highlight) {
              line.push({ content: text, styles: { fillColor: [220, 255, 220], fontStyle: "bold", fontSize: 12 } });
          } else if (row.bold) {
              line.push({ content: text, styles: { fontStyle: "bold" } });
          } else {
              line.push(text);
          }
      });
      
      bodyData.push(line);
  });

  autoTable(doc, {
    startY: 65,
    head: head,
    body: bodyData,
    theme: "grid",
    headStyles: { fillColor: [40, 40, 40] },
    columnStyles: colStyles
  });

  // Footer
  if (!removeBranding) {
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(8);
      doc.text("Generated by Zim-PayConnect", 14, finalY);
  }
  
  return doc.output("arraybuffer");
}

export async function generateBatchZip(records: FullRecord[], orgName: string, logoUrl?: string | null, tin?: string, removeBranding: boolean = false, glFormat: GLFormat = "STANDARD"): Promise<Blob> {
  const zip = new JSZip();
  const rootFolder = zip.folder(`Payslips-${new Date().toISOString().split('T')[0]}`);

  // Group records by Employee ID for combined PDF generation
  const groupedRecords = new Map<string, FullRecord[]>();
  records.forEach(r => {
      const existing = groupedRecords.get(r.employeeId) || [];
      existing.push(r);
      groupedRecords.set(r.employeeId, existing);
  });

  // Categorize for FDS/Non-FDS folder structure (based on ANY record being FDS/Permanent)
  const fdsGroups: FullRecord[][] = [];
  const nonFdsGroups: FullRecord[][] = [];

  groupedRecords.forEach(group => {
      // If any record is permanent, we treat the employee as permanent for folder sorting
      const isPermanent = group.some(r => r.isPermanent !== false);
      if (isPermanent) {
          fdsGroups.push(group);
      } else {
          nonFdsGroups.push(group);
      }
  });

  const fdsFolder = fdsGroups.length > 0 ? rootFolder?.folder("FDS_Permanent") : null;
  const nonFdsFolder = nonFdsGroups.length > 0 ? rootFolder?.folder("Non_FDS_Casual") : null;

  // Helper to process a set of grouped records
  const processGroups = async (groups: FullRecord[][], folder: JSZip | null | undefined, summaryName: string) => {
    if (!groups.length || !folder) return;

    // PDFs
    for (const group of groups) {
      const primary = group[0];
      // Generate PDF with the whole group (supports multi-currency)
      const pdfBuffer = await generatePayslipPDF(group, orgName, logoUrl, removeBranding);
      const safeName = sanitizeFilename(primary.name, "employee");
      const safeId = sanitizeFilename(primary.employeeId, "id");
      const fileName = `${safeName}_${safeId}.pdf`;
      folder.file(fileName, pdfBuffer);
    }

    // CSV Summary - We still list every tax record as a separate row for reconciliation
    let csvContent = `EmployeeID,Name,Currency,Gross,NSSA,NEC,Taxable,PAYE,AIDS_Levy,NetPay,SDF_Employer,Method,YTD_Gross,YTD_Tax_Paid
`;
    // Flatten groups back to records for CSV line items
    const allRecordsInBatch = groups.flat();
    
    allRecordsInBatch.forEach(r => {
      const t = r.taxResult;
      const row = [
        sanitizeCsvCell(String(r.employeeId)),
        sanitizeCsvCell(String(r.name)),
        r.currency, // Added Currency Column
        t.grossIncome.toFixed(2),
        t.nssa.toFixed(2),
        (t.nec || 0).toFixed(2),
        t.taxableIncome.toFixed(2),
        t.paye.toFixed(2),
        t.aidsLevy.toFixed(2),
        t.netPay.toFixed(2),
        (t.sdf || 0).toFixed(2),
        sanitizeCsvCell(String(t.method || "PAYE")),
        String(r.ytdGross || 0),
        String(r.ytdTaxPaid || 0),
      ];
      csvContent += row.join(",") + "\n";
    });
    folder.file(summaryName, csvContent);
  };

  // Process both batches
  await processGroups(fdsGroups, fdsFolder, "FDS_Summary.csv");
  await processGroups(nonFdsGroups, nonFdsFolder, "Non_FDS_Summary.csv");

  // NSSA & NEC Contribution Schedules (POBF/NEC-friendly layouts)
  // For these schedules, we typically need to list every liable income line separately 
  // OR aggregate by employee if the return format demands it. 
  // ZIMRA/NSSA usually accepts separate lines per currency or separate returns. 
  // For simplicity and safety, we will list them as separate line items (which is what we did before).
  if (rootFolder) {
    const allRecords = records; // Use flat list

    // For NSSA we need organization context; we'll pass values via metadata in a future enhancement
    let nssaCsv = `Employer_Name,Employer_NSSA_Number,Employer_TIN,Pay_Year,Pay_Month,Currency,Employee_National_ID,Employee_NSSA_Number,Employee_Name,Employee_Payroll_No,Basic_Earnings,Other_Earnings,Total_Earnings,Employee_NSSA,Employer_NSSA,Total_NSSA
`;

    let necCsv = `Employer_Name,Employer_NEC_Number,Employer_TIN,Sector,Pay_Year,Pay_Month,Currency,Employee_Name,Employee_Payroll_No,NEC_Grade,Department,Cost_Center,Gross_Earnings,NEC_Employee,NEC_Employer,Total_NEC
`;

    const now = new Date();
    const payYear = now.getFullYear();
    const payMonth = (now.getMonth() + 1).toString().padStart(2, "0");

    allRecords.forEach((r) => {
      const t = r.taxResult;
      const gross = t.grossIncome;
      const otherEarnings = (r.allowances || 0) - (r.exemptAllowances || 0);

      if (t.nssa && t.nssa !== 0) {
        const employee = t.nssa;
        const employer = t.nssa; // 1:1 assumption
        const total = employee + employer;
        const row = [
          "", // Employer_Name
          "", // Employer_NSSA_Number
          "", // Employer_TIN
          payYear,
          payMonth,
          r.currency,
          sanitizeCsvCell(r.nationalId || ""),
          "", // Employee_NSSA_Number
          sanitizeCsvCell(r.name),
          sanitizeCsvCell(r.employeeId),
          r.basicSalary.toFixed(2),
          otherEarnings.toFixed(2),
          gross.toFixed(2),
          employee.toFixed(2),
          employer.toFixed(2),
          total.toFixed(2),
        ];
        nssaCsv += row.join(",") + "\n";
      }

      if (t.nec && t.nec !== 0) {
        const employeeNec = t.nec;
        const employerNec = t.nec; // 1:1 assumption
        const totalNec = employeeNec + employerNec;
        const row = [
          "", // Employer_Name
          "", // Employer_NEC_Number
          "", // Employer_TIN
          "", // Sector
          payYear,
          payMonth,
          r.currency,
          sanitizeCsvCell(r.name),
          sanitizeCsvCell(r.employeeId),
          sanitizeCsvCell(r.necGrade || ""),
          sanitizeCsvCell(r.department || ""),
          sanitizeCsvCell(r.costCenter || ""),
          gross.toFixed(2),
          employeeNec.toFixed(2),
          employerNec.toFixed(2),
          totalNec.toFixed(2),
        ];
        necCsv += row.join(",") + "\n";
      }
    });

    if (nssaCsv.trim().split("\n").length > 1) {
      rootFolder.file("NSSA_Contribution_Schedule.csv", nssaCsv);
    }
    if (necCsv.trim().split("\n").length > 1) {
      rootFolder.file("NEC_Return_Schedule.csv", necCsv);
    }
  }

  // Department / Cost Centre & Employer Cost Summaries
  // NOTE: Multi-currency aggregation is tricky (adding USD to ZiG is invalid).
  // We must split aggregation by currency.
  if (rootFolder) {
    type GroupKey = string;
    interface Agg {
      gross: number;
      net: number;
      employerCost: number;
    }

    // Map<"Currency_DeptName", Agg>
    const deptMap = new Map<GroupKey, Agg>();
    const costCenterMap = new Map<GroupKey, Agg>();
    
    // Map<Currency, number>
    const totalEmployerCost = new Map<string, number>();

    records.forEach((r) => {
      const t = r.taxResult;
      const cur = r.currency;
      const employerNssa = t.nssa;
      const employerNec = t.nec || 0;
      const employerSdf = t.sdf || 0;
      const employerCost = employerNssa + employerNec + employerSdf;
      
      const currentTotal = totalEmployerCost.get(cur) || 0;
      totalEmployerCost.set(cur, currentTotal + employerCost);

      const updateAgg = (map: Map<GroupKey, Agg>, key: string) => {
        const k = key || "Unspecified";
        const compositeKey = `${cur}:::${k}`; // Use separator to split later
        const current = map.get(compositeKey) || { gross: 0, net: 0, employerCost: 0 };
        current.gross += t.grossIncome;
        current.net += t.netPay;
        current.employerCost += employerCost;
        map.set(compositeKey, current);
      };

      if (r.department) {
        updateAgg(deptMap, r.department);
      }
      if (r.costCenter) {
        updateAgg(costCenterMap, r.costCenter);
      }
    });

    if (deptMap.size > 0) {
      let deptCsv = `Currency,Department,Gross,Net,Employer_Cost
`;
      for (const [key, agg] of deptMap.entries()) {
        const [cur, dept] = key.split(":::");
        const row = [
          cur,
          sanitizeCsvCell(dept),
          agg.gross.toFixed(2),
          agg.net.toFixed(2),
          agg.employerCost.toFixed(2),
        ];
        deptCsv += row.join(",") + "\n";
      }
      rootFolder.file("Department_Payroll_Summary.csv", deptCsv);
    }

    if (costCenterMap.size > 0) {
      let ccCsv = `Currency,Cost_Center,Gross,Net,Employer_Cost
`;
      for (const [key, agg] of costCenterMap.entries()) {
        const [cur, cc] = key.split(":::");
        const row = [
          cur,
          sanitizeCsvCell(cc),
          agg.gross.toFixed(2),
          agg.net.toFixed(2),
          agg.employerCost.toFixed(2),
        ];
        ccCsv += row.join(",") + "\n";
      }
      rootFolder.file("Cost_Center_Payroll_Summary.csv", ccCsv);
    }

    // Employer cost high-level summary
    if (records.length > 0) {
      let employerCsv = `Currency,Total_Employer_Cost,Total_Employee_Count
`;
      // Count unique employees per currency? Or total line items?
      // Usually total cost per currency is what matters.
      for (const [cur, cost] of totalEmployerCost.entries()) {
          // Count records with this currency
          const count = records.filter(r => r.currency === cur).length;
          employerCsv += `${cur},${cost.toFixed(2)},${count}\n`;
      }
      rootFolder.file("Employer_Cost_Summary.csv", employerCsv);
    }

    // Loan / Advance amortization schedule (if any loan metadata present)
    const loanCsv = buildLoanScheduleCsv(records);
    if (loanCsv) {
      rootFolder.file("Loan_Amortization_Schedule.csv", loanCsv);
    }
  }

  // Generate ZIMRA XML Return (Combined)
  if (tin) {
      try {
          const xmlContent = generateZimraXml(records, orgName, tin);
          rootFolder?.file("Zimra_Return_XML.xml", xmlContent);
      } catch (e) {
          console.warn("Failed to generate ZIMRA XML", e);
      }
  }

  // Generate GL Export (Combined)
  try {
      const glCsv = generateGLCSV(records, orgName, glFormat);
      rootFolder?.file("General_Ledger.csv", glCsv);
  } catch (e) {
      console.warn("Failed to generate GL CSV", e);
  }

  return await zip.generateAsync({ type: "blob" });
}
