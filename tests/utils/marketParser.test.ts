import { parseEther } from "viem";
import {
  metadataById,
  parseOnChainMarket,
} from "@/utils/marketParser";

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

  it("merges Supabase metadata over on-chain financial fields", () => {
    const market = parseOnChainMarket(
      7,
      [
        "0x5a967532fd910921f970fCFf449eB95b61C782f4",
        BigInt(1_900_000_000),
        false,
        0,
        parseEther("2"),
        parseEther("1.2"),
        parseEther("0.8"),
      ],
      {
        title: "Will Brazil win the next World Cup?",
        description: "Resolves YES if Brazil wins.",
        category: "Sports",
      },
    );

    expect(market.title).toBe("Will Brazil win the next World Cup?");
    expect(market.description).toBe("Resolves YES if Brazil wins.");
    expect(market.category).toBe("Sports");
    expect(market.liquidityPool).toBe(2);
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

  it("indexes metadata rows by id", () => {
    const map = metadataById([
      { id: 3, title: "A", description: "d", category: "AI" },
      { id: "1", title: "B", description: "e", category: "Crypto" },
    ]);
    expect(map.get(3)?.title).toBe("A");
    expect(map.get(1)?.category).toBe("Crypto");
  });
});
