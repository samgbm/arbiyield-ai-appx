import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase, type MarketMetadataRow } from "@/lib/supabaseClient";
import { logger } from "@/utils/logger";

const CATEGORIES = ["Crypto", "Culture", "AI", "Sports", "Macro"] as const;

const postBodySchema = z.object({
  id: z.coerce.number().int().nonnegative(),
  title: z.string().trim().min(1).max(280),
  description: z.string().trim().min(1).max(4000),
  category: z.enum(CATEGORIES),
  creator_address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid creator_address"),
});

/**
 * GET /api/markets/metadata?id=3
 * Returns one market row, or all markets when `id` is omitted.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get("id");

  try {
    if (idParam != null && idParam !== "") {
      const id = Number(idParam);
      if (!Number.isInteger(id) || id < 0) {
        return NextResponse.json(
          { error: "Invalid id query parameter" },
          { status: 400 },
        );
      }

      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        logger.error({ err: error, id }, "Supabase get market metadata failed");
        return NextResponse.json(
          { error: error.message },
          { status: 500 },
        );
      }

      if (!data) {
        return NextResponse.json(
          { error: "Market metadata not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(data as MarketMetadataRow);
    }

    const { data, error } = await supabase
      .from("markets")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      logger.error({ err: error }, "Supabase list market metadata failed");
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((data ?? []) as MarketMetadataRow[]);
  } catch (err) {
    logger.error({ err }, "GET /api/markets/metadata crashed");
    return NextResponse.json(
      { error: "Failed to load market metadata" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/markets/metadata
 * Persist AI-generated title/description after on-chain createMarket confirms.
 */
export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = postBodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const row = {
      id: parsed.data.id,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      creator_address: parsed.data.creator_address,
    };

    logger.info(
      { marketId: row.id, title: row.title },
      "Saving new market metadata to Supabase",
    );

    // Upsert so deploy retries (same marketId) stay idempotent.
    const { data, error } = await supabase
      .from("markets")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      logger.error(
        { error, marketId: row.id },
        "Failed to save market metadata",
      );
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info(
      { marketId: row.id, title: row.title },
      "Saved market metadata to Supabase",
    );
    return NextResponse.json(data as MarketMetadataRow, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Failed to save market metadata");
    return NextResponse.json(
      { error: "Failed to save market metadata" },
      { status: 500 },
    );
  }
}
