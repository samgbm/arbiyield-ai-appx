import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Off-chain market metadata stored in Supabase `markets` table.
 * On-chain id is the primary key; title/description stay off Stylus to save gas.
 */
export type MarketMetadataRow = {
  id: number;
  title: string;
  description: string;
  category: string;
  creator_address: string;
  created_at?: string;
};

/**
 * Off-chain yield strategy metadata — matched to Stylus / demo strategies by `id`.
 */
export type StrategyMetadataRow = {
  id: string;
  name: string;
  description: string;
  protocol: string;
  risk_level: "low" | "medium" | "high";
  apy_pct: number;
  tvl_usd: number;
  sharpe: number | null;
  utilization_pct: number | null;
  health_factor: number | null;
  weekly_pnl_pct: number | null;
  tags: string[] | null;
  narrative: string | null;
  execution_steps: string[] | null;
  creator_address: string | null;
  create_tx_hash: string | null;
  created_at?: string;
  updated_at?: string;
};

function buildSupabaseClient(
  url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
): SupabaseClient {
  const trimmedUrl = url?.trim();
  const trimmedKey = anonKey?.trim();

  if (!trimmedUrl || !trimmedKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Check .env.local against .env.example.",
    );
  }

  return createClient(trimmedUrl, trimmedKey);
}

/** Lazy singleton — one GoTrueClient per browser context. */
let supabaseSingleton: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseSingleton) {
    supabaseSingleton = buildSupabaseClient();
  }
  return supabaseSingleton;
}

/**
 * Prefer the shared singleton. Custom url/key still create a one-off client
 * (tests / scripts); default args reuse `getSupabase()`.
 */
export function createSupabaseClient(
  url?: string,
  anonKey?: string,
): SupabaseClient {
  if (url === undefined && anonKey === undefined) {
    return getSupabase();
  }
  return buildSupabaseClient(url, anonKey);
}

/**
 * Exported client (lazy). Prefer this or `getSupabase()` in server routes.
 * Initialization is deferred so importing the module never throws before env loads.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabase();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
