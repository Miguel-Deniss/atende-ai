export const FEATURE_LABELS: Record<string, string> = {
  basic_ai: "Assistente de IA",
  advanced_ai: "IA Avançada",
  whatsapp: "Atendimento via WhatsApp",
  email_notifications: "Notificações por E-mail",
  basic_reports: "Relatórios Básicos",
  advanced_reports: "Relatórios Avançados",
  api_access: "Acesso à API",
  custom_integrations: "Integrações Personalizadas",
  dedicated_support: "Suporte Prioritário",
};

export function getFeatureLabel(feature: string): string {
  return FEATURE_LABELS[feature] ?? feature;
}
