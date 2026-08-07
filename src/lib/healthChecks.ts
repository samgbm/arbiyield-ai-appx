import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/utils/logger";

export type ServiceStatus = "ok" | "error";

export type ServiceCheckResult = {
  status: ServiceStatus;
  latencyMs: number;
  error?: string;
  detail?: string;
};

export type HealthReport = {
  status: "ok" | "degraded";
  timestamp: string;
  environment: string | undefined;
  version: string;
  services: {
    database: ServiceCheckResult;
    blockchain: ServiceCheckResult;
    ai: ServiceCheckResult;
  };
};

async function timed<T>(
  label: string,
  run: () => Promise<T>,
): Promise<
  | { ok: true; value: T; latencyMs: number }
  | { ok: false; error: string; latencyMs: number }
> {
  const started = Date.now();
  try {
    const value = await run();
    return { ok: true, value, latencyMs: Date.now() - started };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown check failure";
    logger.error({ error, service: label }, "Health check dependency failed");
    return { ok: false, error: message, latencyMs: Date.now() - started };
  }
}

function rpcUrl() {
  return (
    process.env.NEXT_PUBLIC_RPC_URL ||
    process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL ||
    "https://sepolia-rollup.arbitrum.io/rpc"
  );
}

export async function checkDatabase(): Promise<ServiceCheckResult> {
  const result = await timed("database", async () => {
    const { data, error } = await supabase
      .from("markets")
      .select("id")
      .limit(1);
    if (error) throw new Error(error.message);
    return data;
  });

  if (!result.ok) {
    return {
      status: "error",
      latencyMs: result.latencyMs,
      error: result.error,
    };
  }

  return {
    status: "ok",
    latencyMs: result.latencyMs,
    detail: "Supabase markets reachable",
  };
}

export async function checkBlockchain(): Promise<ServiceCheckResult> {
  const result = await timed("blockchain", async () => {
    const publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: http(rpcUrl()),
    });
    return publicClient.getBlockNumber();
  });

  if (!result.ok) {
    return {
      status: "error",
      latencyMs: result.latencyMs,
      error: result.error,
    };
  }

  return {
    status: "ok",
    latencyMs: result.latencyMs,
    detail: `Block ${result.value.toString()}`,
  };
}

export async function checkAiProvider(): Promise<ServiceCheckResult> {
  const result = await timed("ai", async () => {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const res = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `OpenAI models returned ${res.status}${body ? `: ${body.slice(0, 160)}` : ""}`,
      );
    }

    return res.status;
  });

  if (!result.ok) {
    return {
      status: "error",
      latencyMs: result.latencyMs,
      error: result.error,
    };
  }

  return {
    status: "ok",
    latencyMs: result.latencyMs,
    detail: "OpenAI models reachable",
  };
}

/** Concurrent dependency probe (Promise.allSettled) for GET /api/health. */
export async function runHealthChecksSettled(): Promise<HealthReport> {
  const settled = await Promise.allSettled([
    checkDatabase(),
    checkBlockchain(),
    checkAiProvider(),
  ]);

  const unwrap = (
    key: string,
    outcome: PromiseSettledResult<ServiceCheckResult>,
  ): ServiceCheckResult => {
    if (outcome.status === "fulfilled") return outcome.value;
    const message =
      outcome.reason instanceof Error
        ? outcome.reason.message
        : "Health probe rejected";
    logger.error(
      { error: outcome.reason, service: key },
      "Health check promise rejected",
    );
    return {
      status: "error",
      latencyMs: 0,
      error: message,
    };
  };

  const services = {
    database: unwrap("database", settled[0]!),
    blockchain: unwrap("blockchain", settled[1]!),
    ai: unwrap("ai", settled[2]!),
  };

  const allOk = Object.values(services).every((s) => s.status === "ok");

  if (!allOk) {
    logger.warn({ services }, "Health check reported degraded status");
  } else {
    logger.info({ services }, "Health check all green");
  }

  return {
    status: allOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0",
    services,
  };
}

/** Map a health report to the HTTP status used by GET /api/health. */
export function httpStatusFromReport(report: HealthReport): number {
  return report.status === "ok" ? 200 : 503;
}
