import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildPdfBytes } from "./exportToPdf";
import type { FormSchema } from "@/schemas/form-schema.types";

const schema: FormSchema = {
  id: "test",
  title: "Formulario de prueba",
  officialVersion: "1.0",
  officialEffectiveDate: "2017-04-27",
  sections: [
    {
      id: "s1",
      number: "1.",
      title: "Sección uno",
      description: "Descripción de la sección.",
      fields: [
        { id: "nombre", label: "Nombre", type: "text", required: true },
        {
          id: "larga",
          label: "Observaciones",
          type: "textarea",
        },
        {
          id: "items",
          label: "Elementos",
          type: "repeatableGroup",
          fields: [{ id: "valor", label: "Valor", type: "text" }],
        },
      ],
    },
  ],
};

describe("buildPdfBytes", () => {
  it("produces a valid single-page PDF for a short form", async () => {
    const bytes = await buildPdfBytes(schema, { nombre: "Ana", items: [{ valor: "uno" }] });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it("wraps long text instead of overflowing the page width, and paginates long content", async () => {
    const longText = "palabra ".repeat(2000); // fuerza wrap y múltiples páginas
    const bytes = await buildPdfBytes(schema, { nombre: "Ana", larga: longText });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThan(1);
  });

  it("no falla con saltos de línea ni símbolos fuera de WinAnsi", async () => {
    // Helvetica estándar hace throw ante saltos de línea, ₡ o emoji: deben sanearse antes.
    const bytes = await buildPdfBytes(schema, { nombre: "Ana ₡100 🙂", larga: "línea 1\nlínea 2" });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it("parte palabras más anchas que la página", async () => {
    const bytes = await buildPdfBytes(schema, { nombre: "a".repeat(500) });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it("does not crash on an empty form", async () => {
    const bytes = await buildPdfBytes(schema, {});
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });
});
