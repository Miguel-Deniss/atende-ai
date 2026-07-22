import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade - AtendeAI",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-gray-300 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Política de Privacidade</h1>

        <Section title="1. Dados Coletados">
          Coletamos os seguintes dados para fornecer nossos serviços:
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Nome completo</li>
            <li>Endereço de email</li>
            <li>Número de telefone</li>
            <li>Nome da empresa</li>
            <li>Dados de faturamento (processados via Stripe - não armazenamos dados de cartão)</li>
            <li>Dados de clientes cadastrados por você no sistema</li>
            <li>Mensagens e conversas automatizadas</li>
            <li>Logs de acesso e atividade</li>
          </ul>
        </Section>

        <Section title="2. Finalidade do Tratamento">
          Seus dados são utilizados para:
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Fornecer e manter nossos serviços de IA para WhatsApp</li>
            <li>Processar pagamentos e gerenciar assinaturas</li>
            <li>Enviar comunicações relacionadas ao serviço</li>
            <li>Melhorar e personalizar sua experiência</li>
            <li> cumprir obrigações legais e regulatórias</li>
          </ul>
        </Section>

        <Section title="3. Compartilhamento de Dados">
          Compartilhamos dados apenas com:
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Stripe (processamento de pagamentos)</li>
            <li>OpenAI (processamento de mensagens da IA)</li>
            <li>Provedores de hospedagem e infraestrutura</li>
          </ul>
          <p className="mt-2">Nunca vendemos seus dados pessoais para terceiros.</p>
        </Section>

        <Section title="4. Segurança dos Dados">
          Implementamos medidas de segurança rigorosas:
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Criptografia AES-256 para dados sensíveis</li>
            <li>Senhas hashadas com bcrypt (12 rounds)</li>
            <li>HTTPS obrigatório em toda a aplicação</li>
            <li>Autenticação em dois fatores para administradores</li>
            <li>Isolamento completo entre empresas (multi-tenant)</li>
            <li>Auditoria de todas as alterações</li>
          </ul>
        </Section>

        <Section title="5. Seus Direitos (LGPD)">
          Você tem direito a:
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos ou incorretos</li>
            <li>Solicitar a exclusão de seus dados</li>
            <li>Solicitar a portabilidade dos dados</li>
            <li>Revogar consentimento a qualquer momento</li>
            <li>Saber com quem compartilhamos seus dados</li>
          </ul>
        </Section>

        <Section title="6. Retenção de Dados">
          Mantemos seus dados enquanto sua conta estiver ativa. Após o cancelamento, os dados são mantidos por 90 dias para recuperação e depois excluídos permanentemente.
        </Section>

        <Section title="7. Cookies">
          Utilizamos cookies essenciais para o funcionamento da plataforma. Não utilizamos cookies de rastreamento ou publicidade.
        </Section>

        <Section title="8. Contato">
          Para exercer seus direitos ou esclarecer dúvidas, entre em contato:
          <p className="mt-2">Email: privacidade@atendeai.com</p>
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
