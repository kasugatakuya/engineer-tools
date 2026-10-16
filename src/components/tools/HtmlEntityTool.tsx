"use client";

import { useCallback, useMemo, useState } from "react";
import { htmlEscape, htmlUnescape } from "@/lib/encoding";
import { ConverterShell, Segmented, Toggle } from "@/components/ui";

export function HtmlEntityTool() {
  const [mode, setMode] = useState<"escape" | "unescape">("escape");
  const [numeric, setNumeric] = useState(false);
  const [input, setInput] = useState(`<a href="/search?q=a&b">"Tom & Jerry" の '検索'</a>`);

  // Use the browser's own entity table for names not in the built-in map.
  const resolve = useCallback((name: string) => {
    if (typeof document === "undefined") return undefined;
    const ta = document.createElement("textarea");
    ta.innerHTML = `&${name};`;
    return ta.value === `&${name};` ? undefined : ta.value;
  }, []);

  const output = useMemo(
    () => (mode === "escape" ? htmlEscape(input, numeric) : htmlUnescape(input, resolve)),
    [input, mode, numeric, resolve],
  );

  return (
    <ConverterShell
      controls={
        <>
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "escape", label: "エスケープ" },
              { value: "unescape", label: "アンエスケープ" },
            ]}
          />
          {mode === "escape" && (
            <Toggle checked={numeric} onChange={setNumeric}>
              日本語などを数値参照にする
            </Toggle>
          )}
        </>
      }
      input={input}
      onInput={setInput}
      output={output}
      onSwap={() => {
        setInput(output);
        setMode(mode === "escape" ? "unescape" : "escape");
      }}
      onClear={() => setInput("")}
    />
  );
}
