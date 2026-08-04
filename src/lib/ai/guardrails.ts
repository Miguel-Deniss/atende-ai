import type { CompanyContext } from "./types";

export function isGarbageResponse(content: string): boolean {
  const garbagePatterns = [
    /sou um modelo de linguagem/i,
    /como uma ia/i,
    /como modelo de linguagem/i,
    /treinado por pesquisadores/i,
    /não tenho consciência/i,
    /não tenho sentimentos/i,
    /meta/i,
    /llama/i,
  ];
  return garbagePatterns.some((p) => p.test(content));
}

export function containsInventedInfo(
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
