import React from "react";

type MatchType = "query" | "descriptor";

interface Range {
  start: number;
  end: number;
  type: MatchType;
}

function findRanges(text: string, pattern: RegExp, type: MatchType): Range[] {
  const ranges: Range[] = [];
  const g = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
  let match: RegExpExecArray | null;
  while ((match = g.exec(text)) !== null) {
    if (match[0].length === 0) { g.lastIndex++; continue; }
    ranges.push({ start: match.index, end: match.index + match[0].length, type });
  }
  return ranges;
}

function mergeRanges(ranges: Range[]): Range[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: Range[] = [];
  let cur = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    if (next.start <= cur.end) {
      cur.end = Math.max(cur.end, next.end);
      // consulta toma prioridad sobre descriptor, pero no lo sobrescribe si ya es query
      if (cur.type !== "query") cur.type = next.type;
    } else {
      merged.push(cur);
      cur = { ...next };
    }
  }
  merged.push(cur);
  return merged;
}

const CLASS: Record<MatchType, string> = {
  query:      "bg-amber-200 text-amber-900 dark:bg-amber-700/60 dark:text-amber-100 rounded-sm px-0.5",
  descriptor: "bg-indigo-200 text-indigo-900 dark:bg-indigo-700/60 dark:text-indigo-100 rounded-sm px-0.5",
};

export function buildQueryPatterns(query: string): RegExp[] {
  return query
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"));
}

export function highlightText(
  text: string,
  queryPatterns: RegExp[],
  descriptorPatterns: RegExp[],
): React.ReactNode {
  const ranges: Range[] = [];
  for (const p of queryPatterns)    ranges.push(...findRanges(text, p, "query"));
  for (const p of descriptorPatterns) ranges.push(...findRanges(text, p, "descriptor"));
  if (ranges.length === 0) return text;

  const merged = mergeRanges(ranges);
  const nodes: React.ReactNode[] = [];
  let last = 0;

  for (const r of merged) {
    if (r.start > last) nodes.push(text.slice(last, r.start));
    nodes.push(
      <mark key={r.start} className={CLASS[r.type]}>
        {text.slice(r.start, r.end)}
      </mark>,
    );
    last = r.end;
  }
  if (last < text.length) nodes.push(text.slice(last));

  return <>{nodes}</>;
}
