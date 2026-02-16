import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { getPesepay } from "../lib/pesepay";

async function testPesepay() {
  console.log("🚀 Testing Pesepay Integration...");

  try {
    const pesepay = getPesepay();
    console.log("   ✅ Pesepay Client Initialized");

    // Create a dummy transaction
    const reference = "TEST-" + Date.now();
    const amount = 1.00; // $1.00 Test
    const currency = "USD";
    const reason = "Integration Connectivity Test";

    console.log("\n   Attempting to initiate transaction:");
    console.log(`   Ref: ${reference}`);
    console.log(`   Amt: ${amount} ${currency}`);

    const transaction = pesepay.createTransaction(amount, currency, reason, reference);
    
    // Attempt initiation
    const response = await pesepay.initiateTransaction(transaction);

    console.log("\n   📡 Response from Pesepay:");
    console.log(JSON.stringify(response, null, 2));

    if (response.success) {
      console.log("\n   ✅ SUCCESS: Transaction initiated successfully.");
      console.log(`   👉 Redirect URL: ${response.redirectUrl}`);
      console.log(`   👉 Poll URL: ${response.pollUrl}`);
    } else {
      console.error("\n   ❌ FAILURE: Transaction failed.");
      console.error(`   Reason: ${response.message}`);
    }

  } catch (error) {
    console.error("\n   ❌ CRITICAL ERROR during test execution:");
    console.error(error);
  }
}

testPesepay();
