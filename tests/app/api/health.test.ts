import {
  httpStatusFromReport,
  type HealthReport,
} from "@/lib/healthChecks";

function report(
  status: HealthReport["status"],
  blockchainStatus: "ok" | "error" = "ok",
): HealthReport {
  return {
    status,
    timestamp: "2026-08-07T12:00:00.000Z",
    environment: "test",
    version: "1.0.0",
    services: {
      database: { status: "ok", latencyMs: 12 },
      blockchain: {
        status: blockchainStatus,
        latencyMs: 34,
        error: blockchainStatus === "error" ? "RPC down" : undefined,
      },
      ai: { status: "ok", latencyMs: 56 },
    },
  };
}

describe("GET /api/health status mapping", () => {
  it("returns HTTP 200 when all dependencies succeed", () => {
    expect(httpStatusFromReport(report("ok"))).toBe(200);
  });

  it("returns HTTP 503 when any critical service fails", () => {
    expect(httpStatusFromReport(report("degraded", "error"))).toBe(503);
  });
});
