import { initCronJobs } from "../lib/queue/init";
import { cronWorker, payrollWorker } from "../lib/queue/worker";
import { logger } from "../lib/logger";

async function start() {
  logger.info("Starting Background Worker (Cron & Payroll)...");
  
  await initCronJobs();

  // Keep process alive
  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, closing workers...");
    await Promise.all([
        cronWorker.close(),
        payrollWorker.close()
    ]);
    process.exit(0);
  });
}

start();
