import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    logger.info("Health check ping received");

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: "1.0.0",
    });
  } catch (error) {
    logger.error({ err: error }, "Health check failed");

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: "1.0.0",
      },
      { status: 500 },
    );
  }
}
