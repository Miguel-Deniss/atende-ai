import { Metadata } from "next";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";

export const metadata: Metadata = {
  title: "Política de Reembolso",
  description: "Consulte as condições e o processo para solicitar reembolso no AtendeAI.",
  alternates: { canonical: "/refund" },
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-gray-300 p-8">
      <div className="max-w-3xl mx-auto">
        <Breadcrumbs current="Política de Reembolso" />
        <h1 className="text-3xl font-bold text-white mb-8">Política de Reembolso</h1>
        <p className="mb-8 text-amber-300">
          Minuta sujeita a definição comercial e revisão jurídica antes do lançamento.
        </p>

        <Section title="1. Período de Garantia">
          O direito de arrependimento e eventuais reembolsos observarão a legislação aplicável e as
          condições comerciais apresentadas na contratação.
        </Section>

        <Section title="2. Como Solicitar">
          Para solicitar o reembolso, entre em contato pelo email{" "}
          <span className="text-white">suporte@atendeai.com</span> informando a conta (email
          cadastrado) e o motivo. O prazo de análise será informado no atendimento.
        </Section>

        <Section title="3. Forma de Pagamento">
          O valor será estornado integralmente, quando aplicável, na mesma forma de pagamento
          utilizada na compra. O prazo de processamento depende do Stripe, da operadora e do banco.
        </Section>

        <Section title="4. Renovações">
          Reembolsos não se aplicam a renovações de assinatura já consumadas, exceto em casos de
          erro de cobrança comprovado ou indisponibilidade do serviço por período superior a 24
          horas contínuas.
        </Section>

        <Section title="5. Cancelamento">
          Você pode cancelar sua assinatura a qualquer momento. Após o cancelamento, o serviço
          permanece ativo até o fim do período já pago e não há cobranças futuras.
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
