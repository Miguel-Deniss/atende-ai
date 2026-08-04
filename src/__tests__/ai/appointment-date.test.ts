import { describe, it, expect } from "vitest";
import { resolveAppointmentDate } from "@/lib/ai/appointment-date";

const BASE = new Date(2026, 7, 3, 14, 30);

describe("resolveAppointmentDate", () => {
  it("deve resolver 'hoje' para o inicio do dia", () => {
    expect(resolveAppointmentDate("hoje", BASE)).toEqual(new Date(2026, 7, 3));
  });

  it("deve resolver 'amanha' para o dia seguinte", () => {
    expect(resolveAppointmentDate("amanha", BASE)).toEqual(new Date(2026, 7, 4));
  });

  it("deve resolver 'depois de amanha'", () => {
    expect(resolveAppointmentDate("depois de amanha", BASE)).toEqual(
      new Date(2026, 7, 5)
    );
  });

  it("deve resolver data ISO", () => {
    expect(resolveAppointmentDate("2026-08-08", BASE)).toEqual(
      new Date(2026, 7, 8)
    );
  });

  it("deve resolver data ISO com mes de um digito", () => {
    expect(resolveAppointmentDate("2026-8-8", BASE)).toEqual(
      new Date(2026, 7, 8)
    );
  });

  it("deve resolver 'dia 20' no mes atual quando futuro", () => {
    expect(resolveAppointmentDate("dia 20", BASE)).toEqual(new Date(2026, 7, 20));
  });

  it("deve resolver 'dia 1' para o mes seguinte quando passado", () => {
    expect(resolveAppointmentDate("dia 1", BASE)).toEqual(new Date(2026, 8, 1));
  });

  it("deve resolver dia da semana atual (segunda-feira)", () => {
    expect(resolveAppointmentDate("segunda-feira", BASE)).toEqual(
      new Date(2026, 7, 3)
    );
  });

  it("deve resolver dia da semana futuro (sabado)", () => {
    expect(resolveAppointmentDate("sabado", BASE)).toEqual(new Date(2026, 7, 8));
  });

  it("deve resolver dia da semana passado para a proxima semana (domingo)", () => {
    expect(resolveAppointmentDate("domingo", BASE)).toEqual(new Date(2026, 7, 9));
  });

  it("deve ser case/acento insensivel", () => {
    expect(resolveAppointmentDate("SÁBADO", BASE)).toEqual(new Date(2026, 7, 8));
  });

  it("deve retornar null para valor desconhecido", () => {
    expect(resolveAppointmentDate("qualquer coisa", BASE)).toBeNull();
  });

  it("deve retornar null para dia invalido", () => {
    expect(resolveAppointmentDate("dia 40", BASE)).toBeNull();
  });

  it("deve retornar null para data invalida", () => {
    expect(resolveAppointmentDate("2026-13-99", BASE)).toBeNull();
  });

  it("deve retornar null para string vazia", () => {
    expect(resolveAppointmentDate("", BASE)).toBeNull();
  });
});
