import { z } from "zod";

/**
 * Strict environment validation for ArbiYield AI + Prediction Markets.
 * Fails fast at startup/build if required vars are missing or malformed,
 * preventing silent production misconfigurations.
 *
 * Skip with SKIP_ENV_VALIDATION=1 only for tightly controlled tooling.
 */

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  /** Arbitrum (or Alchemy) JSON-RPC endpoint used by Wagmi / PMM reads. */
  NEXT_PUBLIC_RPC_URL: z
    .string()
    .url("NEXT_PUBLIC_RPC_URL must be a valid URL"),
  /** Supabase project URL for off-chain market metadata. */
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  /** Supabase anon key (public) for metadata reads/writes via RLS. */
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  /** OpenAI key for strategy + market-creator AI routes (server-only). */
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  /** Tavily key for AI Oracle web search (`/api/markets/resolve`). */
  TAVILY_API_KEY: z.string().min(1, "TAVILY_API_KEY is required"),
  /**
   * Optional hex private key for `npm run seed` (Arbitrum Sepolia seeder).
   * Not required at app runtime — validated when present so .env stays typed.
   */
  SEEDER_PRIVATE_KEY: z
    .string()
    .regex(
      /^(0x)?[a-fA-F0-9]{64}$/,
      "SEEDER_PRIVATE_KEY must be a 32-byte hex private key",
    )
    .optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  // Allow Jest / special tooling to opt out; never skip in production builds.
  if (
    process.env.SKIP_ENV_VALIDATION === "1" &&
    process.env.NODE_ENV !== "production"
  ) {
    return {
      NODE_ENV: (process.env.NODE_ENV as Env["NODE_ENV"]) ?? "development",
      NEXT_PUBLIC_RPC_URL:
        process.env.NEXT_PUBLIC_RPC_URL ??
        "https://sepolia-rollup.arbitrum.io/rpc",
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ??
        "https://placeholder.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "test-anon-key",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "missing",
      TAVILY_API_KEY: process.env.TAVILY_API_KEY ?? "missing",
    };
  }

  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_RPC_URL:
      process.env.NEXT_PUBLIC_RPC_URL ??
      process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    SEEDER_PRIVATE_KEY: process.env.SEEDER_PRIVATE_KEY || undefined,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    console.error("❌ Invalid environment variables:", fieldErrors);
    throw new Error(
      `Invalid environment variables: ${Object.keys(fieldErrors).join(", ")}. ` +
        "Check .env.local against .env.example.",
    );
  }

  return parsed.data;
}

export const env = validateEnv();
