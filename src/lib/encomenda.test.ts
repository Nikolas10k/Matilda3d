import { describe, expect, it } from "vitest";
import { erroMudancaStatus, motivosAtencao, podeVirarVenda, proximoStatus } from "./encomenda";

describe("fluxo de status", () => {
  it("avança na ordem do docs/06", () => {
    expect(proximoStatus("nova")).toBe("em_conversa");
    expect(proximoStatus("orcada")).toBe("aprovada");
    expect(proximoStatus("pronta")).toBe("entregue");
    expect(proximoStatus("entregue")).toBeNull();
    expect(proximoStatus("cancelada")).toBeNull();
  });

  it("cancelada vem de qualquer status antes de entregue", () => {
    expect(erroMudancaStatus("nova", "cancelada")).toBeNull();
    expect(erroMudancaStatus("em_producao", "cancelada")).toBeNull();
    expect(erroMudancaStatus("entregue", "cancelada")).toBe("Uma encomenda entregue não pode ser cancelada.");
  });
});

describe("podeVirarVenda", () => {
  it("só a partir de aprovada e sem venda ativa", () => {
    expect(podeVirarVenda("orcada", false)).toBe(false);
    expect(podeVirarVenda("aprovada", false)).toBe(true);
    expect(podeVirarVenda("pronta", false)).toBe(true);
    expect(podeVirarVenda("aprovada", true)).toBe(false);
    expect(podeVirarVenda("cancelada", false)).toBe(false);
  });
});

describe("motivosAtencao", () => {
  const agora = Date.parse("2026-10-15T15:00:00Z");
  const base = { status: "em_producao" as const, data_desejada: null, criado_em: "2026-10-15T10:00:00Z" };

  it("prazo em até 7 dias ou atrasado", () => {
    expect(motivosAtencao({ ...base, data_desejada: "2026-10-22" }, "2026-10-15", agora).prazo).toBe("proxima");
    expect(motivosAtencao({ ...base, data_desejada: "2026-10-15" }, "2026-10-15", agora).prazo).toBe("proxima");
    expect(motivosAtencao({ ...base, data_desejada: "2026-10-23" }, "2026-10-15", agora).prazo).toBeNull();
    expect(motivosAtencao({ ...base, data_desejada: "2026-10-14" }, "2026-10-15", agora).prazo).toBe("atrasada");
  });

  it("nova há mais de 24 horas", () => {
    expect(motivosAtencao({ ...base, status: "nova", criado_em: "2026-10-14T14:00:00Z" }, "2026-10-15", agora).semResposta).toBe(true);
    expect(motivosAtencao({ ...base, status: "nova", criado_em: "2026-10-15T01:00:00Z" }, "2026-10-15", agora).semResposta).toBe(false);
  });

  it("finalizadas não pedem atenção", () => {
    expect(motivosAtencao({ ...base, status: "entregue", data_desejada: "2026-10-16" }, "2026-10-15", agora)).toEqual({
      prazo: null,
      semResposta: false,
    });
  });
});
