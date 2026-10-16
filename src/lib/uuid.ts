export type UuidVersion = "v4" | "v7";

function randomBytes(n: number): Uint8Array {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

function toUuidString(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function uuidV4(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return toUuidString(b);
}

export function uuidV7(now = Date.now()): string {
  const b = randomBytes(16);
  const ts = BigInt(now);
  for (let i = 0; i < 6; i++) {
    b[i] = Number((ts >> BigInt(8 * (5 - i))) & 0xffn);
  }
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  return toUuidString(b);
}

export interface UuidOptions {
  version: UuidVersion;
  count: number;
  upper?: boolean;
  noHyphens?: boolean;
  braces?: boolean;
}

export function generateUuids(opts: UuidOptions): string[] {
  const n = Math.max(1, Math.min(1000, Math.floor(opts.count)));
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    let u = opts.version === "v7" ? uuidV7() : uuidV4();
    if (opts.noHyphens) u = u.replace(/-/g, "");
    if (opts.upper) u = u.toUpperCase();
    if (opts.braces) u = `{${u}}`;
    out.push(u);
  }
  return out;
}
