import { Button, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

export interface InvoiceTemplateProps {
  invoiceUrl: string;
  companyName: string;
  planName: string;
  amount: string;
  dueDate: string;
  invoiceNumber: string;
}

export function InvoiceTemplate({
  invoiceUrl,
  companyName,
  planName,
  amount,
  dueDate,
  invoiceNumber,
}: InvoiceTemplateProps) {
  return (
    <EmailLayout
      preview={`Fatura ${invoiceNumber} — ${amount}`}
      title={`Fatura para ${companyName}`}
    >
      <Text style={{ color: "#CBD5E1", fontSize: "15px", lineHeight: "24px", margin: "0 0 24px 0" }}>
        Segue a fatura referente à assinatura do plano{" "}
        <strong style={{ color: "#F8FAFC" }}>{planName}</strong> da empresa{" "}
        <strong style={{ color: "#F8FAFC" }}>{companyName}</strong>.
      </Text>

      <Section
        style={{
          backgroundColor: "#1E293B",
          borderRadius: "12px",
          marginBottom: "24px",
          padding: "20px",
        }}
      >
        <Text style={{ color: "#94A3B8", fontSize: "13px", margin: "0 0 8px 0" }}>
          Nº da fatura: <strong style={{ color: "#F8FAFC" }}>{invoiceNumber}</strong>
        </Text>
        <Text style={{ color: "#94A3B8", fontSize: "13px", margin: "0 0 8px 0" }}>
          Plano: <strong style={{ color: "#F8FAFC" }}>{planName}</strong>
        </Text>
        <Text style={{ color: "#94A3B8", fontSize: "13px", margin: "0 0 8px 0" }}>
          Vencimento: <strong style={{ color: "#F8FAFC" }}>{dueDate}</strong>
        </Text>
        <Text style={{ color: "#F8FAFC", fontSize: "24px", fontWeight: 700, margin: "12px 0 0 0" }}>
          {amount}
        </Text>
      </Section>

      <Section style={{ textAlign: "center", margin: "0 0 24px 0" }}>
        <Button
          href={invoiceUrl}
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
          Ver fatura e pagar
        </Button>
      </Section>

      <Text style={{ color: "#64748B", fontSize: "13px", lineHeight: "20px", margin: "0 0 8px 0" }}>
        Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
      </Text>
      <Link href={invoiceUrl} style={{ color: "#60A5FA", fontSize: "13px", wordBreak: "break-all" }}>
        {invoiceUrl}
      </Link>
    </EmailLayout>
  );
}

export default InvoiceTemplate;
