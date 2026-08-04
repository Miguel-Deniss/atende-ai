import { Button, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

export interface InvitationTemplateProps {
  invitationUrl: string;
  inviterName: string;
  companyName: string;
  userEmail: string;
  roleLabel?: string;
}

export function InvitationTemplate({
  invitationUrl,
  inviterName,
  companyName,
  userEmail,
  roleLabel = "membro da equipe",
}: InvitationTemplateProps) {
  return (
    <EmailLayout
      preview={`Convite para ${companyName}`}
      title="Você foi convidado!"
    >
      <Text style={{ color: "#CBD5E1", fontSize: "15px", lineHeight: "24px", margin: "0 0 16px 0" }}>
        <strong style={{ color: "#F8FAFC" }}>{inviterName}</strong> convidou você para entrar na
        empresa <strong style={{ color: "#F8FAFC" }}>{companyName}</strong> no{" "}
        <strong style={{ color: "#F8FAFC" }}>AtendeAI</strong> como {roleLabel}.
      </Text>

      <Text style={{ color: "#CBD5E1", fontSize: "15px", lineHeight: "24px", margin: "0 0 24px 0" }}>
        Para aceitar o convite, clique no botão abaixo:
      </Text>

      <Section style={{ textAlign: "center", margin: "0 0 24px 0" }}>
        <Button
          href={invitationUrl}
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
          Aceitar convite
        </Button>
      </Section>

      <Text style={{ color: "#64748B", fontSize: "13px", lineHeight: "20px", margin: "0 0 8px 0" }}>
        Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
      </Text>
      <Link href={invitationUrl} style={{ color: "#60A5FA", fontSize: "13px", wordBreak: "break-all" }}>
        {invitationUrl}
      </Link>

      <Text style={{ color: "#94A3B8", fontSize: "13px", lineHeight: "20px", margin: "16px 0 0 0" }}>
        O convite foi enviado para <strong style={{ color: "#CBD5E1" }}>{userEmail}</strong>. Se
        você não esperava este convite, pode ignorar esta mensagem.
      </Text>
    </EmailLayout>
  );
}

export default InvitationTemplate;
