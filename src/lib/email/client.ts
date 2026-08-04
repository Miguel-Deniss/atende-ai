import { Resend } from "resend";

const API_KEY = process.env.RESEND_API_KEY;

let instance: Resend | null = null;

export function getResendClient(): Resend {
  if (instance) {
    return instance;
  }

  if (!API_KEY) {
    throw new Error(
      "RESEND_API_KEY não configurada. Defina a variável de ambiente RESEND_API_KEY para habilitar o envio de e-mails."
    );
  }

  instance = new Resend(API_KEY);
  return instance;
}

export function hasResendConfigured(): boolean {
  return Boolean(API_KEY);
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM ?? "AtendeAI <nao-responda@atendeai.com>";
}

export function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}
