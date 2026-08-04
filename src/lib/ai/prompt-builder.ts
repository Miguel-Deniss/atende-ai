import { listFAQ, listServices } from "./format";
import type {
  AIMessage,
  CompanyContext,
  ConversationState,
} from "./types";

export interface PromptBuildInput {
  state: ConversationState;
  company: CompanyContext;
  history: AIMessage[];
}

export interface BuiltPrompt {
  system: string;
  messages: AIMessage[];
}

function appointmentObjective(state: ConversationState): string {
  const s = state.slots;
  const service = s.service ?? "um servico";

  switch (state.step) {
    case "waiting_service":
      return (
        "O cliente quer agendar um servico, mas ainda nao disse qual. " +
        "Pergunte QUAL servico ele deseja. Se necessario, liste os servicos disponiveis. " +
        "NAO pergunte data ou horario ainda."
      );
    case "waiting_date":
      return (
        "O cliente quer agendar " + service + ". Ainda falta a DATA. " +
        "Pergunte SOMENTE qual dia ele prefere. NAO repita os servicos. NAO reinicie o atendimento."
      );
    case "waiting_time":
      return (
        "O cliente quer agendar " + service + (s.date ? " para " + s.date : "") + ". " +
        "Ainda falta o HORARIO. Pergunte SOMENTE o horario. NAO repita os servicos. NAO reinicie o atendimento."
      );
    case "waiting_name":
      return (
        "Todos os dados do agendamento ja foram informados, mas falta o NOME do cliente. " +
        "Pergunte SOMENTE o nome."
      );
    case "confirming":
      return (
        "Confirme com o cliente os dados do agendamento: " +
        "servico " + service +
        ", data " + (s.date ?? "nao informada") +
        ", horario " + (s.time ?? "nao informado") +
        ". Pergunte se o cliente CONFIRMA o agendamento. Se ele pedir mudanca, ajuste."
      );
    case "finished":
      return "O agendamento ja foi confirmado. Encerre o atendimento de forma cordial.";
    default:
      return (
        "O cliente quer agendar. Colete as informacoes uma de cada vez: " +
        "primeiro o servico, depois a data, depois o horario."
      );
  }
}

export function objectiveFor(
  state: ConversationState,
  _company: CompanyContext
): string {
  switch (state.intent) {
    case "appointment":
      return appointmentObjective(state);
    case "human":
      return (
        "O cliente quer falar com um humano. Diga que vai transferir para um atendente humano."
      );
    case "service":
      return (
        "O cliente quer informacoes sobre servicos ou precos. " +
        "Responda usando SOMENTE a lista de servicos abaixo. NAO invente servicos ou precos."
      );
    case "faq":
      return (
        "O cliente fez uma pergunta sobre a empresa. " +
        "Responda usando SOMENTE os dados cadastrados e as perguntas frequentes abaixo. " +
        "Se nao souber, diga que nao tem a informacao e que um atendente humano podera confirmar."
      );
    case "none":
      return (
        "O cliente ainda nao pediu nada especifico. " +
        "Cumprimente de forma breve e pergunte como pode ajudar. NAO liste os servicos ainda."
      );
    case "other":
    default:
      return (
        "Responda de forma educada e natural. " +
        "Se nao tiver a informacao, diga que nao tem e que um atendente humano podera confirmar."
      );
  }
}

export function buildPrompt(input: PromptBuildInput): BuiltPrompt {
  const { state, company, history } = input;
  const services = company.aiConfig?.services ?? [];
  const faq = company.aiConfig?.faq ?? [];
  const s = state.slots;

  const lines: string[] = [
    "Voce e o atendente da " + company.name + ". Atenda como um funcionario humano da empresa.",
    "",
    "DADOS DA EMPRESA:",
    "Nome: " + company.name,
    "Telefone: " + (company.phone ?? "Nao cadastrado"),
    "Endereco: " + (company.address ?? "Nao cadastrado"),
    "Horario: " + (company.hours ?? "Nao cadastrado"),
    "",
    "SERVICOS DISPONIVEIS:",
    listServices(services),
  ];

  if (faq.length > 0) {
    lines.push("");
    lines.push("PERGUNTAS FREQUENTES:");
    lines.push(listFAQ(faq));
  }

  lines.push("");
  lines.push("ESTADO ATUAL DA CONVERSA:");
  lines.push("Intent: " + state.intent + ", Passo: " + state.step);
  lines.push("Servico: " + (s.service ?? "nao informado"));
  lines.push("Data: " + (s.date ?? "nao informado"));
  lines.push("Horario: " + (s.time ?? "nao informado"));
  lines.push("Nome: " + (s.name ?? "nao informado"));
  lines.push("");
  lines.push("OBJETIVO ATUAL (execute exatamente isso; prevalece sobre o historico em caso de conflito):");
  lines.push(objectiveFor(state, company));
  lines.push("");
  lines.push("REGRAS:");
  lines.push("- NUNCA invente servicos, precos, funcionarios, endereco ou horario de funcionamento.");
  lines.push("- NAO confirme disponibilidade de horario.");
  lines.push("- O OBJETIVO ATUAL prevalece sobre qualquer coisa dita antes na conversa.");

  if (company.aiConfig?.instructions) {
    lines.push("");
    lines.push("INSTRUCOES: " + company.aiConfig.instructions);
  }

  if (company.aiConfig?.personality) {
    lines.push("");
    lines.push("PERSONALIDADE: " + company.aiConfig.personality);
  }

  return {
    system: lines.join("\n"),
    messages: history,
  };
}
