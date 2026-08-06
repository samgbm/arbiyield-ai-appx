import { parseEther } from "viem";
import { parseOnChainMarket } from "@/utils/marketParser";

describe("parseOnChainMarket", () => {
  it("maps getMarket tuple into MockMarket with ETH pools and ISO end date", () => {
    const endUnix = 1_893_456_000; // ~2030-01-08
    const raw = [
      "0x5a967532fd910921f970fCFf449eB95b61C782f4",
      BigInt(endUnix),
      false,
      0,
      parseEther("1.5"),
      parseEther("1.0"),
      parseEther("0.5"),
    ] as const;

    const market = parseOnChainMarket(3, raw);

    expect(market.id).toBe("3");
    expect(market.title).toBe("Market #3");
    expect(market.category).toBe("Crypto");
    expect(market.status).toBe("active");
    expect(market.endDate).toBe(new Date(endUnix * 1000).toISOString());
    expect(market.liquidityPool).toBe(1.5);
    expect(market.options[0]).toEqual({ label: "Yes", poolAmount: 1 });
    expect(market.options[1]).toEqual({ label: "No", poolAmount: 0.5 });
    expect(market.description).toContain("0x5a96");
  });

  it("marks resolved markets in the description", () => {
    const market = parseOnChainMarket(0, [
      "0x0000000000000000000000000000000000000001",
      BigInt(2_000_000_000),
      true,
      1,
      parseEther("0"),
      parseEther("0"),
      parseEther("0"),
    ]);

    expect(market.description).toMatch(/resolved/i);
  });
});
