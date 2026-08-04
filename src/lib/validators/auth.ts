import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalido").max(255),
  password: z.string().min(6, "Senha deve ter no minimo 6 caracteres").max(128),
  totpCode: z.string().length(6).optional(),
  recoveryCode: z.string().min(8).max(64).optional(),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter no minimo 2 caracteres").max(255),
  email: z.string().email("Email invalido").max(255),
  password: z
    .string()
    .min(8, "Senha deve ter no minimo 8 caracteres")
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Senha deve conter letra maiuscula, minuscula e numero"
    ),
  companyName: z.string().min(2, "Nome da empresa e obrigatorio").max(255),
  phone: z.string().optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual e obrigatoria"),
  newPassword: z
    .string()
    .min(8, "Senha deve ter no minimo 8 caracteres")
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Senha deve conter letra maiuscula, minuscula e numero"
    ),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Senha deve ter no minimo 8 caracteres")
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Senha deve conter letra maiuscula, minuscula e numero"
    ),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(255).optional(),
});

export const clientSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio").max(255),
  phone: z.string().min(1, "Telefone e obrigatorio").max(20),
  email: z.string().email().max(255).optional(),
  lastService: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const appointmentSchema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/, "Horario invalido"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalida"),
  name: z.string().min(1, "Nome e obrigatorio").max(255),
  service: z.string().min(1, "Servico e obrigatorio").max(255),
  clientId: z.string().optional(),
  status: z.enum(["confirmed", "pending"]).optional(),
});

export const companySettingsSchema = z.object({
  companyName: z.string().min(1).max(255).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  hours: z.string().max(500).optional(),
  services: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.string().min(1),
      })
    )
    .optional(),
  welcomeMessage: z.string().max(2000).optional(),
  absenceMessage: z.string().max(2000).optional(),
  faq: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
      })
    )
    .optional(),
  autoTransfer: z.boolean().optional(),
  autoReminders: z.boolean().optional(),
  requireConfirmation: z.boolean().optional(),
});

export const whatsAppConnectSchema = z.object({
  phoneNumberId: z.string().min(1, "Phone Number ID é obrigatório"),
  businessAccountId: z.string().min(1, "Business Account ID é obrigatório"),
  accessToken: z.string().min(1, "Access token é obrigatório"),
  phoneNumber: z.string().min(1, "Número é obrigatório"),
});

const optionalPaginationNumber = (min: number, max: number, defaultValue: number) =>
  z.preprocess(
    (value) => (value == null || value === "" ? undefined : value),
    z.coerce.number().int().min(min).max(max).default(defaultValue)
  );

export const paginationSchema = z.object({
  page: optionalPaginationNumber(1, Number.MAX_SAFE_INTEGER, 1),
  limit: optionalPaginationNumber(1, 100, 20),
  search: z.string().nullish(),
  status: z.string().nullish(),
  sortBy: z.string().nullish(),
  sortOrder: z.enum(["asc", "desc"]).nullish(),
});

const companyAssignableRoles = ["ATTENDANT", "EMPLOYEE", "FINANCIAL"] as const;

export const createUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter no minimo 2 caracteres").max(255),
  email: z.string().email("Email invalido").max(255),
  password: z
    .string()
    .min(8, "Senha deve ter no minimo 8 caracteres")
    .max(128),
  role: z.enum(companyAssignableRoles, {
    message: "Papel nao permitido para gestao pela empresa",
  }),
  phone: z.string().max(20).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  phone: z.string().max(20).optional(),
  role: z.enum(companyAssignableRoles, {
    message: "Papel nao permitido para gestao pela empresa",
  }),
  isActive: z.boolean().optional(),
});

export const couponSchema = z.object({
  code: z.string().min(3, "Codigo muito curto").max(50),
  discountType: z.enum(["PERCENTAGE", "FIXED"], {
    message: "Tipo de desconto invalido",
  }),
  discountValue: z.number().int().positive("Valor deve ser positivo"),
  maxUses: z.number().int().positive().optional(),
  validUntil: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  allowedPlans: z.array(z.string()).optional(),
});

export const checkoutSchema = z.object({
  planCode: z.string().min(1, "Plano e obrigatorio"),
  couponCode: z.string().optional(),
});

export const dataExportScopeSchema = z.object({
  scope: z
    .enum(["all", "clients", "conversations", "appointments"], {
      message: "Escopo invalido",
    })
    .optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
