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

  it("uses pre-parsed secciones when available", () => {
    const texto = "Header aquí. algo parsed. ley parsed. resuelve.";
    const secciones = { resultando: "algo parsed.", considerando: "ley parsed.", por_tanto: "resuelve." };
    const result = parseResolutionText(texto, secciones);
    expect(result.map((s) => s.label)).toEqual(["Encabezado", "Resultando", "Considerando", "Por tanto"]);
    expect(result[1].text).toBe("algo parsed.");
  });

  it("re-cuts por_tanto that was split at a lowercase 'por tanto'", () => {
    const texto = "Encabezado. Hechos varios. con mis obligaciones, por tanto recurri al juez. POR TANTO se resuelve.";
    const secciones = {
      considerando: "Analisis de los hechos.",
      por_tanto: "por tanto recurri al juez. POR TANTO se resuelve.",
    };
    const result = parseResolutionText(texto, secciones);
    const pt = result.find((s) => s.label === "Por tanto")!;
    const cons = result.find((s) => s.label === "Considerando")!;
    expect(pt.text).toBe("POR TANTO se resuelve.");
    expect(cons.text).toContain("por tanto recurri al juez."); // devuelto al considerando
  });

  it("handles duplicate POR TANTO markers in texto", () => {
    const text = "Header. CONSIDERANDO la ley. POR TANTO primero. POR TANTO segundo.";
    const result = parseResolutionText(text);
    expect(result.filter((s) => s.label === "Por tanto")).toHaveLength(1);
    expect(result.find((s) => s.label === "Por tanto")!.text).toContain("segundo");
  });
});

describe("splitIntoParagraphs", () => {
  it("keeps short marker-less text as a single paragraph", () => {
    const text = "Primera. Segunda. Tercera. Cuarta. Quinta.";
    expect(splitIntoParagraphs(text)).toEqual([text]);
  });

  it("sentence-groups long marker-less blocks into chunks of ~3", () => {
    const sentence = "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do.";
    const text = Array(30).fill(sentence).join(" "); // > 1200 caracteres, sin marcadores
    const result = splitIntoParagraphs(text);
    expect(result.length).toBe(10); // 30 oraciones / 3
    expect(result[0]).toBe([sentence, sentence, sentence].join(" "));
  });

  it("sentence-groups an oversized block even when other markers matched", () => {
    const longFondo = "SOBRE EL FONDO: " + "Frase larga del análisis legal. ".repeat(60);
    const text = "- 1. Punto breve. " + longFondo;
    const result = splitIntoParagraphs(text);
    expect(result[0]).toBe("- 1. Punto breve.");
    expect(result.length).toBeGreaterThan(2); // el bloque de fondo fue dividido
    expect(result.every((p) => p.length < 1300)).toBe(true);
  });

  it("does not split after abbreviations like 'Ley No. 8968'", () => {
    const filler = "Texto de relleno para superar el umbral de mil doscientos caracteres. ".repeat(20);
    const text = filler + "protegidos por la Ley No. 8968, efectivamente probado. " + filler;
    const result = splitIntoParagraphs(text);
    // "8968" nunca debe iniciar un párrafo (significaría que la abreviatura fue dividida)
    expect(result.some((p) => /^8968/.test(p.trim()))).toBe(false);
    expect(result.some((p) => /Ley No\. 8968/.test(p))).toBe(true);
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
