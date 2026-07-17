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
    answer: "O AtendeAI é um atendente virtual com inteligência artificial que se integra ao WhatsApp do seu negócio. Você configura as informações da sua empresa (serviços, horários, preços) e nossa IA responde automaticamente os clientes, agenda horários e envia lembretes. Tudo de forma simples e automática.",
  },
  {
    question: "Preciso instalar algum software?",
    answer: "Não! O AtendeAI funciona 100% online. Você só precisa ter uma conta no WhatsApp Business e fazer a integração com nossa plataforma. Todo o gerenciamento é feito pelo nosso dashboard web, sem necessidade de instalar nada.",
  },
  {
    question: "A IA aprende sobre meu negócio?",
    answer: "Sim! Você insere todas as informações do seu negócio (serviços, preços, horários, endereço, FAQ) e nossa IA é treinada especificamente com esses dados. Quanto mais informações você fornecer, mais precisa serão as respostas.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer: "Sim, você pode cancelar sua assinatura a qualquer momento, sem multas ou burocracia. Seu acesso continua ativo até o final do período já pago.",
  },
  {
    question: "Quanto tempo leva para configurar?",
    answer: "A configuração inicial leva menos de 15 minutos. Basta criar sua conta, conectar seu WhatsApp Business e preencher as informações do seu negócio. Pronto, seu atendente virtual já estará funcionando!",
  },
  {
    question: "O que acontece se a IA não souber responder?",
    answer: "Caso a IA não consiga responder alguma pergunta, o atendimento é automaticamente transferido para você ou sua equipe. Você também pode definir palavras-chave que disparam a transferência para atendimento humano.",
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
            Perguntas{" "}
            <span className="gradient-text">frequentes</span>
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
