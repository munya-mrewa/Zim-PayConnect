import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import IORedis from "ioredis";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: "unknown",
      redis: "unknown",
      engine: "healthy"
    }
  };

  try {
    // Check DB
    await db.$queryRaw`SELECT 1`;
    status.services.database = "healthy";

    // Check Redis
    const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", { 
        connectTimeout: 2000,
        maxRetriesPerRequest: 0 
    });
    const ping = await redis.ping();
    status.services.redis = ping === "PONG" ? "healthy" : "degraded";
    redis.disconnect();

    const isHealthy = status.services.database === "healthy" && status.services.redis === "healthy";

    return NextResponse.json(status, { status: isHealthy ? 200 : 503 });

  } catch (error: any) {
    return NextResponse.json({ 
        ...status, 
        error: error.message,
        status: "critical_failure"
    }, { status: 503 });
  }
}
