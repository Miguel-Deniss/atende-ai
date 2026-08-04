import { describe, it, expect } from "vitest";
import { computeAppointmentStep, mergeSlots } from "@/lib/ai/flows/appointment";
import type { ConversationSlots } from "@/lib/ai/types";

function slots(overrides: Partial<ConversationSlots> = {}): ConversationSlots {
  return { name: null, service: null, date: null, time: null, ...overrides };
}

describe("computeAppointmentStep", () => {
  it("deve pedir o servico primeiro", () => {
    expect(computeAppointmentStep(slots(), true)).toBe("waiting_service");
    expect(computeAppointmentStep(slots(), false)).toBe("waiting_service");
  });

  it("deve pedir a data depois do servico", () => {
    expect(
      computeAppointmentStep(slots({ service: "Barba" }), true)
    ).toBe("waiting_date");
  });

  it("deve pedir o horario depois da data", () => {
    expect(
      computeAppointmentStep(slots({ service: "Barba", date: "sabado" }), true)
    ).toBe("waiting_time");
  });

  it("deve pedir o nome quando necessario", () => {
    expect(
      computeAppointmentStep(
        slots({ service: "Barba", date: "sabado", time: "09:00" }),
        true
      )
    ).toBe("waiting_name");
  });

  it("deve pular o nome quando nao for necessario", () => {
    expect(
      computeAppointmentStep(
        slots({ service: "Barba", date: "sabado", time: "09:00" }),
        false
      )
    ).toBe("confirming");
  });

  it("deve ir para confirming com todos os dados", () => {
    expect(
      computeAppointmentStep(
        slots({ name: "João", service: "Barba", date: "sabado", time: "09:00" }),
        true
      )
    ).toBe("confirming");
  });
});

describe("mergeSlots", () => {
  it("deve preencher slots vazios", () => {
    const result = mergeSlots(slots(), {
      service: "Barba",
      date: "sabado",
      time: "09:00",
    });
    expect(result).toEqual({
      name: null,
      service: "Barba",
      date: "sabado",
      time: "09:00",
    });
  });

  it("deve resetar data e horario quando o servico muda", () => {
    const result = mergeSlots(
      slots({ service: "Corte", date: "sabado", time: "09:00" }),
      { service: "Barba" }
    );
    expect(result.service).toBe("Barba");
    expect(result.date).toBeNull();
    expect(result.time).toBeNull();
  });

  it("deve manter data/horario quando o servico nao muda", () => {
    const result = mergeSlots(
      slots({ service: "Barba", date: "sabado", time: "09:00" }),
      { service: "Barba" }
    );
    expect(result.date).toBe("sabado");
    expect(result.time).toBe("09:00");
  });

  it("deve resetar horario quando a data muda", () => {
    const result = mergeSlots(
      slots({ service: "Barba", date: "sabado", time: "09:00" }),
      { date: "domingo" }
    );
    expect(result.date).toBe("domingo");
    expect(result.time).toBeNull();
  });

  it("deve manter horario quando a data nao muda", () => {
    const result = mergeSlots(
      slots({ service: "Barba", date: "sabado", time: "09:00" }),
      { date: "sabado" }
    );
    expect(result.time).toBe("09:00");
  });

  it("deve preencher o nome", () => {
    const result = mergeSlots(slots(), { name: "João" });
    expect(result.name).toBe("João");
  });
});
