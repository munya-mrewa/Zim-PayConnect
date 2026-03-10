import { initCronJobs } from "../lib/queue/init";
import { cronWorker, payrollWorker } from "../lib/queue/worker";
import { logger } from "../lib/logger";
import { getPostHog } from "../lib/posthog-node";

async function start() {
  logger.info("Starting Background Worker (Cron & Payroll)...");

  await initCronJobs();

  // Keep process alive
  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, closing workers...");
    const posthog = getPostHog();
    if (posthog) {
        posthog.shutdown();
    }
    await Promise.all([
        cronWorker.close(),
        payrollWorker.close()
    ]);
    process.exit(0);
  });
}

start();

