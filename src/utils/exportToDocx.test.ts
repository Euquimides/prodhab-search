import { describe, it, expect } from "vitest";
import { Packer } from "docx";
import { buildDocxDocument } from "./exportToDocx";
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
          id: "tipo",
          label: "Tipo",
          type: "radio",
          options: [
            { value: "a", label: "Opción A" },
            { value: "b", label: "Opción B" },
          ],
        },
        {
          id: "categorias",
          label: "Categorías",
          type: "checkboxGroup",
          options: [
            { value: "x", label: "Categoría X" },
            { value: "y", label: "Categoría Y" },
          ],
        },
        {
          id: "oculto",
          label: "Solo si tipo es b",
          type: "text",
          visibleWhen: { fieldId: "tipo", equals: "b" },
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

describe("buildDocxDocument", () => {
  it("builds a packable document for a fully filled form", async () => {
    const doc = buildDocxDocument(schema, {
      nombre: "Ana",
      tipo: "a",
      categorias: ["x", "y"],
      items: [{ valor: "uno" }, { valor: "dos" }],
    });
    const buffer = await Packer.toBuffer(doc);
    expect(buffer.byteLength).toBeGreaterThan(0);
  });

  it("builds a packable document for an empty form (no crashes on missing values)", async () => {
    const doc = buildDocxDocument(schema, {});
    const buffer = await Packer.toBuffer(doc);
    expect(buffer.byteLength).toBeGreaterThan(0);
  });

  it("skips fields hidden by visibleWhen", async () => {
    const doc = buildDocxDocument(schema, { tipo: "a" });
    // no debe lanzar aunque "oculto" dependa de tipo === "b" y nunca se muestre
    const buffer = await Packer.toBuffer(doc);
    expect(buffer.byteLength).toBeGreaterThan(0);
  });
});
