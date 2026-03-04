import { RawPayrollRecord } from './types';

// ZIMRA TIN format is exactly 10 digits
export const ZIMRA_TIN_REGEX = /^\d{10}$/;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateRecord(record: RawPayrollRecord): ValidationResult {
  const errors: string[] = [];

  if (!record.employeeId || record.employeeId.trim() === '') {
    errors.push("Employee ID is required");
  }

  if (!record.name || record.name.trim() === '') {
    errors.push("Employee name is required");
  }

  if (record.basicSalary === undefined || isNaN(record.basicSalary) || record.basicSalary < 0) {
    errors.push("Basic salary must be a valid positive number");
  }

  // Strict ZIMRA TIN Validation
  if (record.tin !== undefined && record.tin.trim() !== '') {
    const cleanTIN = record.tin.replace(/[^0-9]/g, '');
    if (!ZIMRA_TIN_REGEX.test(cleanTIN)) {
        errors.push(`Invalid TIN format: '${record.tin}'. ZIMRA TINs must be exactly 10 digits.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
