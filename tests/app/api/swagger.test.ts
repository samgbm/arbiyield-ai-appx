import { getApiDocs } from "@/lib/swagger";

describe("getApiDocs / OpenAPI spec", () => {
  it("returns a valid OpenAPI object with the ArbiYield-AI PMM API title", () => {
    const spec = getApiDocs() as {
      openapi?: string;
      info?: { title?: string; version?: string; description?: string };
      paths?: Record<string, unknown>;
    };

    expect(spec).toBeDefined();
    expect(spec.openapi).toBe("3.0.0");
    expect(spec.info?.title).toBe("ArbiYield-AI PMM API");
    expect(spec.info?.version).toBe("1.0");
    expect(spec.info?.description).toMatch(/Parimutuel Market Maker/i);
    expect(spec.paths).toBeDefined();
  });
});
