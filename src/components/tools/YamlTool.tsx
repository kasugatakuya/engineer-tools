"use client";

import { useMemo, useState } from "react";
import { parseJson } from "@/lib/json";
import { valueToYaml, yamlToValue } from "@/lib/yaml";
import { ConverterShell, Segmented, Select } from "@/components/ui";

const EXAMPLE_YAML = `# GitHub Actions の例
name: CI
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
`;

export function YamlTool() {
  const [direction, setDirection] = useState<"y2j" | "j2y">("y2j");
  const [indent, setIndent] = useState<"2" | "4">("2");
  const [input, setInput] = useState(EXAMPLE_YAML);

  const { output, error, hint } = useMemo(() => {
    if (input.trim() === "") return { output: "", error: null, hint: undefined };
    if (direction === "y2j") {
      const r = yamlToValue(input);
      if (!r.ok) {
        const pos = r.error.line != null ? `${r.error.line} 行目 ${r.error.column} 文字目付近: ` : "";
        return { output: "", error: `${pos}${r.error.message}`, hint: undefined };
      }
      return {
        output: JSON.stringify(r.value, null, Number(indent)),
        error: null,
        hint: r.docs > 1 ? `${r.docs} 個のドキュメントを配列にまとめました` : undefined,
      };
    }
    const r = parseJson(input);
    if (!r.ok) {
      const pos = r.error.line != null ? `${r.error.line} 行目 ${r.error.column} 文字目付近: ` : "";
      return { output: "", error: `${pos}${r.error.message}${r.error.hint ? `\n💡 ${r.error.hint}` : ""}`, hint: undefined };
    }
    return { output: valueToYaml(r.value, Number(indent)), error: null, hint: undefined };
  }, [input, direction, indent]);

  return (
    <ConverterShell
      controls={
        <>
          <Segmented
            value={direction}
            onChange={setDirection}
            options={[
              { value: "y2j", label: "YAML → JSON" },
              { value: "j2y", label: "JSON → YAML" },
            ]}
          />
          <Select
            label="インデント"
            value={indent}
            onChange={setIndent}
            options={[
              { value: "2", label: "スペース2" },
              { value: "4", label: "スペース4" },
            ]}
          />
        </>
      }
      input={input}
      onInput={setInput}
      inputLabel={direction === "y2j" ? "YAML" : "JSON"}
      outputLabel={direction === "y2j" ? "JSON" : "YAML"}
      outputHint={hint}
      output={output}
      error={error}
      onSwap={() => {
        setInput(output);
        setDirection(direction === "y2j" ? "j2y" : "y2j");
      }}
      onClear={() => setInput("")}
      rows={14}
    />
  );
}
