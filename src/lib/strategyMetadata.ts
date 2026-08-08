import {
  createSupabaseClient,
  type StrategyMetadataRow,
} from "@/lib/supabaseClient";

/** Fetch all off-chain strategy rows keyed by strategy id. */
export async function fetchStrategyMetadataMap(): Promise<
  Map<string, StrategyMetadataRow>
> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("strategies").select("*");
  if (error) throw error;
  const map = new Map<string, StrategyMetadataRow>();
  for (const row of (data ?? []) as StrategyMetadataRow[]) {
    map.set(row.id, row);
  }
  return map;
}

/** Fetch a single strategy metadata row by id. */
export async function fetchStrategyMetadata(
  id: string,
): Promise<StrategyMetadataRow | null> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("strategies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as StrategyMetadataRow | null) ?? null;
}
