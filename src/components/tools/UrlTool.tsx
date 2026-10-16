"use client";

import { useMemo, useState } from "react";
import { urlDecode, urlEncode, type UrlMode } from "@/lib/encoding";
import { ConverterShell, Note, Segmented, Select } from "@/components/ui";

const MODES: { value: UrlMode; label: string }[] = [
  { value: "component", label: "部分 (encodeURIComponent)" },
  { value: "uri", label: "URL全体 (encodeURI)" },
  { value: "form", label: "フォーム (スペースを + に)" },
];

const MODE_NOTE: Record<UrlMode, string> = {
  component: "クエリの値などに使う方式。& = / ? などもすべてエンコードします。",
  uri: "URL全体に使う方式。: / ? # & = などの区切り文字はそのまま残します。",
  form: "application/x-www-form-urlencoded 方式。スペースを + に、! ' ( ) ~ もエンコードします。",
};

export function UrlTool() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [method, setMethod] = useState<UrlMode>("component");
  const [input, setInput] = useState("検索 キーワード&sort=desc");

  const { output, error } = useMemo(() => {
    if (input === "") return { output: "", error: null };
    try {
      return { output: mode === "encode" ? urlEncode(input, method) : urlDecode(input, method), error: null };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, mode, method]);

  return (
    <div className="space-y-3">
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
            <Select label="方式" value={method} onChange={setMethod} options={MODES} />
          </>
        }
        input={input}
        onInput={setInput}
        output={output}
        error={error}
        onSwap={() => {
          setInput(output);
          setMode(mode === "encode" ? "decode" : "encode");
        }}
        onClear={() => setInput("")}
      />
      <Note>{MODE_NOTE[method]}</Note>
    </div>
  );
}
