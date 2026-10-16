export type Unit = "auto" | "s" | "ms";

export interface ParsedTimestamp {
  ms: number;
  unit: "s" | "ms";
  detected: boolean;
}

export function parseTimestamp(input: string, unit: Unit): ParsedTimestamp | null {
  const s = input.trim().replace(/[,_\s]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  let u: "s" | "ms";
  if (unit === "auto") {
    // 1e11 seconds = year 5138; anything bigger is treated as milliseconds
    u = Math.abs(n) >= 1e11 ? "ms" : "s";
  } else {
    u = unit;
  }
  const ms = u === "s" ? n * 1000 : n;
  if (Math.abs(ms) > 8.64e15) return null;
  return { ms: Math.round(ms), unit: u, detected: unit === "auto" };
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/** Offset (ms) of a timezone at a given instant. */
export function tzOffsetMs(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, number> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== "literal") parts[p.type] = Number(p.value);
  }
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

export function formatInZone(ms: number, timeZone: string, withMs = false): string {
  const date = new Date(ms);
  const off = tzOffsetMs(timeZone, date);
  const d = new Date(ms + off);
  const base = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  return withMs ? `${base}.${pad(d.getUTCMilliseconds(), 3)}` : base;
}

export function formatOffset(offsetMs: number): string {
  const sign = offsetMs >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMs) / 60000;
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

export interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  ms?: number;
}

/** Convert wall-clock parts in a timezone to epoch ms (DST aware). */
export function zonedPartsToMs(p: LocalParts, timeZone: string): number {
  const guess = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second, p.ms ?? 0);
  let off = tzOffsetMs(timeZone, new Date(guess));
  let result = guess - off;
  const off2 = tzOffsetMs(timeZone, new Date(result));
  if (off2 !== off) {
    off = off2;
    result = guess - off;
  }
  return result;
}

export function parseDateTimeInput(text: string): LocalParts | null {
  const m = /^\s*(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?\s*$/.exec(text);
  if (!m) return null;
  return {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
    hour: Number(m[4] ?? 0),
    minute: Number(m[5] ?? 0),
    second: Number(m[6] ?? 0),
    ms: m[7] ? Number(m[7].padEnd(3, "0")) : 0,
  };
}

export function relativeTime(targetMs: number, nowMs = Date.now()): string {
  const diff = targetMs - nowMs;
  const abs = Math.abs(diff);
  const suffix = diff < 0 ? "前" : "後";
  if (abs < 5_000) return "たった今";
  if (abs < 60_000) return `${Math.round(abs / 1000)}秒${suffix}`;
  if (abs < 3_600_000) return `${Math.round(abs / 60_000)}分${suffix}`;
  if (abs < 86_400_000) return `${Math.round(abs / 3_600_000)}時間${suffix}`;
  if (abs < 30 * 86_400_000) return `${Math.round(abs / 86_400_000)}日${suffix}`;
  if (abs < 365 * 86_400_000) return `${Math.round(abs / (30 * 86_400_000))}か月${suffix}`;
  return `${(abs / (365.25 * 86_400_000)).toFixed(1).replace(/\.0$/, "")}年${suffix}`;
}

export const TIMEZONES: { id: string; label: string }[] = [
  { id: "Asia/Tokyo", label: "日本標準時 (JST, UTC+9)" },
  { id: "UTC", label: "UTC" },
  { id: "America/Los_Angeles", label: "ロサンゼルス (PST/PDT)" },
  { id: "America/New_York", label: "ニューヨーク (EST/EDT)" },
  { id: "Europe/London", label: "ロンドン (GMT/BST)" },
  { id: "Europe/Berlin", label: "ベルリン (CET/CEST)" },
  { id: "Asia/Singapore", label: "シンガポール (SGT)" },
  { id: "Asia/Shanghai", label: "上海 (CST)" },
  { id: "Asia/Seoul", label: "ソウル (KST)" },
  { id: "Asia/Kolkata", label: "インド (IST)" },
  { id: "Australia/Sydney", label: "シドニー (AEST/AEDT)" },
];
