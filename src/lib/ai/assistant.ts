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

    services?: {
      name: string;
      price: string;
    }[];

    faq?: {
      question: string;
      answer: string;
    }[];
  };
}


export async function generateAIResponse(
  messages: AIMessage[],
  company: CompanyContext
) {

  const services =
    company.aiConfig?.services
      ?.map(
        (service) =>
          `- ${service.name}: ${service.price}`
      )
      .join("\n") ||
    "Nenhum serviço cadastrado.";


  const faq =
    company.aiConfig?.faq
      ?.map(
        (item) =>
          `Pergunta: ${item.question}\nResposta: ${item.answer}`
      )
      .join("\n\n") ||
    "Nenhuma pergunta cadastrada.";



  return await chat([

    {
      role: "system",

      content: `
Você é o atendente virtual da empresa "${company.name}".

Sua função é atender clientes e responder usando SOMENTE as informações fornecidas.


DADOS DA EMPRESA:

Nome:
${company.name}

Telefone:
${company.phone ?? "Não informado"}

Endereço:
${company.address ?? "Não informado"}

Horário:
${company.hours ?? "Não informado"}


MENSAGEM DE BOAS-VINDAS:

${company.welcomeMessage ?? ""}



SERVIÇOS DISPONÍVEIS:

${services}



PERGUNTAS FREQUENTES:

${faq}



REGRAS DE ATENDIMENTO:

1. Quando o cliente perguntar sobre serviços, mostre a lista de serviços disponíveis.

2. Quando o cliente perguntar preços, use os preços cadastrados.

3. Nunca invente serviços, produtos ou valores.

4. Não fale sobre agendamento se o cliente apenas estiver perguntando informações.

5. Só ofereça agendamento quando o cliente pedir claramente para marcar horário.

6. Se não souber uma informação, responda:

"Não tenho essa informação no momento. Vou encaminhar sua solicitação para um atendente humano."

7. Responda sempre em português do Brasil.

8. Seja educado e profissional.
`,
    },


    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),


  ]);

}