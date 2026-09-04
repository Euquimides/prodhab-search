import type { FormSchema, FormValues } from "@/schemas/form-schema.types";
import { buildDocLines } from "./formDocumentModel";
import { downloadBlob } from "./downloadBlob";

// ponytail: el modelo de líneas ya existe para DOCX y PDF; aquí solo se
// decide el prefijo Markdown de cada tipo de línea. Sin dependencias.

/** Los valores de textarea traen saltos de línea que romperían el bullet. */
function inline(value: string): string {
  return value.replace(/\s*\n\s*/g, " ");
}

export function buildMarkdown(schema: FormSchema, values: FormValues): string {
  const out = buildDocLines(schema, values).map((line) => {
    switch (line.kind) {
      case "title":
        return `# ${line.text}`;
      case "subtitle":
      case "description":
        return `_${inline(line.text)}_`;
      case "heading":
        return `## ${line.text}`;
      case "groupTitle":
        return `### ${line.text}`;
      case "field":
        return `- **${line.label}:** ${inline(line.value)}`;
    }
  });
  return out.join("\n\n") + "\n";
}

/** Genera el .md y dispara la descarga en el navegador. Solo client-side. */
export function downloadMarkdown(schema: FormSchema, values: FormValues, filename = `${schema.id}.md`) {
  const blob = new Blob([buildMarkdown(schema, values)], { type: "text/markdown;charset=utf-8" });
  downloadBlob(blob, filename);
}
