import pino, { type Logger } from "pino";

const level = process.env.LOG_LEVEL ?? "info";
const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";
/** Avoid worker-based pretty transport in the browser / Jest. */
const canUsePretty =
  !isProduction && !isTest && typeof window === "undefined";

/**
 * Structured application logger.
 * - Dev (Node): pino-pretty (colorized terminal)
 * - Production / browser / test: JSON (or plain) stdout
 */
function createLogger(): Logger {
  if (canUsePretty) {
    return pino({
      level,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
        },
      },
    });
  }

  return pino({ level });
}

export const logger = createLogger();
