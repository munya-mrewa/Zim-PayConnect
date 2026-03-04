import { initCronJobs } from "../lib/queue/init";
import { cronWorker } from "../lib/queue/worker";
import { logger } from "../lib/logger";

async function start() {
  logger.info("Starting Background Worker...");
  
  await initCronJobs();

  // Keep process alive
  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, closing worker...");
    await cronWorker.close();
    process.exit(0);
  });
}

start();
