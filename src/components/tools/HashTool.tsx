"use client";

import { useEffect, useMemo, useState } from "react";
import { utf8Encode } from "@/lib/encoding";
import { HASH_ALGOS, digest, formatDigest, type HashAlgo } from "@/lib/hash";
import { Button, Card, CopyButton, Note, Segmented, TextArea, Toggle, formatBytes } from "@/components/ui";

type Results = Partial<Record<HashAlgo, { hex: string; base64: string }>>;

export function HashTool() {
  const [text, setText] = useState("hello world");
  const [file, setFile] = useState<File | null>(null);
  const [upper, setUpper] = useState(false);
  const [format, setFormat] = useState<"hex" | "base64">("hex");
  const [results, setResults] = useState<Results>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bytesLabel = useMemo(() => {
    if (file) return `${file.name} (${formatBytes(file.size)})`;
    return `${formatBytes(utf8Encode(text).length)}のテキスト`;
  }, [file, text]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError(null);
      try {
        const data = file ? new Uint8Array(await file.arrayBuffer()) : utf8Encode(text);
        const out: Results = {};
        for (const algo of HASH_ALGOS) {
          const d = await digest(algo, data);
          out[algo] = formatDigest(d, false);
          if (cancelled) return;
        }
        if (!cancelled) setResults(out);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [text, file]);

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <TextArea
          label="テキスト (UTF-8)"
          value={text}
          onChange={(v) => {
            setText(v);
            setFile(null);
          }}
          rows={5}
          placeholder="ハッシュ化するテキスト"
          disabled={!!file}
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-line-strong px-3 py-1.5 text-sm font-bold hover:border-brand hover:bg-brand/5">
            📁 ファイルを選ぶ
            <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {file && (
            <Button size="sm" variant="ghost" onClick={() => setFile(null)}>
              ✕ ファイルを外す
            </Button>
          )}
          <span className="text-xs text-muted">{bytesLabel}</span>
          <span className="ml-auto flex flex-wrap items-center gap-2">
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
          </span>
        </div>
        {error && <p className="text-sm text-pop-red">{error}</p>}
      </Card>

      <Card className="space-y-2">
        {HASH_ALGOS.map((algo) => {
          const r = results[algo];
          const value = r ? (format === "hex" ? (upper ? r.hex.toUpperCase() : r.hex) : r.base64) : "";
          return (
            <div key={algo} className="flex flex-col gap-1 rounded-xl border-2 border-line px-3 py-2 sm:flex-row sm:items-center sm:gap-3">
              <span className="w-24 shrink-0 text-xs font-bold text-muted">
                {algo}
                {algo === "MD5" || algo === "SHA-1" ? <span className="ml-1 text-pop-orange" title="暗号用途には非推奨">△</span> : null}
              </span>
              <span className="mono min-w-0 flex-1 break-all text-sm">{busy && !value ? "計算中…" : value || "—"}</span>
              <CopyButton text={value} />
            </div>
          );
        })}
        <Note>△ MD5 と SHA-1 は衝突攻撃が知られており、パスワードや署名などの暗号用途には使わないでください（チェックサム用途は可）。ファイルも端末の外には出ません。</Note>
      </Card>
    </div>
  );
}
