import { describe, expect, it } from "vitest";
import { utf8Encode } from "../encoding";
import { digest, formatDigest, hmac, md5 } from "../hash";
import { decodeJwt, jwtStatus } from "../jwt";
import { formatInZone, parseDateTimeInput, parseTimestamp, relativeTime, zonedPartsToMs } from "../time";
import { generateUuids } from "../uuid";
import { buildRegex, runRegex } from "../regex";
import { contrastRatio, parseColor, toHex, toHslString, toRgbString } from "../color";

const hex = (b: Uint8Array) => formatDigest(b, false).hex;
const fox = utf8Encode("The quick brown fox jumps over the lazy dog");

describe("hash", () => {
  it("md5 matches RFC vectors", () => {
    expect(hex(md5(utf8Encode("")))).toBe("d41d8cd98f00b204e9800998ecf8427e");
    expect(hex(md5(fox))).toBe("9e107d9d372bb6826bd81d3542a419d6");
    expect(hex(md5(utf8Encode("a".repeat(1000))))).toBe("cabe45dcc9ae5b66ba86600cca6b8ba8");
  });
  it("sha via WebCrypto", async () => {
    expect(hex(await digest("SHA-256", utf8Encode("hello world")))).toBe("b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
    expect(hex(await digest("SHA-1", utf8Encode("hello world")))).toBe("2aae6c35c94fcfb415dbe95f408b9ce91ee846ed");
  });
  it("hmac for md5 / sha-1 / sha-256", async () => {
    const key = utf8Encode("key");
    expect(hex(await hmac("MD5", key, fox))).toBe("80070713463e7749b90c2dc24911e275");
    expect(hex(await hmac("SHA-1", key, fox))).toBe("de7c9b85b8b78aa6bc8a7a36f70a90701c9db4d9");
    expect(hex(await hmac("SHA-256", key, fox))).toBe("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8");
    expect(hex(await hmac("MD5", utf8Encode(""), utf8Encode("")))).toBe("74e6f7298a9c2d168935f58c001bad88");
    expect(hex(await hmac("SHA-256", utf8Encode(""), utf8Encode("")))).toBe("b613679a0814d9ec772f95d778c35fc5ff1697c493715653c6c712144292c5ad");
  });
});

describe("jwt", () => {
  const tok = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEwMjQiLCJuYW1lIjoiU2FtcGxlIFVzZXIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3OTIxMTAyNjUsImV4cCI6MTc5MjcxODY2NX0.c2FtcGxlLXNpZ25hdHVyZS1ub3QtdmVyaWZpZWQ";
  it("decodes header and payload", () => {
    const j = decodeJwt(`Bearer ${tok}`);
    expect(j.header.alg).toBe("HS256");
    expect(j.payload.sub).toBe("user-1024");
    expect(jwtStatus(j.payload, 1792110265 + 10)).toBe("valid");
    expect(jwtStatus(j.payload, 1792718665 + 10)).toBe("expired");
  });
  it("rejects malformed tokens", () => {
    expect(() => decodeJwt("abc")).toThrow();
    expect(() => decodeJwt("a.b.c")).toThrow();
  });
});

describe("time", () => {
  it("detects unit and formats zones", () => {
    expect(parseTimestamp("1792113865", "auto")).toEqual({ ms: 1792113865000, unit: "s", detected: true });
    expect(parseTimestamp("1792113865123", "auto")?.unit).toBe("ms");
    expect(parseTimestamp("abc", "auto")).toBeNull();
    expect(formatInZone(1792113865000, "Asia/Tokyo")).toBe("2026-10-16 10:24:25");
    expect(formatInZone(1792113865000, "UTC")).toBe("2026-10-16 01:24:25");
    expect(formatInZone(-1000, "UTC")).toBe("1969-12-31 23:59:59");
  });
  it("converts wall-clock in a zone to epoch, DST aware", () => {
    expect(zonedPartsToMs(parseDateTimeInput("2026-10-16 10:24:25")!, "Asia/Tokyo")).toBe(1792113865000);
    const summer = zonedPartsToMs({ year: 2026, month: 7, day: 1, hour: 12, minute: 0, second: 0 }, "America/New_York");
    const winter = zonedPartsToMs({ year: 2026, month: 1, day: 1, hour: 12, minute: 0, second: 0 }, "America/New_York");
    expect(formatInZone(summer, "America/New_York")).toBe("2026-07-01 12:00:00");
    expect(formatInZone(winter, "America/New_York")).toBe("2026-01-01 12:00:00");
    expect(formatInZone(summer, "UTC")).toBe("2026-07-01 16:00:00");
    expect(formatInZone(winter, "UTC")).toBe("2026-01-01 17:00:00");
  });
  it("formats relative time in Japanese", () => {
    expect(relativeTime(1000, 0)).toBe("たった今");
    expect(relativeTime(0, 3600_000)).toBe("1時間前");
    expect(relativeTime(7 * 86400_000, 0)).toBe("7日後");
  });
});

describe("uuid / regex / color", () => {
  it("generates valid v4 and v7", () => {
    expect(generateUuids({ version: "v4", count: 3 })).toHaveLength(3);
    expect(generateUuids({ version: "v4", count: 1 })[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(generateUuids({ version: "v7", count: 1 })[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(generateUuids({ version: "v4", count: 1, upper: true, noHyphens: true, braces: true })[0]).toMatch(/^\{[0-9A-F]{32}\}$/);
  });
  it("runs regex with groups", () => {
    const r = runRegex(buildRegex("(\\d{4})-(?<m>\\d{2})-(\\d{2})", "g"), "リリース 2026-10-16、締切 2026-11-30");
    expect(r.matches).toHaveLength(2);
    expect(r.matches[0].index).toBe(5);
    expect(r.matches[0].groups.map((g) => g.name)).toEqual(["$1", "$2", "$3", "<m>"]);
    expect(() => buildRegex("(", "")).toThrow();
  });
  it("parses and converts colors", () => {
    const c = parseColor("#ff6b9d")!;
    expect(toRgbString(c)).toBe("rgb(255, 107, 157)");
    expect(toHslString(c)).toBe("hsl(340, 100%, 71%)");
    expect(toHex(parseColor("rgb(255 107 157 / 50%)")!)).toBe("#ff6b9d80");
    expect(toHex(parseColor("#abc")!)).toBe("#aabbcc");
    expect(parseColor("nope")).toBeNull();
    expect(contrastRatio(parseColor("#000")!, parseColor("#fff")!)).toBeCloseTo(21, 1);
  });
});
