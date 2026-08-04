import { Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

export interface TwoFactorTemplateProps {
  code: string;
  expiresInMinutes?: number;
}

export function TwoFactorTemplate({ code, expiresInMinutes = 10 }: TwoFactorTemplateProps) {
  return (
    <EmailLayout
      preview="Seu código de verificação"
      title="Verificação em duas etapas"
    >
      <Text style={{ color: "#CBD5E1", fontSize: "15px", lineHeight: "24px", margin: "0 0 16px 0" }}>
        Estamos verificando o login na sua conta do <strong style={{ color: "#F8FAFC" }}>AtendeAI</strong>.
        Use o código abaixo para concluir o acesso:
      </Text>

      <Text
        style={{
          backgroundColor: "#1E293B",
          borderRadius: "10px",
          color: "#3B82F6",
          fontSize: "32px",
          fontWeight: 700,
          letterSpacing: "8px",
          margin: "0 0 24px 0",
          padding: "20px 16px",
          textAlign: "center",
        }}
      >
        {code}
      </Text>

      <Text style={{ color: "#94A3B8", fontSize: "13px", lineHeight: "20px", margin: "0 0 16px 0" }}>
        Este código é válido por <strong style={{ color: "#F8FAFC" }}>{expiresInMinutes} minutos</strong>.
        Se você não tentou entrar na sua conta, ignore esta mensagem e considere alterar sua senha.
      </Text>

      <Text style={{ color: "#64748B", fontSize: "13px", lineHeight: "20px", margin: "0" }}>
        Nunca compartilhe este código com ninguém. A equipe do AtendeAI jamais pedirá seu código
        por e-mail ou telefone.
      </Text>
    </EmailLayout>
  );
}

export default TwoFactorTemplate;
