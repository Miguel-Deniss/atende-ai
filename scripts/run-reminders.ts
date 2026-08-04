import { runAppointmentReminders } from "../src/lib/reminders";

async function main() {
  console.log("Iniciando verificação de lembretes de agendamento...");
  const result = await runAppointmentReminders();
  console.log("Agendamentos verificados:", result.scanned);
  console.log("Lembretes enviados:", result.sent);
  console.log("Falhas:", result.failed);
  console.log("Ignorados:", result.skipped);
  if (result.details.length > 0) {
    console.log("\nDetalhes:");
    for (const d of result.details) {
      console.log(`- ${d.appointmentId} (${d.customerName}): ${d.channel}${d.error ? ` — ERRO: ${d.error}` : ""}`);
    }
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
