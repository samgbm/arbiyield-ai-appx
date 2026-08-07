import "server-only";

/**
 * Server-only re-export — prefer `@/utils/logger` for new code.
 * Kept so existing API routes / actions that import `@/lib/logger` keep working.
 */
export { logger } from "@/utils/logger";
