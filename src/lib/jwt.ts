import { base64ToBytes, utf8Decode } from "./encoding";

export interface JwtDecoded {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  headerRaw: string;
  payloadRaw: string;
}

function decodePart(part: string, label: string): Record<string, unknown> {
  let text: string;
  try {
    text = utf8Decode(base64ToBytes(part));
  } catch {
    throw new Error(`${label}をBase64URLとしてデコードできません。`);
  }
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error();
    }
    return value as Record<string, unknown>;
  } catch {
    throw new Error(`${label}がJSONオブジェクトではありません。`);
  }
}

export function decodeJwt(token: string): JwtDecoded {
  const trimmed = token.trim().replace(/^Bearer\s+/i, "");
  if (!trimmed) throw new Error("トークンを入力してください。");
  const parts = trimmed.split(".");
  if (parts.length !== 3 && parts.length !== 2) {
    throw new Error(`JWTは「ヘッダー.ペイロード.署名」の3つの部分で構成されます（現在 ${parts.length} 個）。`);
  }
  const header = decodePart(parts[0], "ヘッダー");
  const payload = decodePart(parts[1], "ペイロード");
  return {
    header,
    payload,
    signature: parts[2] ?? "",
    headerRaw: parts[0],
    payloadRaw: parts[1],
  };
}

export type ExpStatus = "valid" | "expired" | "not-yet" | "none";

export function jwtStatus(payload: Record<string, unknown>, nowSec = Date.now() / 1000): ExpStatus {
  const exp = typeof payload.exp === "number" ? payload.exp : undefined;
  const nbf = typeof payload.nbf === "number" ? payload.nbf : undefined;
  if (nbf != null && nowSec < nbf) return "not-yet";
  if (exp == null) return "none";
  return nowSec >= exp ? "expired" : "valid";
}
