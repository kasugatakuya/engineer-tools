export type Delimiter = "," | "\t" | ";" | "|";

export interface CsvOptions {
  delimiter: Delimiter | "auto";
  header: boolean;
  trim: boolean;
  convertTypes: boolean;
  emptyAsNull: boolean;
}

export function detectDelimiter(text: string): Delimiter {
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const candidates: Delimiter[] = [",", "\t", ";", "|"];
  let best: Delimiter = ",";
  let bestCount = -1;
  for (const d of candidates) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }
  return best;
}

/** RFC 4180 style parser supporting quoted fields with embedded delimiters, quotes and newlines. */
export function parseCsv(text: string, delimiter: Delimiter): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === delimiter) {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r" || c === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      if (c === "\r" && text[i + 1] === "\n") i++;
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // drop fully empty trailing rows
  while (rows.length > 0 && rows[rows.length - 1].every((f) => f === "")) rows.pop();
  return rows;
}

function convertValue(raw: string, opts: CsvOptions): unknown {
  const v = opts.trim ? raw.trim() : raw;
  if (opts.emptyAsNull && v === "") return null;
  if (!opts.convertTypes) return v;
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null") return null;
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(v)) {
    const num = Number(v);
    if (Number.isSafeInteger(num) || !Number.isInteger(num)) return num;
  }
  return v;
}

export function csvToJson(text: string, opts: CsvOptions): { data: unknown[]; columns: string[]; rowCount: number } {
  const delimiter = opts.delimiter === "auto" ? detectDelimiter(text) : opts.delimiter;
  const rows = parseCsv(text, delimiter);
  if (rows.length === 0) return { data: [], columns: [], rowCount: 0 };
  if (!opts.header) {
    const data = rows.map((r) => r.map((c) => convertValue(c, opts)));
    return { data, columns: [], rowCount: rows.length };
  }
  const columns = rows[0].map((h, i) => {
    const name = opts.trim ? h.trim() : h;
    return name === "" ? `column${i + 1}` : name;
  });
  const data = rows.slice(1).map((r) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = convertValue(r[i] ?? "", opts);
    });
    return obj;
  });
  return { data, columns, rowCount: data.length };
}

function escapeField(value: unknown, delimiter: string): string {
  let s: string;
  if (value == null) s = "";
  else if (typeof value === "object") s = JSON.stringify(value);
  else s = String(value);
  if (s.includes('"') || s.includes(delimiter) || /[\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function jsonToCsv(value: unknown, delimiter: Delimiter, header = true): string {
  let rows: unknown[];
  if (Array.isArray(value)) rows = value;
  else if (value && typeof value === "object") rows = [value];
  else throw new Error("配列、または配列を含むオブジェクトを指定してください。");
  if (rows.length === 0) return "";
  if (rows.every((r) => Array.isArray(r))) {
    return (rows as unknown[][]).map((r) => r.map((c) => escapeField(c, delimiter)).join(delimiter)).join("\n");
  }
  if (!rows.every((r) => r && typeof r === "object" && !Array.isArray(r))) {
    throw new Error("配列の要素はオブジェクト（または配列）で揃えてください。");
  }
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const r of rows as Record<string, unknown>[]) {
    for (const k of Object.keys(r)) {
      if (!seen.has(k)) {
        seen.add(k);
        columns.push(k);
      }
    }
  }
  const lines: string[] = [];
  if (header) lines.push(columns.map((c) => escapeField(c, delimiter)).join(delimiter));
  for (const r of rows as Record<string, unknown>[]) {
    lines.push(columns.map((c) => escapeField(r[c], delimiter)).join(delimiter));
  }
  return lines.join("\n");
}
