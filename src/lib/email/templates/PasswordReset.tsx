import { Button, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

export interface PasswordResetTemplateProps {
  resetUrl: string;
  userEmail: string;
  appName?: string;
}

export function PasswordResetTemplate({
  resetUrl,
  userEmail,
  appName = "AtendeAI",
}: PasswordResetTemplateProps) {
  return (
    <EmailLayout
      preview="Recuperação de senha"
      title="Recuperação de senha"
    >
      <Text style={{ color: "#CBD5E1", fontSize: "15px", lineHeight: "24px", margin: "0 0 16px 0" }}>
        Olá! Recebemos uma solicitação para redefinir a senha da conta associada a{" "}
        <strong style={{ color: "#F8FAFC" }}>{userEmail}</strong>.
      </Text>

      <Text style={{ color: "#CBD5E1", fontSize: "15px", lineHeight: "24px", margin: "0 0 24px 0" }}>
        Para continuar, clique no botão abaixo e defina uma nova senha. Este link é válido
        por <strong style={{ color: "#F8FAFC" }}>1 hora</strong> e pode ser usado apenas uma vez.
      </Text>

      <Section style={{ textAlign: "center", margin: "0 0 24px 0" }}>
        <Button
          href={resetUrl}
          style={{
            backgroundColor: "#3B82F6",
            borderRadius: "10px",
            color: "#FFFFFF",
            fontSize: "15px",
            fontWeight: 600,
            padding: "12px 24px",
            textDecoration: "none",
          }}
        >
          Redefinir senha
        </Button>
      </Section>

      <Text style={{ color: "#64748B", fontSize: "13px", lineHeight: "20px", margin: "0 0 8px 0" }}>
        Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
      </Text>
      <Link href={resetUrl} style={{ color: "#60A5FA", fontSize: "13px", wordBreak: "break-all" }}>
        {resetUrl}
      </Link>

      <Section style={{ backgroundColor: "#1E293B", borderRadius: "10px", marginTop: "24px", padding: "16px" }}>
        <Text style={{ color: "#94A3B8", fontSize: "13px", lineHeight: "20px", margin: "0" }}>
          Se você não solicitou esta alteração, ignore este e-mail. Sua senha permanecerá
          inalterada. Em caso de dúvidas, entre em contato com o suporte do {appName}.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default PasswordResetTemplate;
