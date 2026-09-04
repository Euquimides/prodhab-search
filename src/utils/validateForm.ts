import type { FormField, FormSchema, FormSection, FormValues, SimpleField } from "@/schemas/form-schema.types";

// ponytail: react-hook-form + zod (propuestos en el PRD) quedan fuera de
// alcance de la Épica 0 — el schema ya declara required/maxLength/opciones,
// así que un validador que recorre ese mismo schema evita instalar dos
// dependencias nuevas para redeclarar las mismas reglas. Si el formulario
// necesita reglas más ricas (regex por campo, validación cruzada), migrar
// a zod generado desde el schema en ese punto.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FormErrors = Record<string, string>;

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function isFieldVisible(field: FormField, values: FormValues): boolean {
  const rule = field.visibleWhen;
  if (!rule) return true;
  const controllingValue = values[rule.fieldId];
  if (Array.isArray(controllingValue)) {
    return controllingValue.some((v) => typeof v === "string" && v === rule.equals);
  }
  return controllingValue === rule.equals;
}

function validateSimpleField(field: SimpleField, value: unknown): string | undefined {
  if (field.required && isEmpty(value)) return "Este campo es obligatorio.";
  if (isEmpty(value)) return undefined;

  if (field.type === "text" || field.type === "textarea") {
    if (field.maxLength && typeof value === "string" && value.length > field.maxLength) {
      return `Máximo ${field.maxLength} caracteres.`;
    }
  }
  if (field.type === "email" && typeof value === "string" && !EMAIL_RE.test(value)) {
    return "Correo electrónico inválido.";
  }
  return undefined;
}

/** Valida una sección completa (incluye items de repeatableGroup como `${field.id}.${index}.${subFieldId}`). */
export function validateSection(section: FormSection, values: FormValues): FormErrors {
  const errors: FormErrors = {};

  for (const field of section.fields) {
    if (!isFieldVisible(field, values)) continue;

    if (field.type === "repeatableGroup") {
      const items = (values[field.id] as Record<string, string>[] | undefined) ?? [];
      if (field.minItems && items.length < field.minItems) {
        errors[field.id] = `Agregue al menos ${field.minItems} elemento(s).`;
      }
      items.forEach((item, index) => {
        for (const subField of field.fields) {
          const error = validateSimpleField(subField, item[subField.id]);
          if (error) errors[`${field.id}.${index}.${subField.id}`] = error;
        }
      });
      continue;
    }

    const error = validateSimpleField(field, values[field.id]);
    if (error) errors[field.id] = error;
  }

  return errors;
}

export function validateForm(schema: FormSchema, values: FormValues): FormErrors {
  return schema.sections.reduce<FormErrors>((all, section) => {
    return { ...all, ...validateSection(section, values) };
  }, {});
}
