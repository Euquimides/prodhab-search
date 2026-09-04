import { describe, it, expect } from "vitest";
import { coerceImportedValues } from "./coerceImportedValues";
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
      fields: [
        { id: "nombre", label: "Nombre", type: "text" },
        { id: "tipo", label: "Tipo", type: "radio", options: [{ value: "a", label: "A" }] },
        { id: "medios", label: "Medios", type: "checkboxGroup", options: [{ value: "x", label: "X" }] },
        {
          id: "items",
          label: "Elementos",
          type: "repeatableGroup",
          maxItems: 2,
          fields: [{ id: "valor", label: "Valor", type: "text" }],
        },
      ],
    },
  ],
};

describe("coerceImportedValues", () => {
  it("conserva los valores válidos", () => {
    const values = { nombre: "Ana", tipo: "a", medios: ["x"], items: [{ valor: "uno" }] };
    expect(coerceImportedValues(schema, values)).toEqual(values);
  });

  it("descarta campos desconocidos, tipos equivocados y opciones inexistentes", () => {
    expect(
      coerceImportedValues(schema, {
        nombre: { malicioso: true },
        tipo: "z",
        medios: ["x", "no-existe", 7],
        otroCampo: "sobra",
        items: "no es lista",
      })
    ).toEqual({ medios: ["x"] });
  });

  it("limpia los items del grupo y respeta maxItems", () => {
    expect(
      coerceImportedValues(schema, { items: [{ valor: "uno", extra: 1 }, null, { valor: "dos" }, { valor: "tres" }] })
    ).toEqual({ items: [{ valor: "uno" }, { valor: "dos" }] });
  });

  it("devuelve un objeto vacío si el JSON no es un objeto", () => {
    expect(coerceImportedValues(schema, "texto")).toEqual({});
  });
});
