import type { ResolutionItem } from "@/context/SearchContext";

export interface TextSection {
  label: string;
  text: string;
}

export function parseResolutionText(texto: string): TextSection[] {
  const markers = [
    { key: "RESULTANDO", label: "Resultando" },
    { key: "CONSIDERANDO", label: "Considerando" },
    { key: "POR TANTO", label: "Por tanto" },
    { key: "POR LO TANTO", label: "Por tanto" },
  ];

  const found: { label: string; index: number }[] = [];
  for (const m of markers) {
    const idx = texto.indexOf(m.key);
    if (idx !== -1) found.push({ label: m.label, index: idx });
  }
  found.sort((a, b) => a.index - b.index);

  if (found.length === 0) {
    return [{ label: "Texto", text: texto.trim() }];
  }

  const sections: TextSection[] = [];
  const header = texto.slice(0, found[0].index).trim();
  if (header) sections.push({ label: "Encabezado", text: header });

  for (let i = 0; i < found.length; i++) {
    const end = i + 1 < found.length ? found[i + 1].index : texto.length;
    const text = texto.slice(found[i].index, end).trim();
    sections.push({ label: found[i].label, text });
  }

  return sections;
}

export function splitIntoParagraphs(text: string): string[] {
  const sentences = text.split(/(?<=\.)\s+/);
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    out.push(sentences.slice(i, i + 3).join(" "));
  }
  return out;
}

export function formatCitaCR(item: ResolutionItem): string {
  const parts: string[] = ["Agencia de Protección de Datos de los Habitantes (PRODHAB)"];
  if (item.metadatos?.resolucion) parts.push(`Resolución N.° ${item.metadatos.resolucion}`);
  if (item.metadatos?.expediente) parts.push(`Expediente ${item.metadatos.expediente}`);
  if (item.metadatos?.fecha) {
    const d = new Date(item.metadatos.fecha + "T00:00:00");
    const hora = item.metadatos.hora ?? null;
    const fechaLarga = d.toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" });
    parts.push(hora ? `de las ${hora} horas del ${fechaLarga}` : fechaLarga);
  }
  if (item.metadatos?.lugar) parts.push(`${item.metadatos.lugar}, Costa Rica`);
  return parts.join(", ") + ".";
}

export function fmtFecha(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
}
