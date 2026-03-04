import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { checkExpiringSubscriptions } from "@/lib/cron/subscription-reminder";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null });

export const cronQueue = new Queue("cron-jobs", { connection });

// Define Worker
export const cronWorker = new Worker(
  "cron-jobs",
  async (job) => {
    logger.info({ jobName: job.name }, "Processing cron job");

    if (job.name === "fetch-exchange-rates") {
      await fetchExchangeRates();
    } else if (job.name === "subscription-reminders") {
      await checkExpiringSubscriptions();
    }
  },
  { connection }
);

cronWorker.on("completed", (job) => {
  logger.info({ jobName: job.name }, "Cron job completed successfully");
});

cronWorker.on("failed", (job, err) => {
  logger.error({ jobName: job?.name, err }, "Cron job failed");
});

// Job logic
async function fetchExchangeRates() {
  const apiKey = process.env.CURRENCYAPI_KEY;
  if (!apiKey) {
    logger.warn("No CURRENCYAPI_KEY provided for auto-fetch.");
    return;
  }
  
  // Find organizations with autoUpdateRates enabled
  const orgsToUpdate = await db.organization.findMany({
    where: { autoUpdateRates: true }
  });

  if (orgsToUpdate.length === 0) {
    // No orgs need it, but we should still fetch it for global cache
  }

  try {
      const response = await fetch(`https://api.currencyapi.com/v3/latest?apikey=${apiKey}&base_currency=USD&currencies=ZWG,ZWL`);
      if (response.ok) {
          const data = await response.json();
          const rateData = data.data['ZWG'] || data.data['ZWL']; 
          
          if (rateData) {
              const newRateValue = rateData.value;
              
              // Store the fresh rate globally
              await db.exchangeRate.create({
                  data: {
                      rate: Number(newRateValue),
                      currencyPair: "USD_ZIG",
                      source: "CurrencyAPI Cron",
                      effectiveDate: new Date()
                  }
              });

              // Update all orgs that opted in
              if (orgsToUpdate.length > 0) {
                  await db.organization.updateMany({
                      where: { autoUpdateRates: true },
                      data: {
                          currentExchangeRate: Number(newRateValue),
                          lastRateUpdate: new Date()
                      }
                  });
              }
              logger.info({ rate: newRateValue }, "Successfully auto-fetched and updated exchange rates");
          }
      } else {
          logger.error({ status: response.status }, "CurrencyAPI Error during cron fetch");
      }
  } catch (err) {
      logger.error({ err }, "External API call failed during cron fetch");
  }
}

