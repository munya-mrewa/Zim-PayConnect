import { cronQueue } from "./worker";
import { logger } from "@/lib/logger";

export async function initCronJobs() {
  try {
    // Remove existing repeatable jobs to avoid duplicates on restart
    const jobs = await cronQueue.getRepeatableJobs();
    for (const job of jobs) {
      await cronQueue.removeRepeatableByKey(job.key);
    }

    // Add exchange rate fetch daily at midnight
    await cronQueue.add(
      "fetch-exchange-rates",
      {},
      { repeat: { pattern: "0 0 * * *" } } // Every day at 00:00
    );

    // Add subscription reminders daily at 8 AM
    await cronQueue.add(
      "subscription-reminders",
      {},
      { repeat: { pattern: "0 8 * * *" } } // Every day at 08:00
    );

    // Add cleanup for expired ZIPs every 6 hours
    await cronQueue.add(
        "cleanup-expired-zips",
        {},
        { repeat: { pattern: "0 */6 * * *" } }
    );

    logger.info("Cron jobs initialized in BullMQ");
  } catch (error) {
    logger.error({ err: error }, "Failed to initialize cron jobs");
  }
}
