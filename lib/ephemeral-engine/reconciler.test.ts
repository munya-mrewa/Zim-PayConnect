import { describe, it, expect } from "vitest";
import { reconcileYearEnd } from "./reconciler";
import { RawPayrollRecord } from "./types";

describe("Year-End Reconciliation Engine (FDS)", () => {
  
  it("should calculate annual tax liability correctly for USD", () => {
    // Scenario: Employee earns $500/month. 
    // Annual Gross = $6000.
    // Annual NSSA = 6000 * 0.045 = 270 (Well below annual ceiling of 8400)
    // Taxable = 5730.
    
    // Annual Tax Brackets (x12):
    // 0 - 1200: 0%
    // 1200 - 3600: 20% -> 2400 * 0.2 = 480
    // 3600 - 12000: 25% -> (5730 - 3600) * 0.25 = 2130 * 0.25 = 532.5
    // Total PAYE = 480 + 532.5 = 1012.5
    // AIDS Levy = 1012.5 * 0.03 = 30.375
    // Total Liability = 1042.875
    
    const record: RawPayrollRecord = {
        employeeId: "REC01",
        name: "Steady Earner",
        basicSalary: 6000, // Annual Figure
        currency: "USD",
        isPermanent: true,
        ytdTaxPaid: 1042.88 // Assume they paid roughly correct
    };

    const results = reconcileYearEnd([record]);
    const res = results[0];

    expect(res.annualGross).toBe(6000);
    expect(res.correctAnnualTax).toBeCloseTo(1012.5, 1);
    expect(res.correctAidsLevy).toBeCloseTo(30.38, 1);
    
    // Variance check
    expect(res.variance).toBeCloseTo(0, 1);
    expect(res.status).toBe("Balanced");
  });

  it("should detect underpayment", () => {
    const record: RawPayrollRecord = {
        employeeId: "REC02",
        name: "Underpayer",
        basicSalary: 6000, 
        currency: "USD",
        isPermanent: true,
        ytdTaxPaid: 800 // Paid significantly less than 1042
    };

    const results = reconcileYearEnd([record]);
    const res = results[0];

    expect(res.status).toBe("Underpaid");
    expect(res.variance).toBeGreaterThan(200);
  });

  it("should detect overpayment", () => {
    const record: RawPayrollRecord = {
        employeeId: "REC03",
        name: "Overpayer",
        basicSalary: 6000, 
        currency: "USD",
        isPermanent: true,
        ytdTaxPaid: 1200 // Paid more than 1042
    };

    const results = reconcileYearEnd([record]);
    const res = results[0];

    expect(res.status).toBe("Overpaid");
    expect(res.variance).toBeLessThan(-100);
  });

});
