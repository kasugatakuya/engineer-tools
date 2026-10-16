export interface RegexMatch {
  index: number;
  end: number;
  text: string;
  groups: { name: string; value: string | undefined }[];
}

export interface RegexResult {
  matches: RegexMatch[];
  truncated: boolean;
}

export const MAX_MATCHES = 2000;

export function buildRegex(pattern: string, flags: string): RegExp {
  try {
    return new RegExp(pattern, flags);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(msg.replace(/^Invalid regular expression: /, "正規表現が不正です: "));
  }
}

export function runRegex(re: RegExp, text: string): RegexResult {
  const matches: RegexMatch[] = [];
  const global = re.flags.includes("g");
  const r = new RegExp(re.source, global ? re.flags : re.flags + "g");
  let truncated = false;
  for (const m of text.matchAll(r)) {
    if (matches.length >= MAX_MATCHES) {
      truncated = true;
      break;
    }
    const idx = m.index ?? 0;
    const groups: RegexMatch["groups"] = [];
    for (let i = 1; i < m.length; i++) groups.push({ name: `$${i}`, value: m[i] });
    if (m.groups) {
      for (const [name, value] of Object.entries(m.groups)) groups.push({ name: `<${name}>`, value });
    }
    matches.push({ index: idx, end: idx + m[0].length, text: m[0], groups });
    if (!global) break;
  }
  return { matches, truncated };
}

export function replaceWith(re: RegExp, text: string, replacement: string): string {
  return text.replace(re, replacement);
}
