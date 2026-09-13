import { Metadata } from "next";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Entenda como o AtendeAI coleta, utiliza, protege e elimina dados pessoais.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-gray-300 p-8">
      <div className="max-w-3xl mx-auto">
        <Breadcrumbs current="Política de Privacidade" />
        <h1 className="text-3xl font-bold text-white mb-8">Política de Privacidade</h1>
        <p className="mb-8 text-amber-300">
          Minuta informativa sujeita a revisão jurídica antes do lançamento comercial.
        </p>

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
            <li>Provedor de IA configurado, quando necessário para processar mensagens</li>
            <li>Meta, para receber e enviar mensagens pela Cloud API do WhatsApp</li>
            <li>Resend, para entrega de e-mails transacionais</li>
            <li>Provedores de hospedagem e infraestrutura</li>
          </ul>
          <p className="mt-2">Nunca vendemos seus dados pessoais para terceiros.</p>
        </Section>

        <Section title="4. Segurança dos Dados">
          Aplicamos controles técnicos proporcionais ao serviço:
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Criptografia AES-256 para dados sensíveis</li>
            <li>Senhas hashadas com bcrypt (12 rounds)</li>
            <li>Cookies de sessão protegidos e tokens revogáveis</li>
            <li>Autenticação em dois fatores disponível para ativação</li>
            <li>Isolamento entre empresas na aplicação e role limitada no banco</li>
            <li>Registros de auditoria para eventos relevantes</li>
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
          <p className="mt-2">
            Você pode exercer esses direitos diretamente no painel:
            <span className="block ml-2">
              • Exportação protegida dos dados relacionados ao titular
            </span>
            <span className="block ml-2">
              • Anonimização por cliente, incluindo mensagens, agendamentos e conversas
            </span>
          </p>
        </Section>

        <Section title="6. Autenticação em Dois Fatores (2FA)">
          O 2FA pode ser ativado pelo usuário. Os códigos de recuperação são de uso único e devem
          ser guardados em local seguro. O 2FA ainda não é obrigatório para administradores.
        </Section>

        <Section title="7. Retenção de Dados">
          Leads do formulário de demonstração são eliminados após 90 dias. Eventos técnicos e
          tentativas de login seguem os prazos operacionais descritos na documentação. Dados da
          conta e registros fiscais seguem o contrato e as obrigações legais aplicáveis; os prazos
          finais dependem de revisão jurídica e contábil.
        </Section>

        <Section title="8. Cookies">
          Utilizamos cookies essenciais para o funcionamento da plataforma. Não utilizamos cookies
          de rastreamento ou publicidade.
        </Section>

        <Section title="9. Contato">
          Para exercer seus direitos ou esclarecer dúvidas, entre em contato:
          <p className="mt-2">Email: privacidade@atendeai.com</p>
        </Section>

        <p className="text-sm text-gray-500 mt-8">Última atualização: Setembro de 2026</p>
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
