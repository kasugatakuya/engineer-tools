"use client";

import { useMemo, useState } from "react";
import { useBrowserTimeZone, useNow } from "@/components/hooks";
import {
  TIMEZONES,
  formatInZone,
  formatOffset,
  parseDateTimeInput,
  parseTimestamp,
  relativeTime,
  tzOffsetMs,
  zonedPartsToMs,
  type Unit,
} from "@/lib/time";
import { Badge, Button, Card, CopyButton, ErrorBox, Input, Note, Segmented, Select, ValueLine } from "@/components/ui";

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

function nowInZoneString(ms: number, tz: string) {
  return formatInZone(ms, tz);
}

export function UnixTimeTool() {
  const now = useNow(1000);
  const browserTz = useBrowserTimeZone();
  const [tsInput, setTsInput] = useState("1792113865");
  const [unit, setUnit] = useState<Unit>("auto");
  const [dtInput, setDtInput] = useState("2026-10-16 10:24:25");
  const [dtTz, setDtTz] = useState("Asia/Tokyo");

  const parsed = useMemo(() => parseTimestamp(tsInput, unit), [tsInput, unit]);
  const dtParts = useMemo(() => parseDateTimeInput(dtInput), [dtInput]);
  const dtMs = useMemo(() => (dtParts ? zonedPartsToMs(dtParts, dtTz) : null), [dtParts, dtTz]);

  const tzOptions = useMemo(() => {
    const list = [...TIMEZONES];
    if (browserTz && !list.some((t) => t.id === browserTz)) list.push({ id: browserTz, label: `ブラウザ (${browserTz})` });
    return list.map((t) => ({ value: t.id, label: t.label }));
  }, [browserTz]);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-bold">現在のUnix時間:</span>
        <span className="mono text-sm">
          {now != null ? (
            <>
              <span className="font-bold">{Math.floor(now / 1000)}</span> 秒 / <span className="font-bold">{now}</span> ミリ秒
            </>
          ) : (
            "—"
          )}
        </span>
        <span className="ml-auto flex gap-2">
          <CopyButton text={now != null ? String(Math.floor(now / 1000)) : ""} label="秒をコピー" />
          <CopyButton text={now != null ? String(now) : ""} label="ミリ秒をコピー" />
        </span>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="font-display text-base font-extrabold">タイムスタンプから日時へ</h2>
          <Input
            label="Unixタイムスタンプ"
            value={tsInput}
            onChange={setTsInput}
            placeholder="1792113865 または 1792113865000"
            inputMode="numeric"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setTsInput(String(Math.floor(Date.now() / 1000)))}>
              現在時刻を入れる
            </Button>
            <Segmented
              label="単位の判定"
              value={unit}
              onChange={setUnit}
              options={[
                { value: "auto", label: "自動" },
                { value: "s", label: "秒" },
                { value: "ms", label: "ミリ秒" },
              ]}
            />
          </div>
          {tsInput.trim() !== "" && !parsed && <ErrorBox>数値として読み取れません。整数または小数の数字を入力してください。</ErrorBox>}
          {parsed && (
            <div className="space-y-2">
              <div>
                <Badge tone="ok">{parsed.unit === "s" ? "秒として解釈" : "ミリ秒として解釈"}</Badge>
                {parsed.detected && <span className="ml-2 text-xs text-muted">（桁数から自動判定）</span>}
              </div>
              <ValueLine label="UTC" value={formatInZone(parsed.ms, "UTC", parsed.unit === "ms")} />
              <ValueLine label="日本標準時 (JST)" value={formatInZone(parsed.ms, "Asia/Tokyo", parsed.unit === "ms")} />
              <ValueLine
                label={`ブラウザ (${browserTz ?? "…"})`}
                value={browserTz ? formatInZone(parsed.ms, browserTz, parsed.unit === "ms") : ""}
              />
              <ValueLine label="ISO 8601" value={new Date(parsed.ms).toISOString()} />
              <ValueLine label="RFC 2822" value={new Date(parsed.ms).toUTCString()} />
              <ValueLine label="現在との差" value={now != null ? relativeTime(parsed.ms, now) : ""} mono={false} />
            </div>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="font-display text-base font-extrabold">日時からタイムスタンプへ</h2>
          <Input label="日時" value={dtInput} onChange={setDtInput} placeholder="2026-10-16 10:24:25" />
          <div className="flex flex-wrap items-center gap-2">
            <Select label="タイムゾーン" value={dtTz} onChange={setDtTz} options={tzOptions} />
            <Button
              size="sm"
              onClick={() => {
                const d = new Date();
                setDtInput(nowInZoneString(d.getTime(), dtTz));
              }}
            >
              今の日時を入れる
            </Button>
          </div>
          {dtInput.trim() !== "" && !dtParts && (
            <ErrorBox>「YYYY-MM-DD HH:mm:ss」の形式で入力してください（時刻は省略できます）。</ErrorBox>
          )}
          {dtMs != null && dtParts && (
            <div className="space-y-2">
              <div>
                <Badge>
                  {dtTz} (UTC{formatOffset(tzOffsetMs(dtTz, new Date(dtMs)))})
                </Badge>
              </div>
              <ValueLine label="秒" value={String(Math.floor(dtMs / 1000))} />
              <ValueLine label="ミリ秒" value={String(dtMs)} />
              <ValueLine label="ISO 8601 (UTC)" value={new Date(dtMs).toISOString()} />
              <ValueLine label="JST" value={`${formatInZone(dtMs, "Asia/Tokyo")}`} />
              <ValueLine
                label="日付 (YYYYMMDD)"
                value={`${dtParts.year}${pad(dtParts.month)}${pad(dtParts.day)}`}
              />
            </div>
          )}
          <Note>夏時間のあるタイムゾーンも、指定した日時時点のオフセットで計算します。</Note>
        </Card>
      </div>
    </div>
  );
}
