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
 * Create a Supabase browser/server client from public env vars.
 * Throws when URL or anon key are missing (also validated by Zod in `src/env.ts`).
 */
export function createSupabaseClient(
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

/** Lazy singleton for App Router API routes. */
let supabaseSingleton: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseSingleton) {
    supabaseSingleton = createSupabaseClient();
  }
  return supabaseSingleton;
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
