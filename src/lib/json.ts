export type JsonIndent = 2 | 4 | "tab";

export interface JsonError {
  message: string;
  line?: number;
  column?: number;
  hint?: string;
}

export function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort((a, b) => a.localeCompare(b))) {
      out[key] = sortKeysDeep(obj[key]);
    }
    return out;
  }
  return value;
}

function positionToLineCol(text: string, pos: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  for (let i = 0; i < pos && i < text.length; i++) {
    if (text[i] === "\n") {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return { line, column };
}

function hintFor(text: string, pos: number | undefined): string | undefined {
  const around = pos != null ? text.slice(Math.max(0, pos - 30), pos + 30) : text;
  if (/,\s*[}\]]/.test(around)) return "末尾のカンマ（, の直後に } や ]）はJSONでは使えません。";
  if (/'[^']*'\s*:/.test(around) || /:\s*'[^']*'/.test(around)) return "文字列はシングルクォート ' ではなくダブルクォート \" で囲んでください。";
  if (/[{,]\s*[A-Za-z_][A-Za-z0-9_]*\s*:/.test(around)) return "キーはダブルクォートで囲む必要があります。";
  if (/\/\/|\/\*/.test(around)) return "JSONにはコメントを書けません。";
  if (/\bundefined\b|\bNaN\b|\bInfinity\b/.test(around)) return "undefined / NaN / Infinity はJSONでは表現できません。";
  if (text.trim() === "") return "入力が空です。";
  return undefined;
}

export function parseJson(text: string): { ok: true; value: unknown } | { ok: false; error: JsonError } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    let pos: number | undefined;
    const m = /position (\d+)/.exec(message);
    if (m) pos = Number(m[1]);
    else if (/end of JSON input/i.test(message)) pos = text.length;
    const lc = /\(line (\d+) column (\d+)\)/.exec(message);
    const error: JsonError = { message };
    if (lc) {
      error.line = Number(lc[1]);
      error.column = Number(lc[2]);
    } else if (pos != null) {
      const { line, column } = positionToLineCol(text, pos);
      error.line = line;
      error.column = column;
    }
    error.hint = hintFor(text, pos);
    return { ok: false, error };
  }
}

export function formatJson(value: unknown, indent: JsonIndent, sortKeys: boolean): string {
  const v = sortKeys ? sortKeysDeep(value) : value;
  return JSON.stringify(v, null, indent === "tab" ? "\t" : indent);
}

export function minifyJson(value: unknown, sortKeys: boolean): string {
  const v = sortKeys ? sortKeysDeep(value) : value;
  return JSON.stringify(v);
}
