"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Como funciona o AtendeAI?",
    answer:
      "O AtendeAI recebe mensagens pela Meta Cloud API, consulta os serviços, horários e respostas cadastrados pela empresa e mantém as conversas no painel. Quando configurado, também valida horários e registra agendamentos.",
  },
  {
    question: "Preciso instalar algum software?",
    answer:
      "Não. O gerenciamento é feito no navegador. Para usar o canal do WhatsApp, a empresa precisa configurar as credenciais e o número compatível com a Meta Cloud API.",
  },
  {
    question: "Como a IA conhece meu negócio?",
    answer:
      "A IA recebe como contexto apenas as informações cadastradas, como serviços, preços, horários, endereço e perguntas frequentes. Isso não representa treinamento de um novo modelo e reduz o risco de respostas fora do escopo.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer:
      "Sim, você pode cancelar sua assinatura a qualquer momento, sem multas ou burocracia. Seu acesso continua ativo até o final do período já pago.",
  },
  {
    question: "Quanto tempo leva para configurar?",
    answer:
      "O tempo varia conforme a liberação e as credenciais da Meta e a quantidade de informações da empresa. A conta, os serviços e as respostas podem ser preparados no painel antes da conexão do canal.",
  },
  {
    question: "O que acontece se a IA não souber responder?",
    answer:
      "Quando não há informação cadastrada, a orientação é não inventar uma resposta. A conversa pode ser assumida por um atendente no painel, interrompendo as respostas automáticas enquanto o controle humano estiver ativo.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Perguntas <span className="gradient-text">frequentes</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Tire suas dúvidas sobre o AtendeAI
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-white hover:text-blue-400 text-base font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-400 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
