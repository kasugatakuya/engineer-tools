"use client";

import { useMemo, useState } from "react";
import { useNow } from "@/components/hooks";
import { decodeJwt, jwtStatus } from "@/lib/jwt";
import { formatInZone, relativeTime } from "@/lib/time";
import { Badge, Button, Card, CopyButton, ErrorBox, Note, Output, Row, TextArea, cx } from "@/components/ui";

const EXAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEwMjQiLCJuYW1lIjoiU2FtcGxlIFVzZXIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3OTIxMTAyNjUsImV4cCI6MTc5MjcxODY2NX0.c2FtcGxlLXNpZ25hdHVyZS1ub3QtdmVyaWZpZWQ";

const TIME_CLAIMS: Record<string, string> = { iat: "発行", exp: "有効期限", nbf: "有効開始", auth_time: "認証時刻" };
const KNOWN_CLAIMS = ["iss", "sub", "aud", "jti", "iat", "nbf", "exp", "auth_time"];

export function JwtTool() {
  const [token, setToken] = useState(EXAMPLE);
  const now = useNow(30_000);

  const result = useMemo(() => {
    if (token.trim() === "") return null;
    try {
      return { ok: true as const, value: decodeJwt(token) };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
    }
  }, [token]);

  const status = result?.ok && now != null ? jwtStatus(result.value.payload, now / 1000) : null;

  return (
    <div className="space-y-4">
      <Card>
        <TextArea
          label="トークン"
          value={token}
          onChange={setToken}
          rows={5}
          placeholder="eyJhbGciOi..."
          actions={
            <Button size="sm" variant="ghost" onClick={() => setToken("")}>
              クリア
            </Button>
          }
        />
        {result && !result.ok && (
          <div className="mt-3">
            <ErrorBox>{result.error}</ErrorBox>
          </div>
        )}
        {result?.ok && (
          <Row className="mt-3">
            <Badge>alg: {String(result.value.header.alg ?? "?")}</Badge>
            {result.value.header.typ != null && <Badge>typ: {String(result.value.header.typ)}</Badge>}
            {status === "valid" && <Badge tone="ok">有効</Badge>}
            {status === "expired" && <Badge tone="bad">期限切れ</Badge>}
            {status === "not-yet" && <Badge tone="warn">まだ有効ではありません (nbf)</Badge>}
            {status === "none" && <Badge tone="warn">exp なし（無期限）</Badge>}
            {String(result.value.header.alg).toLowerCase() === "none" && <Badge tone="bad">alg: none は署名なし</Badge>}
            {!result.value.signature && <Badge tone="warn">署名部分がありません</Badge>}
          </Row>
        )}
      </Card>

      {result?.ok && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <Output label="ヘッダー" value={JSON.stringify(result.value.header, null, 2)} rows={10} />
            </Card>
            <Card>
              <Output label="ペイロード" value={JSON.stringify(result.value.payload, null, 2)} rows={10} />
            </Card>
          </div>

          <Card>
            <h2 className="mb-3 font-display text-base font-extrabold">主なクレーム</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {KNOWN_CLAIMS.filter((k) => k in result.value.payload).map((k) => {
                const raw = result.value.payload[k];
                const isTime = k in TIME_CLAIMS && typeof raw === "number";
                let text: string;
                let sub: string | null = null;
                if (isTime) {
                  const ms = (raw as number) * 1000;
                  text = `${formatInZone(ms, "Asia/Tokyo")} JST`;
                  sub = now != null ? relativeTime(ms, now) : null;
                } else {
                  text = typeof raw === "string" ? raw : JSON.stringify(raw);
                }
                const tone = k === "exp" ? (status === "expired" ? "bad" : status === "valid" ? "ok" : "neutral") : "neutral";
                return (
                  <div key={k} className="flex items-center gap-3 rounded-xl border-2 border-line px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-muted">
                        {k}
                        {k in TIME_CLAIMS && ` (${TIME_CLAIMS[k]})`}
                      </div>
                      <div className="mono break-all text-sm">
                        {text}
                        {sub && <span className="ml-2 text-xs text-muted">({sub})</span>}
                        {k === "exp" && status && status !== "none" && (
                          <span className={cx("ml-2", tone === "bad" ? "text-pop-red" : "text-pop-green")}>
                            【{status === "expired" ? "期限切れ" : "有効"}】
                          </span>
                        )}
                      </div>
                    </div>
                    <CopyButton text={isTime ? String(raw) : text} />
                  </div>
                );
              })}
            </div>
            <div className="mt-4 break-all rounded-xl bg-surface px-3 py-2 text-xs text-muted">
              署名部分: <span className="mono text-ink">{result.value.signature || "（なし）"}</span>
            </div>
            <div className="mt-3">
              <Note>署名の検証は行いません。クレームの内容を信頼する場合は、必ずサーバー側で検証してください。</Note>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
