"use client";

import { useMemo, useState } from "react";
import { csvToJson, detectDelimiter, jsonToCsv, type Delimiter } from "@/lib/csv";
import { parseJson } from "@/lib/json";
import { ConverterShell, Segmented, Select, Toggle } from "@/components/ui";

const EXAMPLE_CSV = `id,name,email,age,active,joined
1,"Tanaka, Taro",taro@example.com,34,true,2024-04-01
2,鈴木 花子,hanako@example.com,28,false,2023-11-15
3,"Sato ""Sam"" Jiro",sam@example.com,,true,2025-01-20
`;

type DelimOpt = Delimiter | "auto";
const DELIMS: { value: DelimOpt; label: string }[] = [
  { value: "auto", label: "自動判定" },
  { value: ",", label: "カンマ ( , )" },
  { value: "\t", label: "タブ (TSV)" },
  { value: ";", label: "セミコロン ( ; )" },
  { value: "|", label: "パイプ ( | )" },
];
const DELIM_NAME: Record<Delimiter, string> = { ",": "カンマ", "\t": "タブ", ";": "セミコロン", "|": "パイプ" };

export function CsvTool() {
  const [direction, setDirection] = useState<"c2j" | "j2c">("c2j");
  const [delimiter, setDelimiter] = useState<DelimOpt>("auto");
  const [header, setHeader] = useState(true);
  const [trim, setTrim] = useState(true);
  const [convertTypes, setConvertTypes] = useState(true);
  const [emptyAsNull, setEmptyAsNull] = useState(true);
  const [input, setInput] = useState(EXAMPLE_CSV);

  const { output, error, hint } = useMemo(() => {
    if (input.trim() === "") return { output: "", error: null, hint: undefined };
    try {
      if (direction === "c2j") {
        const r = csvToJson(input, { delimiter, header, trim, convertTypes, emptyAsNull });
        const d = delimiter === "auto" ? detectDelimiter(input) : delimiter;
        return {
          output: JSON.stringify(r.data, null, 2),
          error: null,
          hint: `${r.rowCount} 行${header ? ` ・ ${r.columns.length} 列` : ""} ・ 区切り: ${DELIM_NAME[d]}`,
        };
      }
      const r = parseJson(input);
      if (!r.ok) {
        const pos = r.error.line != null ? `${r.error.line} 行目 ${r.error.column} 文字目付近: ` : "";
        return { output: "", error: `${pos}${r.error.message}`, hint: undefined };
      }
      const d: Delimiter = delimiter === "auto" ? "," : delimiter;
      return { output: jsonToCsv(r.value, d, header), error: null, hint: undefined };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : String(e), hint: undefined };
    }
  }, [input, direction, delimiter, header, trim, convertTypes, emptyAsNull]);

  return (
    <ConverterShell
      controls={
        <>
          <Segmented
            value={direction}
            onChange={setDirection}
            options={[
              { value: "c2j", label: "CSV → JSON" },
              { value: "j2c", label: "JSON → CSV" },
            ]}
          />
          <Select label="区切り" value={delimiter} onChange={setDelimiter} options={DELIMS} />
          <Toggle checked={header} onChange={setHeader}>
            {direction === "c2j" ? "1行目はヘッダー" : "ヘッダー行を出力"}
          </Toggle>
          {direction === "c2j" && (
            <>
              <Toggle checked={trim} onChange={setTrim}>
                前後の空白を除去
              </Toggle>
              <Toggle checked={convertTypes} onChange={setConvertTypes}>
                数値・真偽値に変換
              </Toggle>
              <Toggle checked={emptyAsNull} onChange={setEmptyAsNull}>
                空欄は null
              </Toggle>
            </>
          )}
        </>
      }
      input={input}
      onInput={setInput}
      inputLabel={direction === "c2j" ? "CSV / TSV" : "JSON（オブジェクトの配列）"}
      outputLabel={direction === "c2j" ? "JSON" : "CSV"}
      outputHint={hint}
      output={output}
      error={error}
      onSwap={() => {
        setInput(output);
        setDirection(direction === "c2j" ? "j2c" : "c2j");
      }}
      onClear={() => setInput("")}
      rows={14}
    />
  );
}
