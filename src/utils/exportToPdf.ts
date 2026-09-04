import { PDFDocument, PDFFont, PDFPage, StandardFonts } from "pdf-lib";
import type { FormSchema, FormValues } from "@/schemas/form-schema.types";
import { buildDocLines } from "./formDocumentModel";
import { downloadBlob } from "./downloadBlob";

// ponytail: no existe PDF oficial rellenable de PRODHAB (ver PRD sección
// 10, pregunta 2), así que esto genera un PDF propio con el mismo
// contenido/orden que exportToDocx en vez de rellenar una plantilla.
// Paginación y wrap de texto manuales porque pdf-lib no los trae — es la
// parte no trivial de este archivo, cubierta por exportToPdf.test.ts.

const PAGE_WIDTH = 612; // carta (8.5in x 72pt/in)
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const LINE_HEIGHT = 14;
const MAX_WIDTH = PAGE_WIDTH - MARGIN * 2;

// ponytail: Helvetica estándar solo codifica WinAnsi; un salto de línea de
// un textarea o un símbolo fuera de ese set (₡, emoji, comillas raras) hace
// throw a pdf-lib y la exportación falla entera. Se normaliza el texto aquí
// en vez de incrustar una fuente Unicode (~300 KB al bundle); si hiciera
// falta conservar esos símbolos, ahí sí embeber una TTF con fontkit.
const WINANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

export function sanitizeForWinAnsi(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/₡/g, "CRC ")
    .split("")
    .map((ch) => {
      const code = ch.codePointAt(0)!;
      const ok = (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WINANSI_EXTRA.includes(ch);
      return ok ? ch : "?";
    })
    .join("")
    .trim();
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  // Una "palabra" más ancha que la página (una URL, un número de documento
  // pegado sin espacios) se parte por caracteres: si no, se dibujaría fuera
  // del margen derecho y el texto se perdería en el PDF.
  const words = text.split(" ").flatMap((word) => {
    if (font.widthOfTextAtSize(word, size) <= maxWidth) return [word];
    const chunks: string[] = [];
    let chunk = "";
    for (const ch of word) {
      if (chunk && font.widthOfTextAtSize(chunk + ch, size) > maxWidth) {
        chunks.push(chunk);
        chunk = "";
      }
      chunk += ch;
    }
    chunks.push(chunk);
    return chunks;
  });
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  lines.push(current);
  return lines;
}

export async function buildPdfBytes(schema: FormSchema, values: FormValues): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function newPage() {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  }

  function drawLine(text: string, useFont: PDFFont, size: number) {
    if (y - LINE_HEIGHT < MARGIN) newPage();
    page.drawText(text, { x: MARGIN, y, size, font: useFont });
    y -= LINE_HEIGHT;
  }

  function drawWrapped(rawText: string, useFont: PDFFont, size: number, gapBefore = 0) {
    if (gapBefore) y -= gapBefore;
    for (const line of wrapText(sanitizeForWinAnsi(rawText), useFont, size, MAX_WIDTH)) {
      drawLine(line, useFont, size);
    }
  }

  for (const line of buildDocLines(schema, values)) {
    switch (line.kind) {
      case "title":
        drawWrapped(line.text, boldFont, 16);
        break;
      case "subtitle":
        drawWrapped(line.text, font, 9);
        break;
      case "heading":
        drawWrapped(line.text, boldFont, 12, 10);
        break;
      case "description":
        drawWrapped(line.text, font, 10);
        break;
      case "groupTitle":
        drawWrapped(line.text, boldFont, 10, 4);
        break;
      case "field":
        drawWrapped(`${line.label}: ${line.value}`, font, 10);
        break;
    }
  }

  return pdf.save();
}

/** Genera el .pdf y dispara la descarga en el navegador. Solo client-side. */
export async function downloadPdf(schema: FormSchema, values: FormValues, filename = `${schema.id}.pdf`) {
  const bytes = await buildPdfBytes(schema, values);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  downloadBlob(blob, filename);
}
