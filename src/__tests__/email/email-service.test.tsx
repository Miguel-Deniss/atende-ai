import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render } from "@react-email/render";
import { PasswordResetTemplate } from "@/lib/email/templates/PasswordReset";

vi.mock("@/lib/email/client", () => ({
  getResendClient: vi.fn(),
  getEmailFrom: vi.fn(() => "AtendeAI <contato@atendeai.com>"),
  getAppUrl: vi.fn(() => "http://localhost:3000"),
  hasResendConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/logger/structured", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  createLog: vi.fn().mockResolvedValue(undefined),
}));

import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendInvitationEmail,
  sendTwoFactorEmail,
  sendInvoiceEmail,
  EmailServiceError,
} from "@/lib/email/email-service";
import { getResendClient } from "@/lib/email/client";

describe("email-service", () => {
  const mockSend = vi.fn();
  const mockClient = { emails: { send: mockSend } };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: "email_123" }, error: null });
    (getResendClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);
  });

  it("sendPasswordResetEmail envia com destino, assunto e template corretos", async () => {
    const result = await sendPasswordResetEmail({
      to: "usuario@teste.com",
      resetUrl: "http://localhost:3000/reset-password?token=abc123",
      userEmail: "usuario@teste.com",
      companyId: "company_1",
    });

    expect(result).toEqual({ id: "email_123" });
    expect(mockSend).toHaveBeenCalledTimes(1);

    const payload = mockSend.mock.calls[0][0];
    expect(payload.to).toBe("usuario@teste.com");
    expect(payload.subject).toBe("Recuperação de senha");
    expect(payload.html).toContain("Redefinir senha");
    expect(payload.html).toContain("token=abc123");
  });

  it("não expõe o token nos logs (createLog não recebe token)", async () => {
    const { createLog } = await import("@/lib/logger");

    await sendPasswordResetEmail({
      to: "usuario@teste.com",
      resetUrl: "http://localhost:3000/reset-password?token=segredo123",
      companyId: "company_1",
    });

    const calls = JSON.stringify((createLog as ReturnType<typeof vi.fn>).mock.calls);
    expect(calls).not.toContain("segredo123");
  });

  it("registra EMAIL_SENT no createLog após sucesso", async () => {
    const { createLog } = await import("@/lib/logger");

    await sendPasswordResetEmail({
      to: "usuario@teste.com",
      resetUrl: "http://localhost:3000/reset-password?token=abc",
      companyId: "company_1",
    });

    expect(createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "EMAIL_SENT",
        entity: "email",
        entityId: "usuario@teste.com",
        companyId: "company_1",
      })
    );
  });

  it("lança EmailServiceError e registra EMAIL_FAILED quando o Resend falha", async () => {
    const { createLog } = await import("@/lib/logger");
    mockSend.mockResolvedValue({
      data: null,
      error: new Error("resend rate limited"),
    });

    await expect(
      sendPasswordResetEmail({
        to: "usuario@teste.com",
        resetUrl: "http://localhost:3000/reset-password?token=abc",
        companyId: "company_1",
      })
    ).rejects.toThrow(EmailServiceError);

    expect(createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "EMAIL_FAILED",
        entityId: "usuario@teste.com",
      })
    );
  });

  it("lança EmailServiceError com mensagem amigável (sem stack do Resend)", async () => {
    mockSend.mockRejectedValue(new Error("connection refused"));

    const error = await sendPasswordResetEmail({
      to: "usuario@teste.com",
      resetUrl: "http://localhost:3000/reset-password?token=abc",
    }).catch((e) => e);

    expect(error).toBeInstanceOf(EmailServiceError);
    expect(error.message).toContain("Não foi possível enviar o e-mail");
    expect(error.message).not.toContain("connection refused");
  });

  it("sendVerificationEmail usa template VerifyEmail", async () => {
    await sendVerificationEmail({
      to: "novo@teste.com",
      verifyUrl: "http://localhost:3000/verify?token=v1",
    });

    const payload = mockSend.mock.calls[0][0];
    expect(payload.subject).toBe("Confirme seu email");
    expect(payload.html).toContain("Confirmar email");
  });

  it("sendWelcomeEmail usa template Welcome", async () => {
    await sendWelcomeEmail({
      to: "novo@teste.com",
      userName: "Maria",
      companyName: "Barbearia X",
    });

    const payload = mockSend.mock.calls[0][0];
    expect(payload.subject).toContain("Bem-vindo");
    expect(payload.html).toContain("Barbearia X");
  });

  it("sendInvitationEmail usa template Invitation", async () => {
    await sendInvitationEmail({
      to: "convite@teste.com",
      invitationUrl: "http://localhost:3000/invite?t=i1",
      inviterName: "João",
      companyName: "Barbearia Y",
    });

    const payload = mockSend.mock.calls[0][0];
    expect(payload.subject).toContain("Convite");
    expect(payload.html).toContain("Aceitar convite");
  });

  it("sendTwoFactorEmail usa template TwoFactor", async () => {
    await sendTwoFactorEmail({
      to: "2fa@teste.com",
      code: "123456",
    });

    const payload = mockSend.mock.calls[0][0];
    expect(payload.subject).toBe("Seu código de verificação");
    expect(payload.html).toContain("123456");
  });

  it("sendInvoiceEmail usa template Invoice", async () => {
    await sendInvoiceEmail({
      to: "financeiro@teste.com",
      invoiceUrl: "http://localhost:3000/invoice/1",
      companyName: "Barbearia Z",
      planName: "PRO",
      amount: "R$ 49,90",
      dueDate: "05/09/2026",
      invoiceNumber: "INV-2026-001",
    });

    const payload = mockSend.mock.calls[0][0];
    expect(payload.subject).toContain("INV-2026-001");
    expect(payload.html).toContain("R$ 49,90");
  });
});

describe("PasswordResetTemplate", () => {
  it("renderiza título, botão, link completo e aviso", async () => {
    const html = await render(
      React.createElement(PasswordResetTemplate, {
        resetUrl: "http://localhost:3000/reset-password?token=segredo",
        userEmail: "user@teste.com",
      })
    );

    expect(html).toContain("Recuperação de senha");
    expect(html).toContain("Redefinir senha");
    expect(html).toContain("reset-password?token=segredo");
    expect(html).toContain("Se você não solicitou esta alteração, ignore este e-mail");
    expect(html).toContain("Política de Privacidade");
    expect(html).toContain("Termos de Uso");
  });
});
