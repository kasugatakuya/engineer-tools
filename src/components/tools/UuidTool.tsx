"use client";

import { useMemo, useState } from "react";
import { useHydrated } from "@/components/hooks";
import { generateUuids, type UuidVersion } from "@/lib/uuid";
import { Button, Card, CopyButton, Note, Row, Segmented, Toggle } from "@/components/ui";

export function UuidTool() {
  const [version, setVersion] = useState<UuidVersion>("v4");
  const [count, setCount] = useState(5);
  const [upper, setUpper] = useState(false);
  const [noHyphens, setNoHyphens] = useState(false);
  const [braces, setBraces] = useState(false);
  const [nonce, setNonce] = useState(0);
  const hydrated = useHydrated();

  const list = useMemo(
    () => (hydrated ? generateUuids({ version, count, upper, noHyphens, braces }) : []),
    // nonce forces a fresh batch when the button is pressed
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hydrated, version, count, upper, noHyphens, braces, nonce],
  );
  const regenerate = () => setNonce((n) => n + 1);

  return (
    <div className="space-y-4">
      <Card>
        <Row>
          <Segmented
            label="バージョン"
            value={version}
            onChange={setVersion}
            options={[
              { value: "v4", label: "v4 (ランダム)" },
              { value: "v7", label: "v7 (時刻順)" },
            ]}
          />
          <label className="inline-flex items-center gap-2 text-xs font-bold text-muted">
            個数
            <input
              type="number"
              min={1}
              max={1000}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))}
              className="mono w-20 rounded-xl border-2 border-line px-2 py-1.5 text-sm font-semibold text-ink outline-none focus:border-brand"
            />
          </label>
          <Toggle checked={upper} onChange={setUpper}>
            大文字
          </Toggle>
          <Toggle checked={noHyphens} onChange={setNoHyphens}>
            ハイフンなし
          </Toggle>
          <Toggle checked={braces} onChange={setBraces}>
            {"{ } で囲む"}
          </Toggle>
          <span className="ml-auto">
            <Button variant="primary" onClick={regenerate}>
              🎲 もう一度生成
            </Button>
          </span>
        </Row>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold">結果 ({list.length} 件)</span>
          <CopyButton text={list.join("\n")} label="すべてコピー" />
        </div>
        <ul className="space-y-1.5">
          {list.map((u, i) => (
            <li key={`${i}-${u}`} className="flex items-center gap-3 rounded-xl border-2 border-line px-3 py-1.5">
              <span className="w-8 text-right text-xs text-muted">{i + 1}</span>
              <span className="mono min-w-0 flex-1 break-all text-sm">{u}</span>
              <CopyButton text={u} />
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <Note>
            v4 は完全なランダム、v7 は先頭48ビットがミリ秒タイムスタンプなので生成順にソートできます（DBの主キー向き）。
            どちらも crypto.getRandomValues による暗号論的乱数を使います。
          </Note>
        </div>
      </Card>
    </div>
  );
}
