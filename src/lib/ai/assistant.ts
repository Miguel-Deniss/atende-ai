import { chat } from "./provider";

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CompanyContext {
  name: string;
  phone?: string | null;
  address?: string | null;
  hours?: string | null;
  welcomeMessage?: string | null;
  aiConfig?: {
    personality?: string | null;
    instructions?: string | null;
    services?: { name: string; price: string }[];
    faq?: { question: string; answer: string }[];
  };
}

function listServices(services: { name: string; price: string }[]): string {
  if (services.length === 0) return "Nenhum servico cadastrado.";
  return services.map(s => "- " + s.name + ": " + s.price).join("\n");
}

function buildSystemPrompt(company: CompanyContext): string {
  const services = company.aiConfig?.services ?? [];
  const faq = company.aiConfig?.faq ?? [];

  const hasPhone = !!company.phone;
  const hasAddress = !!company.address;
  const hasHours = !!company.hours;
  const hasFAQ = faq.length > 0;

  const serviceList = listServices(services);

  const lines: string[] = [
    "Voce e o atendente da " + company.name + ". Atenda como um funcionario humano da empresa.",
    "",
    "REGRAS ABSOLUTAS — NUNCA VIOLAR:",
    "",
    "1. NUNCA invente informacoes. Se um dado nao estiver listado abaixo, voce NAO pode menciona-lo.",
    "2. NUNCA invente servicos. Os UNICOS servicos existentes sao os listados abaixo.",
    "3. NUNCA invente funcionarios. Nao mencione nomes de pessoas.",
    "4. NUNCA confirme disponibilidade de horario. Apenas colete dia e horario desejados.",
    "5. NUNCA invente precos que nao estejam na lista de servicos.",
    "6. NUNCA invente pagamentos. Nao diga 'pagamento aprovado', 'cartao', 'pix', 'dinheiro'.",
    "7. NUNCA invente produtos. Nao mencione perfumes, cremes, ou qualquer item nao listado.",
    "8. NUNCA invente endereco se nao estiver cadastrado.",
    "9. NUNCA invente telefone se nao estiver cadastrado.",
    "10. NUNCA invente horarios de funcionamento se nao estiverem cadastrados.",
    "",
    "REGRAS DE ATENDIMENTO:",
    "- Responda em portugues brasileiro, educado e natural.",
    "- Se o cliente perguntar servicos, liste SOMENTE os servicos abaixo.",
    "- Se o cliente perguntar preco de um servico, informe o preco exato desse servico.",
    "- Se o cliente quiser agendar, pergunte qual servico, qual dia e qual horario.",
    "- NUNCA confirme o horario. Apenas registre a solicitacao.",
    "- Se o cliente perguntar algo que voce nao tem informacao, diga:",
    '  "Nao tenho essa informacao no momento. Um atendente podera confirmar."',
    "- Se o cliente quiser falar com humano, diga que vai transferir.",
    "- Nao encerre a conversa ate o cliente indicar que acabou.",
    "",
    "DADOS DA EMPRESA:",
    "Nome: " + company.name,
    "Telefone: " + (hasPhone ? company.phone : "Nao cadastrado"),
    "Endereco: " + (hasAddress ? company.address : "Nao cadastrado"),
    "Horario: " + (hasHours ? company.hours : "Nao cadastrado"),
    "",
    "SERVICOS DISPONIVEIS:",
    serviceList,
    "",
    "SERVICOS QUE NAO EXISTEM (NAO INVENTAR): qualquer servico fora da lista acima.",
  ];

  if (hasFAQ) {
    lines.push("");
    lines.push("PERGUNTAS FREQUENTES (use estas respostas quando perguntado):");
    for (const f of faq) {
      lines.push("P: " + f.question);
      lines.push("R: " + f.answer);
    }
  }

  if (company.aiConfig?.instructions) {
    lines.push("");
    lines.push("INSTRUCOES: " + company.aiConfig.instructions);
  }

  if (company.aiConfig?.personality) {
    lines.push("");
    lines.push("PERSONALIDADE: " + company.aiConfig.personality);
  }

  return lines.join("\n");
}

function containsInventedInfo(
  response: string,
  company: CompanyContext
): string | null {
  const services = company.aiConfig?.services ?? [];
  const knownServiceNames = services.map(s => s.name.toLowerCase().trim());
  const knownWords = new Set<string>();

  for (const s of knownServiceNames) {
    for (const word of s.split(/\s+/)) {
      if (word.length > 2) knownWords.add(word);
    }
  }

  const inventionPatterns: RegExp[] = [
    /pagamento aprovado/i,
    /pagamento realizado/i,
    /pagamento confirmado/i,
    /cartao de credito/i,
    /cartao de debito/i,
    /aqui esta seu cartao/i,
    /creme corporal/i,
    /perfume/i,
    /raspagem/i,
    /manicure/i,
    /pedicure/i,
    /depilacao/i,
    /massagem/i,
    /limpeza de pele/i,
    /produtos? de (beleza|higiene|cabelo)/i,
  ];

  for (const pattern of inventionPatterns) {
    if (pattern.test(response)) {
      return "Resposta menciona informacao que nao existe no cadastro da empresa: " + pattern.source;
    }
  }

  const namePattern = /\b([A-ZÀ-Ú][a-zà-ú]+)\s+(vai|podera|ira|pode|esta)\s+(atende|realizar|cortar|fazer)/i;
  const nameMatch = response.match(namePattern);
  if (nameMatch) {
    return "Resposta menciona nome de funcionario que nao existe no cadastro: " + nameMatch[1];
  }

  return null;
}

export async function generateAIResponse(
  messages: AIMessage[],
  company: CompanyContext
) {
  const recentMessages = messages
    .filter(m => m.content.trim() !== "")
    .slice(-6);

  const systemPrompt = buildSystemPrompt(company);

  const ollamaMessages = recentMessages.map((m, i) => {
    if (i === 0) {
      return { role: m.role, content: systemPrompt + "\n\n---\n\n" + m.content };
    }
    return { role: m.role, content: m.content };
  });

  console.log("===== MENSAGENS ENVIADAS AO OLLAMA =====");
  console.log(JSON.stringify(ollamaMessages, null, 2));

  let response = await chat(ollamaMessages);

  console.log("===== RESPOSTA OLLAMA =====");
  console.log(response);

  const inventedIssue = containsInventedInfo(response, company);
  if (inventedIssue) {
    console.error("IA INVENTOU INFORMACAO:", inventedIssue);
    throw new Error("A IA gerou resposta com informacoes incorretas.");
  }

  return response;
}
