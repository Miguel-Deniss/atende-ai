import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso - AtendeAI",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-gray-300 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Termos de Uso</h1>

        <Section title="1. Aceitação dos Termos">
          Ao utilizar a plataforma AtendeAI, você concorda com estes termos de uso. Se não concordar, não utilize nossos serviços.
        </Section>

        <Section title="2. Descrição do Serviço">
          O AtendeAI é uma plataforma SaaS que fornece atendimento automatizado via WhatsApp utilizando inteligência artificial.
        </Section>

        <Section title="3. Responsabilidades do Usuário">
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Manter a confidencialidade de suas credenciais de acesso</li>
            <li>Não compartilhar sua conta com terceiros não autorizados</li>
            <li>Utilizar a plataforma em conformidade com as leis aplicáveis</li>
            <li>Não enviar conteúdo ilegal, ofensivo ou que viole direitos de terceiros</li>
            <li>Não tentar burlar as medidas de segurança da plataforma</li>
          </ul>
        </Section>

        <Section title="4. Propriedade Intelectual">
          Todo o código, design e conteúdo da plataforma são propriedade exclusiva do AtendeAI. O usuário recebe uma licença limitada para uso do serviço.
        </Section>

        <Section title="5. Privacidade e Dados">
          O tratamento de dados pessoais segue nossa Política de Privacidade. Ao usar o serviço, você consente com a coleta e uso de dados conforme descrito na política.
        </Section>

        <Section title="6. Limitação de Responsabilidade">
          O AtendeAI não se responsabiliza por:
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Danos indiretos ou consequenciais decorrentes do uso do serviço</li>
            <li>Interrupções temporárias do serviço para manutenção</li>
            <li>Conteúdo gerado pela IA que possa conter imprecisões</li>
            <li>Uso indevido da plataforma pelo usuário</li>
          </ul>
        </Section>

        <Section title="7. Cancelamento e Exclusão">
          O usuário pode cancelar sua assinatura a qualquer momento. Os dados são mantidos por 90 dias após o cancelamento e depois excluídos permanentemente.
        </Section>

        <Section title="8. Modificações dos Termos">
          Reservamo-nos o direito de modificar estes termos a qualquer momento. Mudanças significativas serão comunicadas por email.
        </Section>

        <Section title="9. Lei Aplicável">
          Estes termos são regidos pela legislação brasileira. Qualquer disputa será resolvida no foro da cidade de São Paulo, SP.
        </Section>

        <Section title="10. Contato">
          Dúvidas sobre estes termos: contato@atendeai.com
        </Section>

        <p className="text-sm text-gray-500 mt-8">Última atualização: Julho 2026</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-white mb-3">{title}</h2>
      <div className="text-gray-400 leading-relaxed">{children}</div>
    </section>
  );
}
