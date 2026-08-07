import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/api-guard", () => ({
  requirePermission: vi.fn(),
}));

vi.mock("@/lib/rate-limit/with-rate-limit", () => ({
  guardRateLimit: vi.fn(),
  clientIp: vi.fn(() => "1.2.3.4"),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { upload: { create: vi.fn() } },
}));

vi.mock("fs/promises", () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  unlink: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  createLog: vi.fn(async () => {}),
}));

vi.mock("@/lib/security/sanitize", () => ({
  sanitizeFilename: (name: string) => name,
}));

vi.mock("@/lib/logger/structured", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { POST } from "@/app/api/upload/route";
import { requirePermission } from "@/lib/auth/api-guard";
import { guardRateLimit } from "@/lib/rate-limit/with-rate-limit";
import { prisma } from "@/lib/db/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import { createLog } from "@/lib/logger";

function makeRequest(file?: File): any {
  const fd = new FormData();
  if (file) fd.set("file", file);
  return { formData: async () => fd, headers: new Headers() };
}

function makeFile(name: string, type = "application/pdf", size = 1024): File {
  return new File([Buffer.alloc(size, 1)], name, { type });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requirePermission).mockResolvedValue({
    user: { id: "u1", companyId: "c1" },
    response: null,
  } as never);
  vi.mocked(guardRateLimit).mockResolvedValue(null as never);
  vi.mocked(mkdir).mockResolvedValue(undefined as never);
  vi.mocked(writeFile).mockResolvedValue(undefined as never);
  vi.mocked(unlink).mockResolvedValue(undefined as never);
  vi.mocked(prisma.upload.create).mockResolvedValue({ id: "up1" } as never);
});

describe("POST /api/upload", () => {
  it("deve enviar arquivo permitido e retornar url", async () => {
    const res = await POST(makeRequest(makeFile("contrato.pdf")));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.url).toMatch(/^\/uploads\/c1\//);
    expect(prisma.upload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: "c1",
          uploadedById: "u1",
          mimeType: "application/pdf",
        }),
      })
    );
  });

  it("deve rejeitar quando nenhum arquivo é enviado", async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("Nenhum arquivo");
  });

  it("deve rejeitar arquivo acima do limite", async () => {
    const res = await POST(makeRequest(makeFile("grande.pdf", "application/pdf", 6 * 1024 * 1024)));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("muito grande");
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("deve rejeitar extensão não permitida", async () => {
    const res = await POST(makeRequest(makeFile("virus.svg", "image/svg+xml")));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("não permitido");
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("deve bloquear extensão perigosa e registrar atividade suspeita", async () => {
    const res = await POST(makeRequest(makeFile("malware.exe", "")));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("bloqueado");
    expect(createLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "SUSPICIOUS_ACTIVITY" })
    );
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("deve rejeitar MIME não permitido", async () => {
    const res = await POST(makeRequest(makeFile("malware.pdf", "application/x-msdownload")));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("MIME");
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("deve retornar 429 quando o rate limit da empresa bloqueia", async () => {
    vi.mocked(guardRateLimit).mockResolvedValue(
      new Response(JSON.stringify({ success: false, error: "Muitas requisições" }), { status: 429 }) as never
    );

    const res = await POST(makeRequest(makeFile("doc.pdf")));
    expect(res.status).toBe(429);
    expect(writeFile).not.toHaveBeenCalled();
    expect(prisma.upload.create).not.toHaveBeenCalled();
  });

  it("deve retornar 500 amigável quando a gravação no disco falha", async () => {
    vi.mocked(writeFile).mockRejectedValue(new Error("EACCES: permission denied"));
    const res = await POST(makeRequest(makeFile("doc.pdf")));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain("salvar o arquivo");
    expect(prisma.upload.create).not.toHaveBeenCalled();
  });

  it("deve limpar arquivo órfão quando o registro no banco falha", async () => {
    vi.mocked(prisma.upload.create).mockRejectedValue(new Error("DB down"));
    const res = await POST(makeRequest(makeFile("doc.pdf")));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain("registrar o arquivo");
    expect(unlink).toHaveBeenCalledTimes(1);
  });

  it("deve responder 401/403 quando sem permissão", async () => {
    vi.mocked(requirePermission).mockResolvedValue({
      user: null as never,
      response: new Response(JSON.stringify({ success: false, error: "Não autorizado" }), { status: 401 }) as never,
    });
    const res = await POST(makeRequest(makeFile("doc.pdf")));
    expect(res.status).toBe(401);
  });
});
