import { describe, expect, it } from "vitest";
import { periodoDoAtalho, periodoDosParametros } from "./periodo";

describe("periodoDoAtalho", () => {
  it("este mês e mês passado", () => {
    expect(periodoDoAtalho("este-mes", "2026-10-15")).toEqual({ de: "2026-10-01", ate: "2026-10-31" });
    expect(periodoDoAtalho("mes-passado", "2026-10-15")).toEqual({ de: "2026-09-01", ate: "2026-09-30" });
  });

  it("virada de ano e fevereiro bissexto", () => {
    expect(periodoDoAtalho("mes-passado", "2026-01-10")).toEqual({ de: "2025-12-01", ate: "2025-12-31" });
    expect(periodoDoAtalho("ultimos-3-meses", "2026-02-05")).toEqual({ de: "2025-12-01", ate: "2026-02-28" });
    expect(periodoDoAtalho("este-mes", "2028-02-01")).toEqual({ de: "2028-02-01", ate: "2028-02-29" });
  });

  it("este ano", () => {
    expect(periodoDoAtalho("este-ano", "2026-10-15")).toEqual({ de: "2026-01-01", ate: "2026-12-31" });
  });
});

describe("periodoDosParametros", () => {
  it("usa datas personalizadas válidas", () => {
    expect(periodoDosParametros({ de: "2026-03-01", ate: "2026-03-15" }, "2026-10-15")).toEqual({
      atalho: "personalizado",
      de: "2026-03-01",
      ate: "2026-03-15",
    });
  });

  it("cai em 'este mês' quando não há nada válido", () => {
    expect(periodoDosParametros({}, "2026-10-15")).toEqual({ atalho: "este-mes", de: "2026-10-01", ate: "2026-10-31" });
    expect(periodoDosParametros({ de: "2026-03-15", ate: "2026-03-01" }, "2026-10-15").atalho).toBe("este-mes");
    expect(periodoDosParametros({ periodo: "invalido" }, "2026-10-15").atalho).toBe("este-mes");
  });

  it("aceita atalhos", () => {
    expect(periodoDosParametros({ periodo: "este-ano" }, "2026-10-15")).toEqual({
      atalho: "este-ano",
      de: "2026-01-01",
      ate: "2026-12-31",
    });
  });
});
