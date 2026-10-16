"use client";

import { useEffect, useState } from "react";
import { utf8Encode } from "@/lib/encoding";
import { HASH_ALGOS, decodeKey, formatDigest, hmac, type HashAlgo, type KeyEncoding } from "@/lib/hash";
import { Card, CopyButton, ErrorBox, Input, Note, Segmented, Select, TextArea, Toggle } from "@/components/ui";

type Results = Partial<Record<HashAlgo, { hex: string; base64: string }>>;

export function HmacTool() {
  const [message, setMessage] = useState("The quick brown fox jumps over the lazy dog");
  const [key, setKey] = useState("key");
  const [keyEnc, setKeyEnc] = useState<KeyEncoding>("utf8");
  const [upper, setUpper] = useState(false);
  const [format, setFormat] = useState<"hex" | "base64">("hex");
  const [results, setResults] = useState<Results>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const k = decodeKey(key, keyEnc);
        const data = utf8Encode(message);
        const out: Results = {};
        for (const algo of HASH_ALGOS) {
          out[algo] = formatDigest(await hmac(algo, k, data), false);
        }
        if (!cancelled) {
          setResults(out);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setResults({});
          setError(e instanceof Error ? e.message : "キーを読み取れません。");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [message, key, keyEnc]);

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <TextArea label="メッセージ (UTF-8)" value={message} onChange={setMessage} rows={5} placeholder="署名するメッセージ" />
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input label="秘密鍵" value={key} onChange={setKey} placeholder="secret" />
          <div className="flex flex-col">
            <span className="mb-1.5 text-sm font-bold">鍵の形式</span>
            <Select
              value={keyEnc}
              onChange={setKeyEnc}
              options={[
                { value: "utf8", label: "テキスト (UTF-8)" },
                { value: "hex", label: "16進数" },
                { value: "base64", label: "Base64" },
              ]}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={format}
            onChange={setFormat}
            options={[
              { value: "hex", label: "16進数" },
              { value: "base64", label: "Base64" },
            ]}
          />
          {format === "hex" && (
            <Toggle checked={upper} onChange={setUpper}>
              大文字で表示
            </Toggle>
          )}
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
      </Card>

      <Card className="space-y-2">
        {HASH_ALGOS.map((algo) => {
          const r = results[algo];
          const value = r ? (format === "hex" ? (upper ? r.hex.toUpperCase() : r.hex) : r.base64) : "";
          return (
            <div key={algo} className="flex flex-col gap-1 rounded-xl border-2 border-line px-3 py-2 sm:flex-row sm:items-center sm:gap-3">
              <span className="w-28 shrink-0 text-xs font-bold text-muted">HMAC-{algo}</span>
              <span className="mono min-w-0 flex-1 break-all text-sm">{value || "—"}</span>
              <CopyButton text={value} />
            </div>
          );
        })}
        <Note>Webhookの署名検証やAPIリクエストの署名などに使う値です。秘密鍵はブラウザの外には送信されません。</Note>
      </Card>
    </div>
  );
}
