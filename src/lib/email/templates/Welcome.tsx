import { Button, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

export interface WelcomeTemplateProps {
  userEmail: string;
  userName: string;
  companyName: string;
  loginUrl: string;
}

export function WelcomeTemplate({
  userEmail,
  userName,
  companyName,
  loginUrl,
}: WelcomeTemplateProps) {
  return (
    <EmailLayout preview="Bem-vindo ao AtendeAI" title={`Bem-vindo(a), ${userName}!`}>
      <Text
        style={{ color: "#CBD5E1", fontSize: "15px", lineHeight: "24px", margin: "0 0 16px 0" }}
      >
        Sua conta na empresa <strong style={{ color: "#F8FAFC" }}>{companyName}</strong> foi criada
        com sucesso no <strong style={{ color: "#F8FAFC" }}>AtendeAI</strong>.
      </Text>

      <Text
        style={{ color: "#CBD5E1", fontSize: "15px", lineHeight: "24px", margin: "0 0 24px 0" }}
      >
        A conta vinculada a <strong style={{ color: "#F8FAFC" }}>{userEmail}</strong> já pode
        acessar o atendimento, os clientes e as conversas da empresa em um só lugar.
      </Text>

      <Section style={{ textAlign: "center", margin: "0 0 24px 0" }}>
        <Button
          href={loginUrl}
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
          Acessar o AtendeAI
        </Button>
      </Section>

      <Text style={{ color: "#64748B", fontSize: "13px", lineHeight: "20px", margin: "0 0 8px 0" }}>
        Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
      </Text>
      <Link href={loginUrl} style={{ color: "#60A5FA", fontSize: "13px", wordBreak: "break-all" }}>
        {loginUrl}
      </Link>

      <Text
        style={{ color: "#64748B", fontSize: "13px", lineHeight: "20px", margin: "16px 0 0 0" }}
      >
        Suas credenciais de acesso foram enviadas por quem criou sua conta em{" "}
        <strong style={{ color: "#94A3B8" }}>{companyName}</strong>. Se você não esperava esta
        mensagem, entre em contato com o administrador da empresa.
      </Text>
    </EmailLayout>
  );
}

export default WelcomeTemplate;
