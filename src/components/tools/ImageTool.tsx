"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAvifSupport } from "@/components/hooks";
import { Button, Card, ErrorBox, Note, Row, Segmented, Toggle, cx, formatBytes } from "@/components/ui";

type Format = "image/png" | "image/jpeg" | "image/webp" | "image/avif";
const FORMAT_LABEL: Record<Format, string> = { "image/png": "PNG", "image/jpeg": "JPEG", "image/webp": "WebP", "image/avif": "AVIF" };
const EXT: Record<Format, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/avif": "avif" };

interface Item {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
  error?: string;
}

interface Converted {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

let seq = 0;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("この画像はブラウザで読み込めませんでした（HEIC などは未対応です）。"));
    img.src = url;
  });
}

async function convert(item: Item, format: Format, quality: number, bg: string, maxSize: number | null): Promise<Converted> {
  const img = await loadImage(item.url);
  let { naturalWidth: w, naturalHeight: h } = img;
  if (w === 0 || h === 0) {
    w = w || 512;
    h = h || 512;
  }
  if (maxSize && (w > maxSize || h > maxSize)) {
    const ratio = Math.min(maxSize / w, maxSize / h);
    w = Math.max(1, Math.round(w * ratio));
    h = Math.max(1, Math.round(h * ratio));
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas を初期化できませんでした。");
  if (format === "image/jpeg") {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format, quality / 100));
  if (!blob) throw new Error("変換に失敗しました。");
  if (blob.type !== format) throw new Error(`このブラウザは ${FORMAT_LABEL[format]} への変換に対応していません。`);
  return { blob, url: URL.createObjectURL(blob), width: w, height: h };
}

function baseName(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

export function ImageTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [format, setFormat] = useState<Format>("image/webp");
  const [quality, setQuality] = useState(85);
  const [bg, setBg] = useState("#ffffff");
  const [resize, setResize] = useState(false);
  const [maxSize, setMaxSize] = useState(1920);
  const [converted, setConverted] = useState<Record<string, Converted | { error: string }>>({});
  const avifOk = useAvifSupport();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const next: Item[] = [];
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      const id = `${Date.now()}-${seq++}`;
      try {
        const img = await loadImage(url);
        next.push({ id, file, url, width: img.naturalWidth, height: img.naturalHeight });
      } catch (e) {
        next.push({ id, file, url, width: 0, height: 0, error: e instanceof Error ? e.message : String(e) });
      }
    }
    setItems((prev) => [...prev, ...next]);
  }, []);

  // convert whenever inputs change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: Record<string, Converted | { error: string }> = {};
      for (const item of items) {
        if (item.error) continue;
        try {
          out[item.id] = await convert(item, format, quality, bg, resize ? maxSize : null);
        } catch (e) {
          out[item.id] = { error: e instanceof Error ? e.message : String(e) };
        }
        if (cancelled) return;
      }
      if (!cancelled) {
        setConverted((prev) => {
          for (const v of Object.values(prev)) if ("url" in v) URL.revokeObjectURL(v.url);
          return out;
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items, format, quality, bg, resize, maxSize]);

  const remove = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((i) => i.id !== id);
    });
  };

  const download = (item: Item) => {
    const c = converted[item.id];
    if (!c || !("url" in c)) return;
    const a = document.createElement("a");
    a.href = c.url;
    a.download = `${baseName(item.file.name)}.${EXT[format]}`;
    a.click();
  };

  const downloadAll = async () => {
    for (const item of items) {
      download(item);
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  const lossy = format === "image/jpeg" || format === "image/webp" || format === "image/avif";
  const formatOptions = useMemo(() => {
    const opts: { value: Format; label: string }[] = [
      { value: "image/png", label: "PNG" },
      { value: "image/jpeg", label: "JPEG" },
      { value: "image/webp", label: "WebP" },
    ];
    if (avifOk) opts.push({ value: "image/avif", label: "AVIF" });
    return opts;
  }, [avifOk]);

  return (
    <div className="space-y-4">
      <Card>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={cx(
            "cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
            dragging ? "border-brand bg-brand/5" : "border-line-strong hover:border-brand hover:bg-brand/5",
          )}
        >
          <div className="text-4xl">🖼️</div>
          <div className="mt-2 font-display text-base font-extrabold">画像をドロップ、またはクリックして選択</div>
          <div className="mt-1 text-xs text-muted">PNG / JPEG / WebP / GIF / BMP / SVG / AVIF ・ 複数選択可</div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <Row className="mt-4">
          <Segmented label="出力形式" value={format} onChange={setFormat} options={formatOptions} />
          {lossy && (
            <label className="inline-flex items-center gap-2 text-xs font-bold text-muted">
              品質
              <input type="range" min={1} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-32" />
              <span className="mono w-8 text-ink">{quality}</span>
            </label>
          )}
          {format === "image/jpeg" && (
            <label className="inline-flex items-center gap-2 text-xs font-bold text-muted">
              背景色（透明部分）
              <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-8 w-10 cursor-pointer rounded-lg border-2 border-line bg-card" />
            </label>
          )}
          <Toggle checked={resize} onChange={setResize}>
            長辺を縮小
          </Toggle>
          {resize && (
            <label className="inline-flex items-center gap-1 text-xs font-bold text-muted">
              <input
                type="number"
                min={16}
                max={16384}
                value={maxSize}
                onChange={(e) => setMaxSize(Math.max(16, Number(e.target.value) || 16))}
                className="mono w-24 rounded-xl border-2 border-line px-2 py-1.5 text-sm font-semibold text-ink outline-none focus:border-brand"
              />
              px
            </label>
          )}
          {items.length > 1 && (
            <span className="ml-auto">
              <Button variant="primary" size="sm" onClick={downloadAll}>
                ⬇ すべてダウンロード
              </Button>
            </span>
          )}
        </Row>
      </Card>

      {items.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => {
            const c = converted[item.id];
            return (
              <Card key={item.id} className="flex gap-4">
                <div className="checker grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <div className="truncate font-bold" title={item.file.name}>
                    {item.file.name}
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {item.file.type || "不明"} ・ {formatBytes(item.file.size)}
                    {item.width > 0 && ` ・ ${item.width}×${item.height}`}
                  </div>
                  {item.error ? (
                    <div className="mt-2">
                      <ErrorBox>{item.error}</ErrorBox>
                    </div>
                  ) : c && "error" in c ? (
                    <div className="mt-2">
                      <ErrorBox>{c.error}</ErrorBox>
                    </div>
                  ) : c ? (
                    <div className="mt-2 rounded-xl bg-surface px-3 py-2 text-xs">
                      <span className="font-bold text-ink">→ {FORMAT_LABEL[format]}</span> ・ {formatBytes(c.blob.size)} ・ {c.width}×{c.height}
                      <span className={cx("ml-2 font-bold", c.blob.size <= item.file.size ? "text-pop-green" : "text-pop-orange")}>
                        ({Math.round((c.blob.size / item.file.size) * 100)}%)
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-muted">変換中…</div>
                  )}
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => download(item)} disabled={!c || !("url" in c)}>
                      ⬇ ダウンロード
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(item.id)}>
                      削除
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Note>
        変換は Canvas API で行うため、アニメーションGIFは最初のフレームだけになります。JPEG は透明を扱えないので背景色で塗りつぶします。
        画像はブラウザの外には送信されません。
      </Note>
    </div>
  );
}
