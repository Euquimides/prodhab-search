import type {
  CheckboxGroupField,
  FormSchema,
  FormSection,
  FormValues,
  RadioField,
  SimpleField,
} from "@/schemas/form-schema.types";
import { isFieldVisible } from "./validateForm";

// ponytail: DOCX y PDF necesitan la misma secuencia "título de sección /
// descripción / campo: valor" recorriendo el schema. Se aplana una sola
// vez aquí y cada exportador solo decide cómo dibujar cada tipo de línea
// (Paragraph con estilos en docx, texto envuelto en pdf-lib) — evita
// mantener dos recorridos idénticos del schema en paralelo.

export type DocLine =
  | { kind: "title"; text: string }
  | { kind: "subtitle"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "description"; text: string }
  | { kind: "groupTitle"; text: string }
  | { kind: "field"; label: string; value: string };

function optionLabel(field: RadioField | CheckboxGroupField, value: string): string {
  return field.options.find((o) => o.value === value)?.label ?? value;
}

function formatValue(field: SimpleField, rawValue: unknown): string {
  if (rawValue === undefined || rawValue === null || rawValue === "") return "—";
  if (field.type === "radio") return optionLabel(field, rawValue as string);
  if (field.type === "checkboxGroup") {
    const selected = rawValue as string[];
    return selected.length ? selected.map((v) => optionLabel(field, v)).join(", ") : "—";
  }
  return String(rawValue);
}

function sectionLines(section: FormSection, values: FormValues): DocLine[] {
  const lines: DocLine[] = [{ kind: "heading", text: `${section.number} ${section.title}` }];
  if (section.description) lines.push({ kind: "description", text: section.description });

  for (const field of section.fields) {
    if (!isFieldVisible(field, values)) continue;

    if (field.type === "repeatableGroup") {
      const items = (values[field.id] as Record<string, string>[] | undefined) ?? [];
      // Sin items: una sola línea "Label: —". Con items, cada uno lleva su
      // propio encabezado numerado; un título de grupo aparte lo duplicaría.
      if (items.length === 0) {
        lines.push({ kind: "field", label: field.label, value: "—" });
      }
      items.forEach((item, index) => {
        lines.push({ kind: "groupTitle", text: `${field.label} ${index + 1}` });
        for (const subField of field.fields) {
          lines.push({ kind: "field", label: subField.label, value: formatValue(subField, item[subField.id]) });
        }
      });
      continue;
    }

    lines.push({ kind: "field", label: field.label, value: formatValue(field, values[field.id]) });
  }

  return lines;
}

export function buildDocLines(schema: FormSchema, values: FormValues): DocLine[] {
  const lines: DocLine[] = [
    { kind: "title", text: schema.title },
    { kind: "subtitle", text: `Versión oficial ${schema.officialVersion} — vigente desde ${schema.officialEffectiveDate}` },
  ];
  for (const section of schema.sections) {
    lines.push(...sectionLines(section, values));
  }
  return lines;
}
