import { bytesToBase64, bytesToHex, hexToBytes, utf8Encode } from "./encoding";

export type HashAlgo = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
export const HASH_ALGOS: HashAlgo[] = ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"];

/* ---------- MD5 (RFC 1321) ---------- */
const K = new Uint32Array(64);
for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0;
const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

export function md5(input: Uint8Array): Uint8Array {
  const len = input.length;
  const bitLen = len * 8;
  const padded = new Uint8Array(((len + 8) >> 6 << 6) + 64);
  padded.set(input);
  padded[len] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, bitLen >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor(bitLen / 2 ** 32), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  const M = new Uint32Array(16);
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) M[i] = view.getUint32(off + i * 4, true);
    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) >>> 0;
    }
    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }
  const out = new Uint8Array(16);
  const ov = new DataView(out.buffer);
  ov.setUint32(0, a0, true);
  ov.setUint32(4, b0, true);
  ov.setUint32(8, c0, true);
  ov.setUint32(12, d0, true);
  return out;
}

export async function digest(algo: HashAlgo, data: Uint8Array): Promise<Uint8Array> {
  if (algo === "MD5") return md5(data);
  const buf = await crypto.subtle.digest(algo, data as BufferSource);
  return new Uint8Array(buf);
}

export async function hmac(algo: HashAlgo, key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  if (algo === "MD5") {
    const blockSize = 64;
    let k = key;
    if (k.length > blockSize) k = md5(k);
    const kp = new Uint8Array(blockSize);
    kp.set(k);
    const ipad = new Uint8Array(blockSize + data.length);
    const opad = new Uint8Array(blockSize + 16);
    for (let i = 0; i < blockSize; i++) {
      ipad[i] = kp[i] ^ 0x36;
      opad[i] = kp[i] ^ 0x5c;
    }
    ipad.set(data, blockSize);
    opad.set(md5(ipad), blockSize);
    return md5(opad);
  }
  // WebCrypto rejects empty keys for HMAC in some browsers; pad with a zero block equivalent (empty key == zero-padded key)
  const rawKey = key.length === 0 ? new Uint8Array(1) : key;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey as BufferSource,
    { name: "HMAC", hash: algo },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, data as BufferSource);
  return new Uint8Array(sig);
}

export type KeyEncoding = "utf8" | "hex" | "base64";

export function decodeKey(key: string, enc: KeyEncoding): Uint8Array {
  if (enc === "hex") return hexToBytes(key);
  if (enc === "base64") {
    const bin = atob(key.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  }
  return utf8Encode(key);
}

export function formatDigest(bytes: Uint8Array, upper: boolean): { hex: string; base64: string } {
  const hex = bytesToHex(bytes);
  return { hex: upper ? hex.toUpperCase() : hex, base64: bytesToBase64(bytes) };
}
