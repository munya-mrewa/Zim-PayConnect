import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    // Old code (Delete or Comment out)
    // const rbzKey = process.env.RBZ_API_KEY;

    const apiKey = process.env.CURRENCYAPI_KEY;
    let rateToReturn = 13.45; // Default fallback
    let source = "Default";
    let lastUpdated = new Date();

    // 1. Check DB for latest rate
    const latestDbRate = await db.exchangeRate.findFirst({
      orderBy: { effectiveDate: 'desc' }
    });

    if (latestDbRate) {
      rateToReturn = latestDbRate.rate.toNumber();
      source = latestDbRate.source || "Database";
      lastUpdated = latestDbRate.effectiveDate;
    }

    // 2. Determine if we need to fetch fresh data (e.g., if older than 24 hours OR forced)
    const isStale = forceRefresh || !latestDbRate || (new Date().getTime() - latestDbRate.effectiveDate.getTime() > 24 * 60 * 60 * 1000);

    if (isStale && apiKey) {
        try {
            const response = await fetch(`https://api.currencyapi.com/v3/latest?apikey=${apiKey}&base_currency=USD&currencies=ZWG,ZWL`);
            if (response.ok) {
                const data = await response.json();
                const rateData = data.data['ZWG'] || data.data['ZWL']; 
                
                if (rateData) {
                    const newRateValue = rateData.value;
                    
                    // Store the fresh rate
                    const newEntry = await db.exchangeRate.create({
                        data: {
                            rate: Number(newRateValue),
                            currencyPair: "USD_ZIG",
                            source: "CurrencyAPI",
                            effectiveDate: new Date()
                        }
                    });

                    // Update return values
                    rateToReturn = newEntry.rate.toNumber();
                    source = "CurrencyAPI";
                    lastUpdated = newEntry.effectiveDate;
                }
            } else {
                console.error("CurrencyAPI Error:", response.status, await response.text());
            }
        } catch (apiError) {
            console.error("External API call failed:", apiError);
            // Fallback to existing stale rate if API fails
        }
    }

    return NextResponse.json({ 
      usd_zig: rateToReturn,
      lastUpdated: lastUpdated.toISOString(),
      source: source
    });
  } catch (error) {
    console.error("Failed to fetch rates:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchange rates. Database might be unavailable." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { rate } = body;

    if (!rate || isNaN(Number(rate))) {
      return NextResponse.json({ error: "Invalid rate provided" }, { status: 400 });
    }

    const newRate = await db.exchangeRate.create({
      data: {
        rate: Number(rate),
        currencyPair: "USD_ZIG",
        source: "Manual API Update",
        effectiveDate: new Date()
      }
    });

    return NextResponse.json({ success: true, data: newRate });
  } catch (error) {
    console.error("Failed to update rate:", error);
    return NextResponse.json(
      { error: "Failed to update exchange rate." },
      { status: 500 }
    );
  }
}
