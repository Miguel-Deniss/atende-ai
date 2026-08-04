import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { getResendClient, getEmailFrom } from "./client";
import { logger } from "@/lib/logger/structured";
import { createLog } from "@/lib/logger";
import {
  PasswordResetTemplate,
  WelcomeTemplate,
  VerifyEmailTemplate,
  TwoFactorTemplate,
  InvitationTemplate,
  InvoiceTemplate,
  AppointmentReminderTemplate,
} from "./templates";
import type { LogAction } from "@/lib/logger";

interface SendEmailOptions {
  to: string;
  subject: string;
  template: ReactElement;
  templateName: string;
  companyId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class EmailServiceError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "EmailServiceError";
  }
}

async function sendEmail(options: SendEmailOptions): Promise<{ id: string }> {
  const { to, subject, template, templateName, companyId, userId, ipAddress, userAgent } = options;

  const html = await render(template);

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: getEmailFrom(),
      to,
      subject,
      html,
    });

    if (error) {
      throw error;
    }

    await logEmailEvent("EMAIL_SENT", {
      to,
      templateName,
      companyId,
      userId,
      ipAddress,
      userAgent,
    });

    return { id: data?.id ?? "" };
  } catch (error) {
    await logEmailEvent("EMAIL_FAILED", {
      to,
      templateName,
      companyId,
      userId,
      ipAddress,
      userAgent,
      error,
    });

    throw new EmailServiceError(
      "Não foi possível enviar o e-mail. Tente novamente em alguns instantes.",
      { cause: error }
    );
  }
}

async function logEmailEvent(
  action: Extract<LogAction, "EMAIL_SENT" | "EMAIL_FAILED">,
  params: {
    to: string;
    templateName: string;
    companyId?: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    error?: unknown;
  }
): Promise<void> {
  const { to, templateName, companyId, userId, ipAddress, userAgent, error } = params;

  logger.info(`EMAIL EVENT: ${action}`, {
    action,
    companyId,
    userId,
    metadata: { to, template: templateName, duration: undefined },
  });

  await createLog({
    action,
    entity: "email",
    entityId: to,
    description: `${action === "EMAIL_SENT" ? "E-mail enviado" : "Falha no envio de e-mail"}: ${templateName}`,
    companyId: companyId ?? "system",
    userId,
    ipAddress,
    userAgent,
    ...(error
      ? { oldValues: { error: error instanceof Error ? error.message : String(error) } }
      : {}),
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
  userEmail?: string;
  companyId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ id: string }> {
  return sendEmail({
    to: params.to,
    subject: "Recuperação de senha",
    templateName: "PasswordReset",
    companyId: params.companyId,
    userId: params.userId,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    template: (
      <PasswordResetTemplate
        resetUrl={params.resetUrl}
        userEmail={params.userEmail ?? params.to}
      />
    ),
  });
}

export async function sendVerificationEmail(params: {
  to: string;
  verifyUrl: string;
  companyId?: string;
  userId?: string;
}): Promise<{ id: string }> {
  return sendEmail({
    to: params.to,
    subject: "Confirme seu email",
    templateName: "VerifyEmail",
    companyId: params.companyId,
    userId: params.userId,
    template: <VerifyEmailTemplate verifyUrl={params.verifyUrl} userEmail={params.to} />,
  });
}

export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
  companyName: string;
  loginUrl?: string;
  companyId?: string;
  userId?: string;
}): Promise<{ id: string }> {
  return sendEmail({
    to: params.to,
    subject: `Bem-vindo(a) ao AtendeAI, ${params.userName}!`,
    templateName: "Welcome",
    companyId: params.companyId,
    userId: params.userId,
    template: (
      <WelcomeTemplate
        userEmail={params.to}
        userName={params.userName}
        companyName={params.companyName}
        loginUrl={params.loginUrl ?? `${process.env.APP_URL ?? "http://localhost:3000"}/login`}
      />
    ),
  });
}

export async function sendInvitationEmail(params: {
  to: string;
  invitationUrl: string;
  inviterName: string;
  companyName: string;
  roleLabel?: string;
  companyId?: string;
}): Promise<{ id: string }> {
  return sendEmail({
    to: params.to,
    subject: `Convite para ${params.companyName} no AtendeAI`,
    templateName: "Invitation",
    companyId: params.companyId,
    template: (
      <InvitationTemplate
        invitationUrl={params.invitationUrl}
        inviterName={params.inviterName}
        companyName={params.companyName}
        userEmail={params.to}
        roleLabel={params.roleLabel}
      />
    ),
  });
}

export async function sendTwoFactorEmail(params: {
  to: string;
  code: string;
  expiresInMinutes?: number;
  companyId?: string;
  userId?: string;
}): Promise<{ id: string }> {
  return sendEmail({
    to: params.to,
    subject: "Seu código de verificação",
    templateName: "TwoFactor",
    companyId: params.companyId,
    userId: params.userId,
    template: (
      <TwoFactorTemplate code={params.code} expiresInMinutes={params.expiresInMinutes} />
    ),
  });
}

export async function sendInvoiceEmail(params: {
  to: string;
  invoiceUrl: string;
  companyName: string;
  planName: string;
  amount: string;
  dueDate: string;
  invoiceNumber: string;
  companyId?: string;
}): Promise<{ id: string }> {
  return sendEmail({
    to: params.to,
    subject: `Fatura ${params.invoiceNumber} — ${params.amount}`,
    templateName: "Invoice",
    companyId: params.companyId,
    template: (
      <InvoiceTemplate
        invoiceUrl={params.invoiceUrl}
        companyName={params.companyName}
        planName={params.planName}
        amount={params.amount}
        dueDate={params.dueDate}
        invoiceNumber={params.invoiceNumber}
      />
    ),
  });
}

export async function sendAppointmentReminderEmail(params: {
  to: string;
  customerName: string;
  companyName: string;
  service: string;
  date: string;
  time: string;
  rescheduleUrl: string;
  companyId?: string;
}): Promise<{ id: string }> {
  return sendEmail({
    to: params.to,
    subject: `Lembrete: ${params.service} em ${params.companyName} hoje às ${params.time}`,
    templateName: "AppointmentReminder",
    companyId: params.companyId,
    template: (
      <AppointmentReminderTemplate
        customerName={params.customerName}
        companyName={params.companyName}
        service={params.service}
        date={params.date}
        time={params.time}
        rescheduleUrl={params.rescheduleUrl}
      />
    ),
  });
}
