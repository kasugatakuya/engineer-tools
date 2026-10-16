const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

export function utf8Encode(s: string): Uint8Array {
  return encoder.encode(s);
}

export function utf8Decode(bytes: Uint8Array): string {
  return decoder.decode(bytes);
}

export function bytesToBase64(bytes: Uint8Array, urlSafe = false): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const b64 = btoa(bin);
  if (!urlSafe) return b64;
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64ToBytes(input: string): Uint8Array {
  let s = input.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) {
    throw new Error("Base64として扱えない文字が含まれています。");
  }
  s = s.replace(/=+$/, "");
  if (s.length % 4 === 1) {
    throw new Error("Base64の長さが不正です（4文字単位に揃いません）。");
  }
  while (s.length % 4 !== 0) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function base64Encode(text: string, urlSafe = false): string {
  return bytesToBase64(utf8Encode(text), urlSafe);
}

export function base64Decode(text: string): string {
  const bytes = base64ToBytes(text);
  try {
    return utf8Decode(bytes);
  } catch {
    throw new Error("デコード結果がUTF-8のテキストではありません（バイナリデータの可能性があります）。");
  }
}

export type UrlMode = "component" | "uri" | "form";

export function urlEncode(text: string, mode: UrlMode): string {
  switch (mode) {
    case "uri":
      return encodeURI(text);
    case "form":
      return encodeURIComponent(text)
        .replace(/%20/g, "+")
        .replace(/[!'()~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
    default:
      return encodeURIComponent(text);
  }
}

export function urlDecode(text: string, mode: UrlMode): string {
  const s = mode === "form" ? text.replace(/\+/g, " ") : text;
  try {
    return decodeURIComponent(s);
  } catch {
    throw new Error("パーセントエンコードの形式が不正です（% の後に16進数2桁が必要です）。");
  }
}

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function htmlEscape(text: string, nonAsciiToNumeric = false): string {
  let out = text.replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
  if (nonAsciiToNumeric) {
    out = out.replace(/[^\x00-\x7F]/gu, (c) => `&#x${(c.codePointAt(0) as number).toString(16).toUpperCase()};`);
  }
  return out;
}

export const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  copy: "©", reg: "®", trade: "™", hellip: "…", mdash: "—", ndash: "–",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", laquo: "«", raquo: "»",
  bull: "•", middot: "·", deg: "°", plusmn: "±", times: "×", divide: "÷",
  euro: "€", pound: "£", yen: "¥", cent: "¢", sect: "§", para: "¶",
  iexcl: "¡", iquest: "¿", frac12: "½", frac14: "¼", frac34: "¾",
  larr: "←", rarr: "→", uarr: "↑", darr: "↓", harr: "↔",
  hearts: "♥", spades: "♠", clubs: "♣", diams: "♦",
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", pi: "π", sigma: "σ", omega: "ω",
  infin: "∞", ne: "≠", le: "≤", ge: "≥", sum: "∑", radic: "√", micro: "µ",
  ensp: " ", emsp: " ", thinsp: " ", zwnj: "‌", zwj: "‍",
  shy: "­", tilde: "˜", circ: "ˆ", prime: "′", Prime: "″", dagger: "†", Dagger: "‡",
  permil: "‰", lsaquo: "‹", rsaquo: "›", oline: "‾", frasl: "⁄", check: "✓", star: "☆",
};

export function htmlUnescape(
  text: string,
  resolveName?: (name: string) => string | undefined,
): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[A-Za-z][A-Za-z0-9]*);/g, (whole, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (Number.isNaN(code) || code > 0x10ffff) return whole;
      try {
        return String.fromCodePoint(code);
      } catch {
        return whole;
      }
    }
    const named = NAMED_ENTITIES[body] ?? resolveName?.(body);
    return named ?? whole;
  });
}

export function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0");
  return s;
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, "").replace(/^0x/i, "");
  if (clean.length % 2 !== 0 || /[^0-9a-fA-F]/.test(clean)) {
    throw new Error("16進数の形式が不正です。");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function base64UrlDecodeToString(s: string): string {
  return base64Decode(s);
}
