import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { checkExpiringSubscriptions } from "@/lib/cron/subscription-reminder";
import { calculateTax } from "@/lib/ephemeral-engine/calculator";
import { generateBatchZip } from "@/lib/pdf-generator";
import { saveZip } from "@/lib/storage/zip-store";
import { RawPayrollRecord, TaxConfig } from "@/lib/ephemeral-engine/types";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", { 
  maxRetriesPerRequest: null,
  // Ensure we don't hang on connection issues
  connectTimeout: 10000 
});

export const cronQueue = new Queue("cron-jobs", { connection });
export const payrollQueue = new Queue("payroll-processing", { connection });

interface ProcessingJobData {
    records: RawPayrollRecord[];
    taxConfig: TaxConfig;
    orgInfo: {
        id: string;
        name: string;
        tin?: string;
        logoUrl?: string | null;
    };
    auditId: string;
    removeBranding: boolean;
}

import { getPostHog } from "@/lib/posthog-node";

// Main Payroll Worker
export const payrollWorker = new Worker(
  "payroll-processing",
  async (job: Job<ProcessingJobData>) => {
    const { records, taxConfig, orgInfo, auditId, removeBranding } = job.data;
    const posthog = getPostHog();

    logger.info({ jobId: job.id, orgId: orgInfo.id, recordCount: records.length }, "Starting background payroll processing");

    // Track start
    posthog?.capture({
      distinctId: orgInfo.id,
      event: 'payroll_processing_started',
      properties: { 
        jobId: job.id, 
        recordCount: records.length,
        method: taxConfig.defaultCurrency
      }
    });

    try {
        const processedRecords = records.map(record => ({
            ...record,
            taxResult: calculateTax(record, taxConfig)
        }));

        const zipBlob = await generateBatchZip(
            processedRecords, 
            orgInfo.name, 
            orgInfo.logoUrl, 
            orgInfo.tin, 
            removeBranding
        );

        const arrayBuffer = await zipBlob.arrayBuffer();
        const fileId = await saveZip(Buffer.from(arrayBuffer), orgInfo.id);

        await db.auditLog.update({
            where: { id: auditId },
            data: { 
                status: "SUCCESS",
                metadata: {
                    ...(typeof job.data === 'object' ? (job.data as any).metadata : {}),
                    fileId,
                    completedAt: new Date().toISOString(),
                    processingTimeMs: Date.now() - job.timestamp
                }
            }
        });

        // Track success
        posthog?.capture({
            distinctId: orgInfo.id,
            event: 'payroll_processing_success',
            properties: { 
                jobId: job.id, 
                fileId,
                processingTimeMs: Date.now() - job.timestamp
            }
        });

        logger.info({ jobId: job.id, fileId }, "Background processing completed successfully");
        
        return { fileId, recordCount: records.length };
    } catch (error: any) {
        logger.error({ jobId: job.id, err: error }, "Background processing failed");
        
        // Report to PostHog
        posthog?.capture({
            distinctId: orgInfo.id,
            event: 'payroll_processing_failed',
            properties: { 
                jobId: job.id, 
                error: error.message,
                stack: error.stack
            }
        });

        await db.auditLog.update({
            where: { id: auditId },
            data: { 
                status: "FAILURE",
                metadata: { error: error.message }
            }
        });
        
        throw error;
    }
  },
  { connection, concurrency: 2 } 
);

// Cron Worker for Maintenance
export const cronWorker = new Worker(
  "cron-jobs",
  async (job) => {
    logger.info({ jobName: job.name }, "Processing cron job");

    if (job.name === "fetch-exchange-rates") {
      await fetchExchangeRates();
    } else if (job.name === "subscription-reminders") {
      await checkExpiringSubscriptions();
    } else if (job.name === "cleanup-expired-zips") {
      await cleanupExpiredZips();
    }
  },
  { connection }
);

// Maintenance Logic: Cleanup old ZIPs (Data Disposal)
async function cleanupExpiredZips() {
    const fs = require('fs/promises');
    const path = require('path');
    const STORAGE_DIR = path.join(process.cwd(), 'storage', 'zips');
    const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 Hours

    try {
        const files = await fs.readdir(STORAGE_DIR);
        let deletedCount = 0;

        for (const file of files) {
            if (file === '.keep') continue;
            
            const filePath = path.join(STORAGE_DIR, file);
            const stats = await fs.stat(filePath);
            const age = Date.now() - stats.mtimeMs;

            if (age > EXPIRY_MS) {
                await fs.unlink(filePath);
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            logger.info({ deletedCount }, "Automated Data Disposal: Cleaned up expired payroll ZIPs");
            // Log this to a global system audit or just keep in application logs
        }
    } catch (error) {
        logger.error({ err: error }, "Failed to cleanup expired ZIPs");
    }
}

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

