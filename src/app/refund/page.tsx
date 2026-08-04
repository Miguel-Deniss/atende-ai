import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Reembolso - AtendeAI",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-gray-300 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Política de Reembolso</h1>

        <Section title="1. Período de Garantia">
          Oferecemos garantia de reembolso de 7 (sete) dias corridos a partir da
          data do primeiro pagamento do plano, sem necessidade de justificativa.
        </Section>

        <Section title="2. Como Solicitar">
          Para solicitar o reembolso, entre em contato pelo email{" "}
          <span className="text-white">suporte@atendeai.com</span> informando a
          conta (email cadastrado) e o motivo. A solicitação será analisada em
          até 5 dias úteis.
        </Section>

        <Section title="3. Forma de Pagamento">
          O valor será estornado integralmente, quando aplicável, na mesma forma
          de pagamento utilizada na compra. O prazo de processamento depende da
          operadora do cartão (geralmente 7 a 15 dias úteis).
        </Section>

        <Section title="4. Renovações">
          Reembolsos não se aplicam a renovações de assinatura já consumadas,
          exceto em casos de erro de cobrança comprovado ou indisponibilidade do
          serviço por período superior a 24 horas contínuas.
        </Section>

        <Section title="5. Cancelamento">
          Você pode cancelar sua assinatura a qualquer momento. Após o
          cancelamento, o serviço permanece ativo até o fim do período já pago e
          não há cobranças futuras.
        </Section>

        <p className="text-sm text-gray-500 mt-8">Última atualização: Agosto 2026</p>
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
