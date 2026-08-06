import "server-only";

import pino from "pino";

/**
 * Production-ready structured logger (JSON in prod, pretty in local dev).
 * Server-only — import from API routes / server code, not client components.
 */
export const logger = pino(
  process.env.NODE_ENV !== "production"
    ? {
        level: process.env.LOG_LEVEL ?? "info",
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }
    : {
        level: process.env.LOG_LEVEL ?? "info",
      },
);
