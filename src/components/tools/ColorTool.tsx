"use client";

import { useMemo, useState } from "react";
import {
  adjustLightness,
  contrastRatio,
  parseColor,
  shiftHue,
  toCmykString,
  toHex,
  toHslString,
  toHsvString,
  toRgbString,
  type RGB,
} from "@/lib/color";
import { Badge, Card, ErrorBox, Note, ValueLine, cx } from "@/components/ui";

function parseAny(input: string): RGB | null {
  const direct = parseColor(input);
  if (direct) return direct;
  if (typeof document === "undefined") return null;
  // CSS named colors etc. via the browser
  const s = input.trim();
  if (!/^[a-zA-Z]+$/.test(s)) return null;
  const el = document.createElement("span");
  el.style.color = s;
  if (!el.style.color) return null;
  // getComputedStyle normalizes named colors to rgb(); the element must be attached
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color;
  el.remove();
  return parseColor(computed);
}

function Swatch({ color, label, onPick }: { color: RGB; label?: string; onPick?: (hex: string) => void }) {
  const hex = toHex(color);
  return (
    <button
      type="button"
      onClick={() => onPick?.(hex)}
      title={hex}
      className="group flex flex-col items-center gap-1"
    >
      <span className="checker size-10 overflow-hidden rounded-xl border-2 border-line transition group-hover:scale-110">
        <span className="block size-full" style={{ background: toRgbString(color) }} />
      </span>
      <span className="mono text-[10px] text-muted">{label ?? hex}</span>
    </button>
  );
}

const WHITE: RGB = { r: 255, g: 255, b: 255, a: 1 };
const BLACK: RGB = { r: 0, g: 0, b: 0, a: 1 };

function wcag(ratio: number) {
  if (ratio >= 7) return { tone: "ok" as const, label: "AAA" };
  if (ratio >= 4.5) return { tone: "ok" as const, label: "AA" };
  if (ratio >= 3) return { tone: "warn" as const, label: "AA (大きな文字のみ)" };
  return { tone: "bad" as const, label: "不足" };
}

export function ColorTool() {
  const [input, setInput] = useState("#6d5dfc");
  const color = useMemo(() => parseAny(input), [input]);

  const pickerValue = color ? toHex({ ...color, a: 1 }) : "#000000";

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="checker size-28 shrink-0 overflow-hidden rounded-2xl border-2 border-line">
            <div className="size-full" style={{ background: color ? toRgbString(color) : "transparent" }} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="mb-1.5 block text-sm font-bold">カラーコード</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={pickerValue}
                onChange={(e) => setInput(e.target.value)}
                aria-label="カラーピッカー"
                className="h-11 w-12 shrink-0 cursor-pointer rounded-xl border-2 border-line bg-card p-1"
              />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
                placeholder="#ff6b9d / rgb(255 107 157) / hsl(340 100% 71%) / tomato"
                className="mono w-full rounded-xl border-2 border-line bg-card px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["#ff5f9e", "#ff8a3d", "#ffc53d", "#1fc38a", "#2fa8ff", "#8b6cff", "#1f2437", "rgba(47, 168, 255, 0.5)"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setInput(c)}
                  className="size-6 rounded-full border-2 border-card shadow-soft ring-1 ring-line transition hover:scale-110"
                  style={{ background: c }}
                  title={c}
                />
              ))}
            </div>
            {!color && input.trim() !== "" && (
              <div className="mt-3">
                <ErrorBox>色として読み取れません。#RRGGBB、rgb()、hsl()、または CSS の色名で入力してください。</ErrorBox>
              </div>
            )}
          </div>
        </div>
      </Card>

      {color && (
        <>
          <Card className="space-y-2">
            <ValueLine label="HEX" value={toHex({ ...color, a: 1 })} />
            {color.a < 1 && <ValueLine label="HEX (アルファ付き)" value={toHex(color, true)} />}
            <ValueLine label="RGB" value={toRgbString(color)} />
            <ValueLine label="HSL" value={toHslString(color)} />
            <ValueLine label="HSV / HSB" value={toHsvString(color)} />
            <ValueLine label="CMYK" value={toCmykString(color)} />
            <ValueLine
              label="RGB (0〜1)"
              value={`${(color.r / 255).toFixed(3)}, ${(color.g / 255).toFixed(3)}, ${(color.b / 255).toFixed(3)}`}
            />
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-display text-base font-extrabold">コントラスト比 (WCAG)</h2>
              <div className="space-y-2">
                {[
                  { name: "白背景", bg: WHITE },
                  { name: "黒背景", bg: BLACK },
                ].map(({ name, bg }) => {
                  const ratio = contrastRatio({ ...color, a: 1 }, bg);
                  const w = wcag(ratio);
                  return (
                    <div key={name} className="flex items-center gap-3 rounded-xl border-2 border-line px-3 py-2">
                      <span
                        className="grid h-10 w-20 shrink-0 place-items-center rounded-lg text-sm font-bold"
                        style={{ background: toRgbString(bg), color: toRgbString({ ...color, a: 1 }) }}
                      >
                        Aa 文字
                      </span>
                      <span className="flex-1 text-sm">
                        <span className="font-bold">{name}</span>
                        <span className="mono ml-2 text-muted">{ratio.toFixed(2)} : 1</span>
                      </span>
                      <Badge tone={w.tone}>{w.label}</Badge>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3">
                <Note>通常の文字は 4.5:1 以上で AA、7:1 以上で AAA。大きな文字（18pt以上 / 太字14pt以上）は 3:1 で AA です。</Note>
              </div>
            </Card>

            <Card>
              <h2 className="mb-3 font-display text-base font-extrabold">バリエーション</h2>
              <div className="mb-1 text-xs font-bold text-muted">明度</div>
              <div className="mb-4 flex flex-wrap gap-2">
                {[-40, -30, -20, -10, 0, 10, 20, 30, 40].map((d) => (
                  <Swatch
                    key={d}
                    color={adjustLightness({ ...color, a: 1 }, d)}
                    label={d === 0 ? "基準" : `${d > 0 ? "+" : ""}${d}`}
                    onPick={setInput}
                  />
                ))}
              </div>
              <div className="mb-1 text-xs font-bold text-muted">色相（補色・トライアド・類似色）</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { d: 180, l: "補色" },
                  { d: 120, l: "+120°" },
                  { d: 240, l: "+240°" },
                  { d: 30, l: "+30°" },
                  { d: -30, l: "-30°" },
                  { d: 90, l: "+90°" },
                  { d: -90, l: "-90°" },
                ].map(({ d, l }) => (
                  <Swatch key={d} color={shiftHue({ ...color, a: 1 }, d)} label={l} onPick={setInput} />
                ))}
              </div>
              <p className={cx("mt-3 text-xs text-muted")}>色をクリックすると入力に反映されます。</p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
