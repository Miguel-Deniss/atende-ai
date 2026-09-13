import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({ prisma: { $queryRaw: vi.fn() } }));

import { prisma } from "@/lib/db/prisma";
import { GET as liveness } from "@/app/api/health/route";
import { GET as readiness } from "@/app/api/health/ready/route";

describe("health checks", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("mantém liveness pública e sem consulta ao banco", async () => {
    const response = await liveness();
    expect(response.status).toBe(200);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it("oculta readiness sem o segredo", async () => {
    vi.stubEnv("HEALTHCHECK_SECRET", "health-secret");
    const response = await readiness(new Request("http://localhost/api/health/ready") as never);
    expect(response.status).toBe(404);
  });

  it("retorna 503 quando o banco não está pronto", async () => {
    vi.stubEnv("HEALTHCHECK_SECRET", "health-secret");
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error("offline"));
    const response = await readiness(
      new Request("http://localhost/api/health/ready", {
        headers: { authorization: "Bearer health-secret" },
      }) as never
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unavailable", database: "unhealthy" });
  });
});
