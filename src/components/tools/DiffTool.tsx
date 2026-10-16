"use client";

import { useState } from "react";
import type { DiffRow, Segment } from "@/lib/diff";
import { useDiff } from "./useDiff";
import { Badge, Button, Card, Row, Segmented, TextArea, Toggle, cx } from "@/components/ui";

const EXAMPLE_BEFORE = `function total(items) {
  let sum = 0;
  for (const item of items) {
    sum += item.price * item.qty;
  }
  return sum;
}

export default total;
`;

const EXAMPLE_AFTER = `function total(items, taxRate = 0.1) {
  let sum = 0;
  for (const item of items) {
    sum += item.price * item.quantity;
  }
  return Math.round(sum * (1 + taxRate));
}

export default total;
`;

function Segs({ segs, text, side }: { segs?: Segment[]; text: string; side: "left" | "right" }) {
  if (!segs) return <>{text}</>;
  return (
    <>
      {segs.map((s, i) =>
        s.type === "equal" ? (
          <span key={i}>{s.text}</span>
        ) : (
          <mark
            key={i}
            className={cx("rounded-sm px-0.5", side === "left" ? "bg-diff-del-strong" : "bg-diff-ins-strong")}
          >
            {s.text}
          </mark>
        ),
      )}
    </>
  );
}

const rowBg = {
  equal: "bg-card",
  replace: "bg-diff-chg",
  delete: "bg-diff-del",
  insert: "bg-diff-ins",
};

function SideBySide({ rows }: { rows: DiffRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border-2 border-line">
      <table className="mono w-full table-fixed border-collapse text-[13px] leading-relaxed">
        <colgroup>
          <col className="w-10" />
          <col />
          <col className="w-10" />
          <col />
        </colgroup>
        <tbody>
          {rows.map((r, i) => {
            if (r.type === "skip") {
              return (
                <tr key={i} className="bg-surface text-center text-xs text-muted">
                  <td colSpan={4} className="py-1">
                    … {r.count} 行省略 …
                  </td>
                </tr>
              );
            }
            const leftNo = r.type === "insert" ? "" : r.leftNo;
            const rightNo = r.type === "delete" ? "" : r.rightNo;
            const left = r.type === "insert" ? "" : r.left;
            const right = r.type === "delete" ? "" : r.right;
            const leftBg = r.type === "insert" ? "bg-surface" : rowBg[r.type];
            const rightBg = r.type === "delete" ? "bg-surface" : rowBg[r.type];
            return (
              <tr key={i} className="align-top">
                <td className={cx("select-none border-r border-line px-1 text-right text-xs text-muted", leftBg)}>{leftNo}</td>
                <td className={cx("whitespace-pre-wrap break-all border-r-2 border-line px-2", leftBg)}>
                  {r.type === "replace" ? <Segs segs={r.leftSegs} text={left} side="left" /> : left || " "}
                </td>
                <td className={cx("select-none border-r border-line px-1 text-right text-xs text-muted", rightBg)}>{rightNo}</td>
                <td className={cx("whitespace-pre-wrap break-all px-2", rightBg)}>
                  {r.type === "replace" ? <Segs segs={r.rightSegs} text={right} side="right" /> : right || " "}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Unified({ rows }: { rows: DiffRow[] }) {
  const lines: { sign: string; no: string; text: React.ReactNode; bg: string }[] = [];
  for (const r of rows) {
    if (r.type === "skip") lines.push({ sign: "", no: "", text: `… ${r.count} 行省略 …`, bg: "bg-surface text-muted text-xs text-center" });
    else if (r.type === "equal") lines.push({ sign: " ", no: `${r.leftNo}`, text: r.left, bg: "bg-card" });
    else if (r.type === "delete") lines.push({ sign: "-", no: `${r.leftNo}`, text: r.left, bg: "bg-diff-del" });
    else if (r.type === "insert") lines.push({ sign: "+", no: `${r.rightNo}`, text: r.right, bg: "bg-diff-ins" });
    else {
      lines.push({ sign: "-", no: `${r.leftNo}`, text: <Segs segs={r.leftSegs} text={r.left} side="left" />, bg: "bg-diff-del" });
      lines.push({ sign: "+", no: `${r.rightNo}`, text: <Segs segs={r.rightSegs} text={r.right} side="right" />, bg: "bg-diff-ins" });
    }
  }
  return (
    <div className="overflow-x-auto rounded-xl border-2 border-line">
      <table className="mono w-full border-collapse text-[13px] leading-relaxed">
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className={cx("align-top", l.bg)}>
              <td className="w-10 select-none border-r border-line px-1 text-right text-xs text-muted">{l.no}</td>
              <td className="w-5 select-none px-1 text-center font-bold">{l.sign}</td>
              <td className="whitespace-pre-wrap break-all px-2">{l.text || " "}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DiffTool() {
  const [before, setBefore] = useState(EXAMPLE_BEFORE);
  const [after, setAfter] = useState(EXAMPLE_AFTER);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [contextOnly, setContextOnly] = useState(false);
  const [view, setView] = useState<"side" | "unified">("side");

  const { result, pending } = useDiff(before, after, { ignoreWhitespace, ignoreCase, context: contextOnly ? 2 : null });
  const same = result.stats.added === 0 && result.stats.deleted === 0 && result.stats.changed === 0;

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <TextArea label="変更前" value={before} onChange={setBefore} rows={12} placeholder="比較元のテキスト" />
          <TextArea label="変更後" value={after} onChange={setAfter} rows={12} placeholder="比較先のテキスト" />
        </div>
        <Row className="mt-4">
          <Toggle checked={ignoreWhitespace} onChange={setIgnoreWhitespace}>
            空白の違いを無視
          </Toggle>
          <Toggle checked={ignoreCase} onChange={setIgnoreCase}>
            大文字小文字を無視
          </Toggle>
          <Toggle checked={contextOnly} onChange={setContextOnly}>
            差分の前後2行だけ表示
          </Toggle>
          <span className="ml-auto flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                setBefore(after);
                setAfter(before);
              }}
            >
              ⇄ 左右を入れ替え
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setBefore("");
                setAfter("");
              }}
            >
              クリア
            </Button>
          </span>
        </Row>
      </Card>

      <Card>
        <Row className="mb-3">
          <Badge tone="ok">追加 {result.stats.added} 行</Badge>
          <Badge tone="bad">削除 {result.stats.deleted} 行</Badge>
          <Badge tone="warn">変更 {result.stats.changed} 行</Badge>
          {same && !pending && before.length + after.length > 0 && <Badge>差分はありません</Badge>}
          {pending && <Badge>計算中…</Badge>}
          <span className="ml-auto">
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: "side", label: "左右" },
                { value: "unified", label: "上下" },
              ]}
            />
          </span>
        </Row>
        {result.rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">テキストを入力すると差分が表示されます。</p>
        ) : view === "side" ? (
          <SideBySide rows={result.rows} />
        ) : (
          <Unified rows={result.rows} />
        )}
      </Card>
    </div>
  );
}
