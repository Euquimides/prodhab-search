import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { FormSchema, FormValues } from "@/schemas/form-schema.types";
import { buildDocLines } from "./formDocumentModel";
import { downloadBlob } from "./downloadBlob";

// ponytail: una sección de Word por sección del schema, texto plano de
// "label: valor" — el PRD pide "formato similar" al oficial, no un clon
// de las celdas del Excel. Si se necesita paridad visual exacta, ahí se
// justifica invertir en tablas/estilos, no antes.

export function buildDocxDocument(schema: FormSchema, values: FormValues): Document {
  const children: Paragraph[] = buildDocLines(schema, values).map((line) => {
    switch (line.kind) {
      case "title":
        return new Paragraph({ text: line.text, heading: HeadingLevel.TITLE });
      case "subtitle":
        return new Paragraph({ children: [new TextRun({ text: line.text, italics: true })] });
      case "heading":
        return new Paragraph({ text: line.text, heading: HeadingLevel.HEADING_2 });
      case "description":
        return new Paragraph({ children: [new TextRun({ text: line.text, italics: true })] });
      case "groupTitle":
        return new Paragraph({ children: [new TextRun({ text: line.text, bold: true, underline: {} })] });
      case "field":
        return new Paragraph({
          children: [
            new TextRun({ text: `${line.label}: `, bold: true }),
            new TextRun({ text: line.value }),
          ],
        });
    }
  });

  return new Document({ sections: [{ children }] });
}

/** Genera el .docx y dispara la descarga en el navegador. Solo client-side. */
export async function downloadDocx(schema: FormSchema, values: FormValues, filename = `${schema.id}.docx`) {
  const doc = buildDocxDocument(schema, values);
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, filename);
}
