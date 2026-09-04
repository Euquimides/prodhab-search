import { describe, it, expect } from "vitest";
import { buildMarkdown } from "./exportToMarkdown";
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
        { id: "notas", label: "Notas", type: "textarea" },
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

describe("buildMarkdown", () => {
  it("renders headings, labels and option labels", () => {
    const md = buildMarkdown(schema, {
      nombre: "Ana",
      tipo: "a",
      items: [{ valor: "uno" }],
    });
    expect(md).toContain("# Formulario de prueba");
    expect(md).toContain("## 1. Sección uno");
    expect(md).toContain("- **Nombre:** Ana");
    expect(md).toContain("- **Tipo:** Opción A"); // etiqueta, no el value crudo
    expect(md).toContain("### Elementos 1");
  });

  it("collapses newlines so a textarea cannot break the bullet", () => {
    const md = buildMarkdown(schema, { notas: "línea uno\nlínea dos" });
    expect(md).toContain("- **Notas:** línea uno línea dos");
  });

  it("marks empty values and skips fields hidden by visibleWhen", () => {
    const md = buildMarkdown(schema, { tipo: "a" });
    expect(md).toContain("- **Nombre:** —");
    expect(md).not.toContain("Solo si tipo es b");
  });
});
