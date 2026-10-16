"use client";

import { useMemo, useState } from "react";
import { formatJson, minifyJson, parseJson, type JsonIndent } from "@/lib/json";
import { ConverterShell, Segmented, Select, Toggle } from "@/components/ui";

const EXAMPLE = `{"name":"mykonami-web","version":"1.4.2","private":true,"scripts":{"dev":"next dev","build":"next build"},"tags":["react","next","typescript"],"engines":{"node":">=20"}}`;

export function JsonTool() {
  const [mode, setMode] = useState<"format" | "minify">("format");
  const [indent, setIndent] = useState<"2" | "4" | "tab">("2");
  const [sortKeys, setSortKeys] = useState(false);
  const [input, setInput] = useState(EXAMPLE);

  const { output, error } = useMemo(() => {
    if (input.trim() === "") return { output: "", error: null };
    const parsed = parseJson(input);
    if (!parsed.ok) {
      const { line, column, hint, message } = parsed.error;
      const pos = line != null ? `${line} 行目 ${column} 文字目付近: ` : "";
      return { output: "", error: `${pos}${message}${hint ? `\n💡 ${hint}` : ""}` };
    }
    const ind: JsonIndent = indent === "tab" ? "tab" : (Number(indent) as 2 | 4);
    return {
      output: mode === "format" ? formatJson(parsed.value, ind, sortKeys) : minifyJson(parsed.value, sortKeys),
      error: null,
    };
  }, [input, mode, indent, sortKeys]);

  return (
    <ConverterShell
      controls={
        <>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "format", label: "整形" },
              { value: "minify", label: "圧縮" },
            ]}
          />
          {mode === "format" && (
            <Select
              label="インデント"
              value={indent}
              onChange={setIndent}
              options={[
                { value: "2", label: "スペース2" },
                { value: "4", label: "スペース4" },
                { value: "tab", label: "タブ" },
              ]}
            />
          )}
          <Toggle checked={sortKeys} onChange={setSortKeys}>
            キーを並べ替え
          </Toggle>
        </>
      }
      input={input}
      onInput={setInput}
      output={output}
      outputHint={output ? `${output.length} 文字` : undefined}
      error={error}
      onSwap={() => setInput(output)}
      onClear={() => setInput("")}
      rows={14}
    />
  );
}
