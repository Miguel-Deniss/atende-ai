import { describe, it, expect, vi } from "vitest";

describe("Logger", () => {
  it("should log debug messages in dev mode", async () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const { logger } = await import("@/lib/logger/structured");
    logger.debug("test debug", { action: "test" });
    expect(spy).toHaveBeenCalledWith(
      "[DEBUG] test debug",
      expect.objectContaining({ action: "test" })
    );
    spy.mockRestore();
  });

  it("should log info messages", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const { logger } = await import("@/lib/logger/structured");
    logger.info("test info", { action: "test" });
    expect(spy).toHaveBeenCalledWith(
      "[INFO] test info",
      expect.objectContaining({ action: "test" })
    );
    spy.mockRestore();
  });

  it("should log warn messages", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { logger } = await import("@/lib/logger/structured");
    logger.warn("test warn", { action: "test" });
    expect(spy).toHaveBeenCalledWith(
      "[WARN] test warn",
      expect.objectContaining({ action: "test" })
    );
    spy.mockRestore();
  });

  it("should log error messages", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { logger } = await import("@/lib/logger/structured");
    logger.error("test error", { action: "test" });
    expect(spy).toHaveBeenCalledWith(
      "[ERROR] test error",
      expect.objectContaining({ action: "test" })
    );
    spy.mockRestore();
  });

  it("should include timestamp in production log output", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { logger } = await import("@/lib/logger/structured");
    logger.info("prod log", { action: "test" });

    const callArg = spy.mock.calls[0][0];
    const parsed = JSON.parse(callArg as string);
    expect(parsed.t).toBeDefined();
    expect(parsed.lvl).toBe("INFO");
    expect(parsed.msg).toBe("prod log");
    expect(parsed.act).toBe("test");

    spy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  it("should include optional context fields in production output", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { logger } = await import("@/lib/logger/structured");
    logger.info("ctx test", {
      requestId: "req-1",
      userId: "usr-1",
      companyId: "cmp-1",
      duration: 150,
      error: "something failed",
    });

    const callArg = spy.mock.calls[0][0];
    const parsed = JSON.parse(callArg as string);
    expect(parsed.req).toBe("req-1");
    expect(parsed.uid).toBe("usr-1");
    expect(parsed.cid).toBe("cmp-1");
    expect(parsed.dur).toBe("150ms");
    expect(parsed.err).toBe("something failed");

    spy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});
