export function normalizeBrazilianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length < 10 || digits.length > 13) {
    throw new Error("Telefone invalido");
  }

  return digits.startsWith("55") ? digits : `55${digits}`;
}
