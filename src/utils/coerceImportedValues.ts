import type { FormSchema, FormValues, SimpleField } from "@/schemas/form-schema.types";

// ponytail: el .json de progreso lo edita quien quiera (es un archivo local),
// así que al cargarlo se descarta lo que no encaje con el schema en vez de
// meterlo tal cual en el estado: un objeto donde el renderer espera string
// tumba la página entera. Se filtra contra el mismo schema que ya define los
// campos — sin validador de esquemas JSON aparte.

function coerceSimple(field: SimpleField, raw: unknown): string | string[] | undefined {
  if (field.type === "checkboxGroup") {
    if (!Array.isArray(raw)) return undefined;
    const valid = raw.filter((v): v is string => typeof v === "string" && field.options.some((o) => o.value === v));
    return valid.length ? valid : undefined;
  }
  if (typeof raw !== "string") return undefined;
  if (field.type === "radio") return field.options.some((o) => o.value === raw) ? raw : undefined;
  return raw;
}

/** Devuelve solo los valores que corresponden a campos del schema y a su tipo. */
export function coerceImportedValues(schema: FormSchema, raw: unknown): FormValues {
  const values: FormValues = {};
  if (typeof raw !== "object" || raw === null) return values;
  const input = raw as Record<string, unknown>;

  for (const section of schema.sections) {
    for (const field of section.fields) {
      const incoming = input[field.id];
      if (incoming === undefined) continue;

      if (field.type === "repeatableGroup") {
        if (!Array.isArray(incoming)) continue;
        const items = incoming
          .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null && !Array.isArray(item))
          .slice(0, field.maxItems)
          .map((item) => {
            const clean: Record<string, string> = {};
            for (const sub of field.fields) {
              const value = coerceSimple(sub, item[sub.id]);
              if (typeof value === "string") clean[sub.id] = value;
            }
            return clean;
          });
        if (items.length) values[field.id] = items;
        continue;
      }

      const value = coerceSimple(field, incoming);
      if (value !== undefined) values[field.id] = value;
    }
  }
  return values;
}
