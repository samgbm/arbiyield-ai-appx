import { createSwaggerSpec } from "next-swagger-doc";

/**
 * OpenAPI 3 document for ArbiYield off-chain HTTP surface.
 */
export function getApiDocs() {
  return createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "ArbiYield-AI PMM API",
        version: "1.0",
        description:
          "Off-chain HTTP API for ArbiYield AI. Serves market metadata (Supabase), " +
          "system health diagnostics, AI strategy chat, and this OpenAPI document — " +
          "composing cleanly with the on-chain Arbitrum Stylus Parimutuel Market Maker (MeleePMM).",
      },
      servers: [
        {
          url: "/",
          description: "Current deployment",
        },
      ],
      tags: [
        { name: "Markets", description: "Off-chain market metadata" },
        { name: "System", description: "Health & diagnostics" },
        {
          name: "AI",
          description: "Yield strategy generation & AI Oracle resolution",
        },

        { name: "Docs", description: "OpenAPI spec" },
      ],
      components: {
        schemas: {
          MarketMetadata: {
            type: "object",
            required: [
              "id",
              "title",
              "description",
              "category",
              "creator_address",
            ],
            properties: {
              id: {
                type: "integer",
                description: "On-chain MeleePMM market id",
                example: 11,
              },
              title: {
                type: "string",
                example: "Will ETH Lima have over 1000 attendees?",
              },
              description: {
                type: "string",
                example: "Resolves YES if official attendance ≥ 1000.",
              },
              category: {
                type: "string",
                enum: ["Crypto", "Culture", "AI", "Sports", "Macro"],
              },
              creator_address: {
                type: "string",
                pattern: "^0x[a-fA-F0-9]{40}$",
                example: "0xca76951A11A9adE6553ef54AB1d1260f08c3460d",
              },
              created_at: {
                type: "string",
                format: "date-time",
              },
            },
          },
          HealthReport: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["ok", "degraded"] },
              timestamp: { type: "string", format: "date-time" },
              environment: { type: "string" },
              version: { type: "string" },
              services: {
                type: "object",
                properties: {
                  database: { $ref: "#/components/schemas/ServiceCheck" },
                  blockchain: { $ref: "#/components/schemas/ServiceCheck" },
                  ai: { $ref: "#/components/schemas/ServiceCheck" },
                },
              },
            },
          },
          ServiceCheck: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["ok", "error"] },
              latencyMs: { type: "number" },
              error: { type: "string" },
              detail: { type: "string" },
            },
          },
        },
      },
    },
  });
}
