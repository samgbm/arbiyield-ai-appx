import { logger } from "@/utils/logger";

describe("logger", () => {
  it("initializes without throwing and exposes standard methods", () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.child).toBe("function");

    expect(() => logger.info({ ok: true }, "logger smoke test")).not.toThrow();
  });
});
