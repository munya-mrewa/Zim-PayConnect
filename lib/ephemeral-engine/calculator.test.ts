import { describe, it, expect } from "vitest";
import { calculateTax } from "./calculator";
import { RawPayrollRecord } from "./types";

describe("Tax Calculator Engine", () => {
  
  describe("USD Calculations", () => {
    it("should handle tax-free income (below threshold)", () => {
      const record: RawPayrollRecord = {
        employeeId: "001",
        name: "Low Earner",
        basicSalary: 90,
        currency: "USD",
        period: "2026-02",
        isPermanent: true
      };

      const result = calculateTax(record);
      
      // NSSA: 90 * 0.045 = 4.05
      expect(result.nssa).toBeCloseTo(4.05, 2);
      
      // Taxable: 90 - 4.05 = 85.95 (Below 100)
      expect(result.paye).toBe(0);
      expect(result.aidsLevy).toBe(0);
      expect(result.netPay).toBeCloseTo(85.95, 2);
    });

    it("should calculate progressive tax for middle income", () => {
      const record: RawPayrollRecord = {
        employeeId: "002",
        name: "Mid Earner",
        basicSalary: 500,
        currency: "USD",
        period: "2026-02",
        isPermanent: true
      };

      const result = calculateTax(record);

      // NSSA: 500 * 0.045 = 22.50
      expect(result.nssa).toBeCloseTo(22.50, 2);

      // Taxable: 500 - 22.50 = 477.50
      // Tax Brackets:
      // 0-100: 0
      // 100-300: 200 * 0.20 = 40.00
      // 300-477.50: 177.50 * 0.25 = 44.375
      // Total PAYE: 84.375
      expect(result.paye).toBeCloseTo(84.38, 2);

      // AIDS Levy: 84.375 * 0.03 = 2.53125
      expect(result.aidsLevy).toBeCloseTo(2.53, 2);

      // Net Pay
      const deductions = 22.50 + 84.375 + 2.53125;
      expect(result.netPay).toBeCloseTo(500 - deductions, 2);
    });

    it("should respect NSSA Insurable Earning Ceiling", () => {
      const record: RawPayrollRecord = {
        employeeId: "003",
        name: "High Earner",
        basicSalary: 2000,
        currency: "USD",
        period: "2026-02",
        isPermanent: true
      };

      const result = calculateTax(record);

      // Ceiling is 700. NSSA = 700 * 0.045 = 31.50
      expect(result.nssa).toBeCloseTo(31.50, 2);
      
      // Check it didn't calculate on full 2000 (which would be 90)
      expect(result.nssa).not.toBeCloseTo(90, 2);
    });
  });

  describe("ZiG Calculations", () => {
    it("should handle ZiG tax calculations", () => {
      const record: RawPayrollRecord = {
        employeeId: "Z01",
        name: "ZiG Earner",
        basicSalary: 10000,
        currency: "ZiG",
        period: "2026-02",
        isPermanent: true
      };

      const result = calculateTax(record);

      // NSSA Ceiling ZiG is 19600. Salary 10000 is below.
      // NSSA: 10000 * 0.045 = 450
      expect(result.nssa).toBeCloseTo(450, 2);

      // Taxable: 9550
      // Brackets (ZiG):
      // 0-2800: 0
      // 2800-8400: 5600 * 0.20 = 1120
      // 8400-9550: 1150 * 0.25 = 287.5
      // Total PAYE: 1407.5
      expect(result.paye).toBeCloseTo(1407.50, 2);
      
      // AIDS Levy: 1407.5 * 0.03 = 42.225
      expect(result.aidsLevy).toBeCloseTo(42.23, 2);
    });
  });

  describe("Configuration Overrides", () => {
    it("should allow disabling NSSA via config", () => {
       const record: RawPayrollRecord = {
        employeeId: "004",
        name: "Exempt",
        basicSalary: 500,
        currency: "USD",
        period: "2026-02",
        isPermanent: true
      };

      const result = calculateTax(record, { nssaEnabled: false });
      expect(result.nssa).toBe(0);
      
      // Taxable should be full 500 now
      // 0-100: 0
      // 100-300: 40
      // 300-500: 200 * 0.25 = 50
      // Total: 90
      expect(result.paye).toBeCloseTo(90, 2);
    });
  });

});
