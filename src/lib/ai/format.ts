export function listServices(
  services: { name: string; price: string }[]
): string {
  if (services.length === 0) return "Nenhum servico cadastrado.";
  return services.map(s => "- " + s.name + ": " + s.price).join("\n");
}

export function listFAQ(faq: { question: string; answer: string }[]): string {
  if (faq.length === 0) return "";
  return faq.map(f => "P: " + f.question + "\nR: " + f.answer).join("\n");
}
