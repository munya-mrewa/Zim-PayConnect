import { Queue } from "bullmq";
import IORedis from "ioredis";

export const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", { 
  maxRetriesPerRequest: null,
  connectTimeout: 10000 
});

export const cronQueue = new Queue("cron-jobs", { connection });
export const payrollQueue = new Queue("payroll-processing", { connection });
