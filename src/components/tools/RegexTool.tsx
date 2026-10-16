"use client";

import { useMemo, useState } from "react";
import { MAX_MATCHES, buildRegex, runRegex } from "@/lib/regex";
import { Badge, Card, ErrorBox, Input, Note, Output, TextArea, Toggle, cx } from "@/components/ui";

const FLAGS: { flag: string; label: string }[] = [
  { flag: "g", label: "g 全件" },
  { flag: "i", label: "i 大小無視" },
  { flag: "m", label: "m 複数行" },
  { flag: "s", label: "s . が改行に一致" },
  { flag: "u", label: "u Unicode" },
];

export function RegexTool() {
  const [pattern, setPattern] = useState("(\\d{4})-(\\d{2})-(\\d{2})");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("リリース 2026-10-16、締切 2026-11-30、保守終了 2027-03-31");
  const [replacement, setReplacement] = useState("$3/$2/$1");

  const toggleFlag = (f: string, on: boolean) => {
    setFlags((prev) => {
      const set = new Set(prev.split(""));
      if (on) set.add(f);
      else set.delete(f);
      return FLAGS.map((x) => x.flag)
        .filter((x) => set.has(x))
        .join("");
    });
  };

  const result = useMemo(() => {
    if (pattern === "") return null;
    try {
      const re = buildRegex(pattern, flags);
      const r = runRegex(re, text);
      let replaced: string | null = null;
      try {
        replaced = text.replace(re, replacement);
      } catch {
        replaced = null;
      }
      return { ok: true as const, ...r, replaced };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
    }
  }, [pattern, flags, text, replacement]);

  const highlighted = useMemo(() => {
    if (!result?.ok || result.matches.length === 0) return text;
    const parts: React.ReactNode[] = [];
    let last = 0;
    result.matches.forEach((m, i) => {
      if (m.index > last) parts.push(<span key={`t${i}`}>{text.slice(last, m.index)}</span>);
      parts.push(
        <mark
          key={`m${i}`}
          className={cx("rounded px-0.5 font-bold", i % 2 === 0 ? "bg-pop-yellow/50" : "bg-pop-sky/30")}
          title={`#${i + 1} (位置 ${m.index})`}
        >
          {m.text === "" ? "​" : m.text}
        </mark>,
      );
      last = m.end;
    });
    if (last < text.length) parts.push(<span key="tail">{text.slice(last)}</span>);
    return parts;
  }, [result, text]);

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-col">
            <span className="mb-1.5 text-sm font-bold">パターン</span>
            <div className="flex items-center rounded-xl border-2 border-line bg-card focus-within:border-brand">
              <span className="mono px-3 text-muted">/</span>
              <input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                spellCheck={false}
                className="mono min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
                placeholder="正規表現"
              />
              <span className="mono px-3 text-muted">/{flags}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="mb-1.5 text-sm font-bold">フラグ</span>
            <div className="flex flex-wrap gap-1.5">
              {FLAGS.map((f) => (
                <Toggle key={f.flag} checked={flags.includes(f.flag)} onChange={(on) => toggleFlag(f.flag, on)}>
                  <span className="mono">{f.label}</span>
                </Toggle>
              ))}
            </div>
          </div>
        </div>
        <TextArea label="対象のテキスト" value={text} onChange={setText} rows={6} mono={false} />
        {result && !result.ok && <ErrorBox>{result.error}</ErrorBox>}
      </Card>

      {result?.ok && (
        <>
          <Card>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-bold">一致の強調</span>
              <Badge tone={result.matches.length > 0 ? "ok" : "neutral"}>一致 {result.matches.length} 件</Badge>
              {result.truncated && <Badge tone="warn">先頭 {MAX_MATCHES} 件のみ表示</Badge>}
              {!flags.includes("g") && result.matches.length > 0 && <Badge>g なしのため最初の1件のみ</Badge>}
            </div>
            <div className="min-h-16 whitespace-pre-wrap break-all rounded-xl border-2 border-line bg-surface px-3 py-2.5 text-sm leading-relaxed">
              {highlighted}
            </div>
          </Card>

          {result.matches.length > 0 && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-line text-left text-xs text-muted">
                      <th className="py-1.5 pr-3">#</th>
                      <th className="py-1.5 pr-3">位置</th>
                      <th className="py-1.5 pr-3">一致</th>
                      <th className="py-1.5">グループ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.matches.slice(0, 500).map((m, i) => (
                      <tr key={i} className="border-b border-line align-top">
                        <td className="py-1.5 pr-3 text-muted">{i + 1}</td>
                        <td className="mono py-1.5 pr-3 text-muted">{m.index}</td>
                        <td className="mono break-all py-1.5 pr-3 font-bold">{m.text || <span className="text-muted">(空)</span>}</td>
                        <td className="mono py-1.5">
                          {m.groups.length === 0 ? (
                            <span className="text-muted">—</span>
                          ) : (
                            m.groups.map((g) => (
                              <div key={g.name} className="break-all">
                                <span className="text-muted">{g.name}=</span>
                                {g.value ?? <span className="text-muted">undefined</span>}
                              </div>
                            ))
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card className="space-y-3">
            <Input label="置換 (replace)" value={replacement} onChange={setReplacement} placeholder="$1 や $<name> が使えます" />
            <Output label="置換結果" value={result.replaced ?? ""} rows={6} />
            <Note>$1〜$9 でグループ、$&lt;name&gt; で名前付きグループ、$& で一致全体を参照できます。</Note>
          </Card>
        </>
      )}
    </div>
  );
}
