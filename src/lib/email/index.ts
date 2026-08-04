import {
  PasswordResetTemplate,
  WelcomeTemplate,
  VerifyEmailTemplate,
  TwoFactorTemplate,
  InvitationTemplate,
  InvoiceTemplate,
} from "./templates";

export {
  PasswordResetTemplate,
  WelcomeTemplate,
  VerifyEmailTemplate,
  TwoFactorTemplate,
  InvitationTemplate,
  InvoiceTemplate,
};

export type {
  PasswordResetTemplateProps,
  WelcomeTemplateProps,
  VerifyEmailTemplateProps,
  TwoFactorTemplateProps,
  InvitationTemplateProps,
  InvoiceTemplateProps,
} from "./templates";

export {
  EmailServiceError,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendInvitationEmail,
  sendTwoFactorEmail,
  sendInvoiceEmail,
} from "./email-service";
