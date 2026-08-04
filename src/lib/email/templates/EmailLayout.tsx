import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const BASE_URL = process.env.APP_URL ?? "http://localhost:3000";
const LOGO_URL = `${BASE_URL}/logo.png`;

const main = {
  backgroundColor: "#0F172A",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  padding: "40px 0",
};

const container = {
  backgroundColor: "#111827",
  border: "1px solid #1E293B",
  borderRadius: "16px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "40px 32px",
};

const footer = {
  color: "#64748B",
  fontSize: "12px",
  lineHeight: "20px",
  textAlign: "center" as const,
  marginTop: "32px",
};

export interface EmailLayoutProps {
  preview: string;
  title: string;
  children: ReactNode;
}

export function EmailLayout({ preview, title, children }: EmailLayoutProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Row>
            <Column>
              <Img
                src={LOGO_URL}
                alt="AtendeAI"
                width="40"
                height="40"
                style={{ borderRadius: "10px", marginBottom: "24px" }}
              />
            </Column>
            <Column align="right">
              <Text style={{ color: "#3B82F6", fontSize: "20px", fontWeight: 700, margin: "0 0 24px 0" }}>
                Atende<span style={{ color: "#60A5FA" }}>AI</span>
              </Text>
            </Column>
          </Row>

          <Heading
            style={{ color: "#F8FAFC", fontSize: "22px", fontWeight: 700, margin: "0 0 16px 0" }}
          >
            {title}
          </Heading>

          {children}

          <Hr style={{ borderColor: "#1E293B", margin: "32px 0 24px 0" }} />

          <Text style={footer}>
            <Link href={`${BASE_URL}/privacy`} style={{ color: "#64748B", textDecoration: "underline" }}>
              Política de Privacidade
            </Link>{" "}
            •{" "}
            <Link href={`${BASE_URL}/terms`} style={{ color: "#64748B", textDecoration: "underline" }}>
              Termos de Uso
            </Link>
          </Text>
          <Text style={{ ...footer, marginTop: "8px" }}>
            © {new Date().getFullYear()} AtendeAI. Todos os direitos reservados.
          </Text>
          <Section>
            <Text style={{ ...footer, marginTop: "8px" }}>
              AtendeAI — Automatize o atendimento da sua empresa com inteligência artificial.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
