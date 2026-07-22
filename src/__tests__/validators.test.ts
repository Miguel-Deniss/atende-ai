import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  clientSchema,
  appointmentSchema,
  passwordChangeSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  profileUpdateSchema,
  companySettingsSchema,
  paginationSchema,
} from "@/lib/validators/auth";

describe("loginSchema", () => {
  it("should accept valid login data", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({
      email: "invalid",
      password: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("should reject short password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("should reject very long email", () => {
    const result = loginSchema.safeParse({
      email: "a".repeat(300) + "@example.com",
      password: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("should accept login with optional totpCode", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "123456",
      totpCode: "123456",
    });
    expect(result.success).toBe(true);
  });
});

describe("registerSchema", () => {
  it("should accept valid registration", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "StrongP@ss1",
      companyName: "ACME Corp",
    });
    expect(result.success).toBe(true);
  });

  it("should reject weak password", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "weak",
      companyName: "ACME Corp",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password without uppercase", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "lowercase1",
      companyName: "ACME Corp",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password without number", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "UppercaseOnly",
      companyName: "ACME Corp",
    });
    expect(result.success).toBe(false);
  });

  it("should reject short name", () => {
    const result = registerSchema.safeParse({
      name: "A",
      email: "john@example.com",
      password: "StrongP@ss1",
      companyName: "ACME Corp",
    });
    expect(result.success).toBe(false);
  });

  it("should accept registration with phone", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "StrongP@ss1",
      companyName: "ACME Corp",
      phone: "(11) 99999-8888",
    });
    expect(result.success).toBe(true);
  });
});

describe("clientSchema", () => {
  it("should accept valid client", () => {
    const result = clientSchema.safeParse({
      name: "Maria Silva",
      phone: "(11) 99999-8888",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = clientSchema.safeParse({
      name: "",
      phone: "(11) 99999-8888",
    });
    expect(result.success).toBe(false);
  });

  it("should accept client with optional fields", () => {
    const result = clientSchema.safeParse({
      name: "Maria Silva",
      phone: "(11) 99999-8888",
      email: "maria@example.com",
      lastService: "Corte de cabelo",
      notes: "Cliente frequente",
      status: "active",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = clientSchema.safeParse({
      name: "Maria",
      phone: "(11) 99999-8888",
      email: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid status", () => {
    const result = clientSchema.safeParse({
      name: "Maria",
      phone: "(11) 99999-8888",
      status: "unknown",
    });
    expect(result.success).toBe(false);
  });
});

describe("appointmentSchema", () => {
  it("should accept valid appointment", () => {
    const result = appointmentSchema.safeParse({
      time: "14:30",
      date: "2025-12-25",
      name: "João",
      service: "Corte",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid time format", () => {
    const result = appointmentSchema.safeParse({
      time: "25:00",
      date: "2025-12-25",
      name: "João",
      service: "Corte",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid date format", () => {
    const result = appointmentSchema.safeParse({
      time: "14:30",
      date: "25-12-2025",
      name: "João",
      service: "Corte",
    });
    expect(result.success).toBe(false);
  });

  it("should accept appointment with optional fields", () => {
    const result = appointmentSchema.safeParse({
      time: "14:30",
      date: "2025-12-25",
      name: "João",
      service: "Corte",
      clientId: "client-123",
      status: "confirmed",
    });
    expect(result.success).toBe(true);
  });
});

describe("passwordChangeSchema", () => {
  it("should accept valid password change", () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: "OldP@ss1",
      newPassword: "NewP@ss1",
    });
    expect(result.success).toBe(true);
  });

  it("should reject weak new password", () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: "OldP@ss1",
      newPassword: "weak",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty current password", () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: "",
      newPassword: "StrongP@ss1",
    });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("should accept valid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("should accept valid reset data", () => {
    const result = resetPasswordSchema.safeParse({
      token: "valid-reset-token",
      password: "NewStrongP@ss1",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty token", () => {
    const result = resetPasswordSchema.safeParse({
      token: "",
      password: "NewStrongP@ss1",
    });
    expect(result.success).toBe(false);
  });

  it("should reject weak password", () => {
    const result = resetPasswordSchema.safeParse({
      token: "token-123",
      password: "weak",
    });
    expect(result.success).toBe(false);
  });
});

describe("profileUpdateSchema", () => {
  it("should accept partial update with name", () => {
    const result = profileUpdateSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("should accept partial update with phone", () => {
    const result = profileUpdateSchema.safeParse({ phone: "(11) 99999-8888" });
    expect(result.success).toBe(true);
  });

  it("should accept partial update with email", () => {
    const result = profileUpdateSchema.safeParse({ email: "new@example.com" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = profileUpdateSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
  });

  it("should reject too long phone", () => {
    const result = profileUpdateSchema.safeParse({ phone: "1".repeat(30) });
    expect(result.success).toBe(false);
  });
});

describe("companySettingsSchema", () => {
  it("should accept valid settings", () => {
    const result = companySettingsSchema.safeParse({
      companyName: "ACME Corp",
      phone: "(11) 99999-8888",
      address: "Rua ABC, 123",
      hours: "Seg-Sex 8h-18h",
      services: [{ name: "Corte", price: "50" }],
      welcomeMessage: "Bem-vindo!",
      absenceMessage: "Volte logo!",
      faq: [{ question: "Q?", answer: "A!" }],
      autoTransfer: true,
      autoReminders: true,
      requireConfirmation: false,
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty settings", () => {
    const result = companySettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should reject too long company name", () => {
    const result = companySettingsSchema.safeParse({
      companyName: "A".repeat(300),
    });
    expect(result.success).toBe(false);
  });
});

describe("paginationSchema", () => {
  it("should use defaults for empty input", () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("should accept custom page and limit", () => {
    const result = paginationSchema.safeParse({ page: 3, limit: 50 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it("should reject negative page", () => {
    const result = paginationSchema.safeParse({ page: -1 });
    expect(result.success).toBe(false);
  });

  it("should reject limit over 100", () => {
    const result = paginationSchema.safeParse({ limit: 200 });
    expect(result.success).toBe(false);
  });

  it("should accept string numeric values with coerce", () => {
    const result = paginationSchema.safeParse({ page: "2", limit: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });

  it("should accept sort options", () => {
    const result = paginationSchema.safeParse({
      sortBy: "name",
      sortOrder: "desc",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid sortOrder", () => {
    const result = paginationSchema.safeParse({ sortOrder: "invalid" });
    expect(result.success).toBe(false);
  });
});
