import { NextResponse } from "next/server";
import {
  httpStatusFromReport,
  runHealthChecksSettled,
} from "@/lib/healthChecks";
import { logger } from "@/utils/logger";

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags:
 *       - System
 *     summary: System diagnostic status
 *     description: >
 *       Concurrently probes Supabase (markets metadata), the Arbitrum Sepolia
 *       JSON-RPC node, and the OpenAI Models API. Returns per-service status,
 *       latency in milliseconds, and an overall HTTP status of 200 when all
 *       checks pass or 503 when any critical dependency fails.
 *     responses:
 *       200:
 *         description: All dependencies are healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthReport'
 *       503:
 *         description: One or more critical dependencies failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthReport'
 */
export async function GET() {
  try {
    logger.info("Health check ping received");
    const report = await runHealthChecksSettled();
    return NextResponse.json(report, {
      status: httpStatusFromReport(report),
    });
  } catch (error) {
    logger.error({ error }, "Health check route crashed");
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: "1.0.0",
        services: {
          database: {
            status: "error",
            latencyMs: 0,
            error: "Health route failed",
          },
          blockchain: {
            status: "error",
            latencyMs: 0,
            error: "Health route failed",
          },
          ai: {
            status: "error",
            latencyMs: 0,
            error: "Health route failed",
          },
        },
      },
      { status: 503 },
    );
  }
}
