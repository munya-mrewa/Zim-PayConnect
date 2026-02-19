import { RawPayrollRecord, ValidationResult } from "./types";

export function validateRecord(record: RawPayrollRecord): ValidationResult {
  const errors: string[] = [];

  // 1. Required Fields
  if (!record.employeeId || record.employeeId.trim() === "") {
    errors.push("Employee ID is required");
  }

  if (!record.name || record.name.trim().length < 2) {
    errors.push("Name is required and must be at least 2 characters");
  }

  if (record.basicSalary === undefined || record.basicSalary === null || isNaN(record.basicSalary)) {
    errors.push("Basic Salary is required and must be a number");
  } else if (record.basicSalary < 0) {
    errors.push("Basic Salary cannot be negative");
  }

  if (record.allowances !== undefined && record.allowances < 0) {
      errors.push("Allowances cannot be negative");
  }

  if (record.ytdGross !== undefined && (isNaN(record.ytdGross) || record.ytdGross < 0)) {
      errors.push("YTD Gross must be a non-negative number");
  }

  if (record.ytdTaxPaid !== undefined && (isNaN(record.ytdTaxPaid) || record.ytdTaxPaid < 0)) {
      errors.push("YTD Tax Paid must be a non-negative number");
  }

  // 2. Currency Validation
  if (record.currency !== "USD" && record.currency !== "ZiG") {
    errors.push(`Invalid Currency: ${record.currency}. Must be 'USD' or 'ZiG'.`);
  }

  // 3. ZIMRA TIN Validation (Optional but strict if present)
  // ZIMRA TINs are numeric. Usually 6 to 10 digits.
  if (record.tin && record.tin.trim() !== "") {
    // Remove spaces/dashes for check
    const cleanTin = record.tin.replace(/[\s-]/g, "");
    if (!/^\d{6,10}$/.test(cleanTin)) {
      errors.push(`Invalid TIN format: ${record.tin}. Must be 6-10 digits.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}
