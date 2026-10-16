"use client";

import { useMemo, useState } from "react";
import { base64Decode, base64Encode, utf8Encode } from "@/lib/encoding";
import { ConverterShell, Segmented, Toggle, formatBytes } from "@/components/ui";

export function Base64Tool() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [urlSafe, setUrlSafe] = useState(false);
  const [input, setInput] = useState("こんにちは、Hello 世界！");

  const { output, error } = useMemo(() => {
    if (input === "") return { output: "", error: null };
    try {
      return { output: mode === "encode" ? base64Encode(input, urlSafe) : base64Decode(input), error: null };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, mode, urlSafe]);

  return (
    <ConverterShell
      controls={
        <>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "encode", label: "エンコード" },
              { value: "decode", label: "デコード" },
            ]}
          />
          {mode === "encode" && (
            <Toggle checked={urlSafe} onChange={setUrlSafe}>
              URLセーフ形式 (- と _、パディングなし)
            </Toggle>
          )}
        </>
      }
      input={input}
      onInput={setInput}
      inputHint={input ? formatBytes(utf8Encode(input).length) : undefined}
      output={output}
      outputHint={output ? `${output.length} 文字` : undefined}
      error={error}
      onSwap={() => {
        setInput(output);
        setMode(mode === "encode" ? "decode" : "encode");
      }}
      onClear={() => setInput("")}
      placeholder={mode === "encode" ? "エンコードするテキスト" : "Base64文字列"}
    />
  );
}
