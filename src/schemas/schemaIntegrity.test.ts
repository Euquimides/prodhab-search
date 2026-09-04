import { describe, it, expect } from "vitest";
import { organismosPublicosSchema } from "./organismos-publicos.schema";
import { personasFisicasSchema } from "./personas-fisicas.schema";
import { personasJuridicasSchema } from "./personas-juridicas.schema";
import type { FormSchema } from "./form-schema.types";

const schemas: FormSchema[] = [organismosPublicosSchema, personasFisicasSchema, personasJuridicasSchema];

/**
 * `FormValues` es un mapa plano por `field.id`, así que dos campos con el
 * mismo id en secciones distintas comparten estado (y comparten id en el
 * DOM). Este test recorre los 3 schemas buscando esa clase de error y las
 * reglas `visibleWhen` que nunca se pueden cumplir.
 */
function findProblems(schema: FormSchema): string[] {
  const problems: string[] = [];
  const fields = new Map<string, (typeof schema.sections)[number]["fields"][number]>();
  const sectionIds = new Set<string>();

  for (const section of schema.sections) {
    if (sectionIds.has(section.id)) problems.push(`sección duplicada: ${section.id}`);
    sectionIds.add(section.id);
    for (const field of section.fields) {
      if (fields.has(field.id)) problems.push(`campo duplicado: ${field.id}`);
      fields.set(field.id, field);
      if (field.type === "repeatableGroup") {
        for (const sub of field.fields) {
          // El renderer guarda cada item como Record<string, string> y evalúa
          // visibleWhen contra los valores del nivel superior.
          if (sub.type === "checkboxGroup") problems.push(`checkboxGroup dentro de grupo: ${field.id}.${sub.id}`);
          if (sub.visibleWhen) problems.push(`visibleWhen dentro de grupo: ${field.id}.${sub.id}`);
        }
      }
    }
  }

  for (const field of fields.values()) {
    const rule = field.visibleWhen;
    if (!rule) continue;
    const controller = fields.get(rule.fieldId);
    if (!controller) {
      problems.push(`visibleWhen apunta a un campo inexistente: ${field.id} -> ${rule.fieldId}`);
      continue;
    }
    if (controller.type === "radio" || controller.type === "checkboxGroup") {
      if (!controller.options.some((o) => o.value === rule.equals))
        problems.push(`visibleWhen.equals no es una opción: ${field.id} -> ${controller.id}=${rule.equals}`);
    }
  }
  return problems;
}

describe("schemas de formularios", () => {
  for (const schema of schemas) {
    it(`${schema.id}: ids únicos y visibleWhen alcanzable`, () => {
      expect(findProblems(schema)).toEqual([]);
    });
  }
});
