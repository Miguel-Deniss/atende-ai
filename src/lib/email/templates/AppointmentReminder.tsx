import { Button, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

export interface AppointmentReminderTemplateProps {
  customerName: string;
  companyName: string;
  service: string;
  date: string;
  time: string;
  rescheduleUrl: string;
}

export function AppointmentReminderTemplate({
  customerName,
  companyName,
  service,
  date,
  time,
  rescheduleUrl,
}: AppointmentReminderTemplateProps) {
  return (
    <EmailLayout
      preview={`Lembrete: seu horário em ${companyName} é ${date} às ${time}`}
      title={`Confirmação do seu horário em ${companyName}`}
    >
      <Text style={{ color: "#CBD5E1", fontSize: "15px", lineHeight: "24px", margin: "0 0 24px 0" }}>
        Olá, <strong style={{ color: "#F8FAFC" }}>{customerName}</strong>! Passando para
        lembrar do seu agendamento em{" "}
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
          Serviço: <strong style={{ color: "#F8FAFC" }}>{service}</strong>
        </Text>
        <Text style={{ color: "#94A3B8", fontSize: "13px", margin: "0 0 8px 0" }}>
          Data: <strong style={{ color: "#F8FAFC" }}>{date}</strong>
        </Text>
        <Text style={{ color: "#94A3B8", fontSize: "13px", margin: "0 0 8px 0" }}>
          Horário: <strong style={{ color: "#F8FAFC" }}>{time}</strong>
        </Text>
        <Text style={{ color: "#F8FAFC", fontSize: "15px", fontWeight: 600, margin: "12px 0 0 0" }}>
          Estamos esperando por você!
        </Text>
      </Section>

      <Section style={{ textAlign: "center", margin: "0 0 24px 0" }}>
        <Button
          href={rescheduleUrl}
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
          Preciso remarcar
        </Button>
      </Section>

      <Text style={{ color: "#64748B", fontSize: "13px", lineHeight: "20px", margin: "0 0 8px 0" }}>
        Se precisar cancelar ou remarcar, basta responder esta mensagem ou entrar em
        contato com a empresa.
      </Text>
      <Link href={rescheduleUrl} style={{ color: "#60A5FA", fontSize: "13px", wordBreak: "break-all" }}>
        {rescheduleUrl}
      </Link>
    </EmailLayout>
  );
}

export default AppointmentReminderTemplate;
