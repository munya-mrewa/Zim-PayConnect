import { validateRecord } from "../lib/ephemeral-engine/validator";
import { calculateTax } from "../lib/ephemeral-engine/calculator";
import { generateZimraXml } from "../lib/xml-generator";
import { RawPayrollRecord, TaxConfig } from "../lib/ephemeral-engine/types";
import { NSSA_CONFIG } from "../lib/ephemeral-engine/tax-tables";

// Mock Data
const validRecord: RawPayrollRecord = {
  employeeId: "INT01",
  name: "Integration User",
  basicSalary: 2000,
  currency: "USD",
  tin: "1234567890", // Valid 10-digit TIN
  isPermanent: true
};

const invalidRecord: RawPayrollRecord = {
  employeeId: "INT02",
  name: "Bad User",
  basicSalary: -100, // Invalid Salary
  currency: "USD",
  isPermanent: true
};

const config: Partial<TaxConfig> = {
  defaultCurrency: "USD",
  nssaEnabled: true,
  nssaRate: NSSA_CONFIG.rate,
  nssaCeilingUSD: NSSA_CONFIG.usdCeiling,
  nssaCeilingZiG: NSSA_CONFIG.zigCeiling
};

async function runIntegrationCheck() {
  console.log("🚀 Starting System Integration Check...");

  // 1. Validation Layer
  console.log("\n1️⃣  Checking Validation Layer...");
  const v1 = validateRecord(validRecord);
  if (!v1.isValid) throw new Error("Valid record failed validation!");
  console.log("   ✅ Valid record passed.");

  const v2 = validateRecord(invalidRecord);
  if (v2.isValid) throw new Error("Invalid record passed validation!");
  console.log("   ✅ Invalid record correctly rejected.");

  // 2. Calculation Layer
  console.log("\n2️⃣  Checking Calculation Logic...");
  const taxResult = calculateTax(validRecord, config);
  if (taxResult.grossIncome !== 2000) throw new Error("Gross Income Mismatch");
  // NSSA on 700 ceiling = 31.5
  if (Math.abs(taxResult.nssa - 31.5) > 0.1) throw new Error("NSSA Calculation Error");
  console.log("   ✅ Tax Engine produced correct figures.");

  // 3. Document Generation Layer (Data Handoff)
  console.log("\n3️⃣  Checking Document Generation (Architecture Sync)...");
  try {
      // Combine for XML Gen
      const fullRecord = { ...validRecord, taxResult };
      const xml = generateZimraXml([fullRecord], "Test Corp", "999999");
      
      if (!xml.includes("<NSSA>31.50</NSSA>")) throw new Error("XML missing NSSA value");
      if (!xml.includes("<TIN>1234567890</TIN>")) throw new Error("XML missing TIN");
      console.log("   ✅ XML Generator received calculated data correctly.");
  } catch (e) {
      console.error("   ❌ Document Generation Failed:", e);
      throw e;
  }

  console.log("\n🎉 Integration SUCCESS: Logic, Validation, and Architecture are working in sync.");
}

runIntegrationCheck().catch(e => {
  console.error("\n❌ Integration FAILED:", e);
  process.exit(1);
});
