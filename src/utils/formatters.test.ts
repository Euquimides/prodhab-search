import { describe, it, expect } from "vitest";
import { parseResolutionText, splitIntoParagraphs, formatCitaCR, fmtFecha } from "./formatters";
import type { ResolutionItem } from "@/context/SearchContext";

describe("parseResolutionText", () => {
  it("returns single section when no markers found", () => {
    const result = parseResolutionText("Texto simple sin marcadores.");
    expect(result).toEqual([{ label: "Texto", text: "Texto simple sin marcadores." }]);
  });

  it("splits on RESULTANDO / CONSIDERANDO / POR TANTO", () => {
    const text = "Encabezado aquí. RESULTANDO que algo pasó. CONSIDERANDO la ley. POR TANTO se resuelve.";
    const result = parseResolutionText(text);
    expect(result.map((s) => s.label)).toEqual(["Encabezado", "Resultando", "Considerando", "Por tanto"]);
    expect(result[0].text).toBe("Encabezado aquí.");
    expect(result[1].text).toContain("RESULTANDO");
    expect(result[3].text).toContain("POR TANTO");
  });

  it("handles POR LO TANTO as alternative marker", () => {
    const text = "RESULTANDO hechos. POR LO TANTO se ordena.";
    const result = parseResolutionText(text);
    expect(result.map((s) => s.label)).toEqual(["Resultando", "Por tanto"]);
  });

  it("omits empty header when text starts with a marker", () => {
    const text = "CONSIDERANDO la norma. POR TANTO se resuelve.";
    const result = parseResolutionText(text);
    expect(result[0].label).toBe("Considerando");
    expect(result).toHaveLength(2);
  });
});

describe("splitIntoParagraphs", () => {
  it("groups sentences into paragraphs of ~3", () => {
    const text = "Primera. Segunda. Tercera. Cuarta. Quinta.";
    const result = splitIntoParagraphs(text);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe("Primera. Segunda. Tercera.");
    expect(result[1]).toBe("Cuarta. Quinta.");
  });

  it("returns single paragraph for short text", () => {
    const result = splitIntoParagraphs("Una sola oración.");
    expect(result).toEqual(["Una sola oración."]);
  });
});

describe("fmtFecha", () => {
  it("formats ISO date string to es-CR locale", () => {
    const result = fmtFecha("2024-01-15");
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
  });
});

describe("formatCitaCR", () => {
  it("includes PRODHAB, resolution number, and expediente", () => {
    const item = {
      id: "1",
      titulo: "Test",
      texto: "...",
      metadatos: { resolucion: "572-2024", expediente: "138-07-2023-DEN", fecha: "2024-03-15" },
    } as ResolutionItem;
    const result = formatCitaCR(item);
    expect(result).toContain("PRODHAB");
    expect(result).toContain("572-2024");
    expect(result).toContain("138-07-2023-DEN");
    expect(result).toMatch(/\.$/);
  });

  it("works with minimal metadata", () => {
    const item = { id: "2", titulo: "Test", texto: "...", metadatos: {} } as ResolutionItem;
    const result = formatCitaCR(item);
    expect(result).toContain("PRODHAB");
    expect(result).toMatch(/\.$/);
  });
});
