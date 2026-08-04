import { Button, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

export interface VerifyEmailTemplateProps {
  verifyUrl: string;
  userEmail: string;
}

export function VerifyEmailTemplate({ verifyUrl, userEmail }: VerifyEmailTemplateProps) {
  return (
    <EmailLayout
      preview="Confirme seu email"
      title="Confirme seu endereço de email"
    >
      <Text style={{ color: "#CBD5E1", fontSize: "15px", lineHeight: "24px", margin: "0 0 16px 0" }}>
        Olá! Para concluir o cadastro da conta <strong style={{ color: "#F8FAFC" }}>{userEmail}</strong>,
        precisamos confirmar que este endereço de email é realmente seu.
      </Text>

      <Section style={{ textAlign: "center", margin: "0 0 24px 0" }}>
        <Button
          href={verifyUrl}
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
          Confirmar email
        </Button>
      </Section>

      <Text style={{ color: "#64748B", fontSize: "13px", lineHeight: "20px", margin: "0 0 8px 0" }}>
        Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
      </Text>
      <Link href={verifyUrl} style={{ color: "#60A5FA", fontSize: "13px", wordBreak: "break-all" }}>
        {verifyUrl}
      </Link>

      <Section style={{ backgroundColor: "#1E293B", borderRadius: "10px", marginTop: "24px", padding: "16px" }}>
        <Text style={{ color: "#94A3B8", fontSize: "13px", lineHeight: "20px", margin: "0" }}>
          Se você não criou uma conta no AtendeAI, pode ignorar esta mensagem.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default VerifyEmailTemplate;
