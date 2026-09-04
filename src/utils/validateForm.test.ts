import { describe, it, expect } from "vitest";
import { isFieldVisible, validateSection, validateForm } from "./validateForm";
import type { FormSchema, FormSection } from "@/schemas/form-schema.types";

const section: FormSection = {
  id: "s1",
  number: "1.",
  title: "Sección de prueba",
  fields: [
    { id: "nombre", label: "Nombre", type: "text", required: true, maxLength: 5 },
    { id: "correo", label: "Correo", type: "email", required: true },
    {
      id: "tipo",
      label: "Tipo",
      type: "radio",
      options: [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
    },
    {
      id: "detalleA",
      label: "Detalle A",
      type: "text",
      required: true,
      visibleWhen: { fieldId: "tipo", equals: "a" },
    },
    {
      id: "items",
      label: "Items",
      type: "repeatableGroup",
      minItems: 1,
      fields: [{ id: "valor", label: "Valor", type: "text", required: true }],
    },
  ],
};

describe("isFieldVisible", () => {
  it("returns true when there is no visibleWhen rule", () => {
    expect(isFieldVisible(section.fields[0], {})).toBe(true);
  });

  it("resolves visibleWhen against the controlling field's value", () => {
    const detalleA = section.fields[3];
    expect(isFieldVisible(detalleA, { tipo: "a" })).toBe(true);
    expect(isFieldVisible(detalleA, { tipo: "b" })).toBe(false);
  });
});

describe("validateSection", () => {
  it("flags required fields left empty", () => {
    const errors = validateSection(section, { items: [{ valor: "x" }] });
    expect(errors.nombre).toBeDefined();
    expect(errors.correo).toBeDefined();
  });

  it("enforces maxLength and email format", () => {
    const errors = validateSection(section, {
      nombre: "demasiado largo",
      correo: "no-es-un-correo",
      items: [{ valor: "x" }],
    });
    expect(errors.nombre).toMatch(/5 caracteres/);
    expect(errors.correo).toMatch(/inválido/);
  });

  it("skips validation for a field hidden by visibleWhen", () => {
    const errors = validateSection(section, {
      nombre: "ok",
      correo: "a@b.com",
      tipo: "b",
      items: [{ valor: "x" }],
    });
    expect(errors.detalleA).toBeUndefined();
  });

  it("validates repeatableGroup items and minItems", () => {
    const errors = validateSection(section, { nombre: "ok", correo: "a@b.com", items: [] });
    expect(errors.items).toMatch(/al menos/);

    const errorsMissingSubfield = validateSection(section, {
      nombre: "ok",
      correo: "a@b.com",
      items: [{ valor: "" }],
    });
    expect(errorsMissingSubfield["items.0.valor"]).toBeDefined();
  });
});

describe("validateForm", () => {
  it("merges errors across all sections", () => {
    const schema: FormSchema = {
      id: "test",
      title: "Test",
      officialVersion: "1.0",
      officialEffectiveDate: "2017-04-27",
      sections: [section],
    };
    const errors = validateForm(schema, { items: [] });
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(["nombre", "correo", "items"]));
  });
});
