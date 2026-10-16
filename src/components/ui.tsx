"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ACCENT_CLASSES, type ToolMeta } from "@/lib/tools";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/* ---------- Layout ---------- */

export function ToolHeader({ tool, children }: { tool: ToolMeta; children?: React.ReactNode }) {
  const accent = ACCENT_CLASSES[tool.accent];
  return (
    <div className="mb-6 flex flex-wrap items-start gap-4">
      <span className={cx("grid size-14 shrink-0 place-items-center rounded-2xl text-3xl", accent.soft)}>{tool.emoji}</span>
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{tool.name}</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted sm:text-[15px]">{children ?? tool.description}</p>
      </div>
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cx("rounded-2xl border-2 border-line bg-card p-4 shadow-soft sm:p-5", className)}>{children}</section>;
}

export function Row({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cx("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}

export function Label({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <span className="text-sm font-bold">{children}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

/* ---------- Buttons ---------- */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ variant = "secondary", size = "md", className, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        variant === "primary" && "bg-brand text-white shadow-pop hover:bg-brand-deep",
        variant === "secondary" && "border-2 border-line bg-card text-ink hover:border-line-strong hover:bg-surface",
        variant === "ghost" && "text-muted hover:bg-surface hover:text-ink",
        variant === "danger" && "border-2 border-pop-red/40 bg-card text-pop-red hover:bg-pop-red/10",
        className,
      )}
      {...rest}
    />
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  label?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      {label && <span className="text-xs font-bold text-muted">{label}</span>}
      <div role="radiogroup" className="inline-flex rounded-xl border-2 border-line bg-surface p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cx(
              "rounded-lg px-3 py-1.5 text-sm font-bold transition",
              value === o.value ? "bg-card text-brand-deep shadow-soft" : "text-muted hover:text-ink",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cx(
        "inline-flex cursor-pointer select-none items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-sm font-semibold transition",
        checked ? "border-brand/40 bg-brand/10 text-brand-deep" : "border-line bg-card text-muted hover:border-line-strong",
      )}
    >
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        className={cx(
          "grid size-4 place-items-center rounded-md border-2 text-[10px] font-black text-white",
          checked ? "border-brand bg-brand" : "border-line-strong bg-card",
        )}
      >
        {checked ? "✓" : ""}
      </span>
      {children}
    </label>
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cx("inline-flex items-center gap-2", className)}>
      {label && (
        <label htmlFor={id} className="text-xs font-bold text-muted">
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-xl border-2 border-line bg-card px-3 py-1.5 text-sm font-semibold outline-none focus:border-brand"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ---------- Inputs ---------- */

type TextAreaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  mono?: boolean;
  onChange?: (v: string) => void;
  actions?: React.ReactNode;
};

export function TextArea({ label, hint, mono = true, className, onChange, actions, rows = 8, ...rest }: TextAreaProps) {
  return (
    <div className="flex min-w-0 flex-col">
      {(label || actions) && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-sm font-bold">
            {label}
            {hint && <span className="ml-2 text-xs font-normal text-muted">{hint}</span>}
          </span>
          {actions}
        </div>
      )}
      <textarea
        rows={rows}
        spellCheck={false}
        onChange={(e) => onChange?.(e.target.value)}
        className={cx(
          "w-full resize-y rounded-xl border-2 border-line bg-card px-3 py-2.5 text-sm leading-relaxed outline-none transition placeholder:text-muted/60 focus:border-brand read-only:bg-surface",
          mono && "mono",
          className,
        )}
        {...rest}
      />
    </div>
  );
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label?: React.ReactNode;
  mono?: boolean;
  onChange?: (v: string) => void;
};

export function Input({ label, mono = true, className, onChange, ...rest }: InputProps) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col">
      {label && (
        <label htmlFor={id} className="mb-1.5 text-sm font-bold">
          {label}
        </label>
      )}
      <input
        id={id}
        spellCheck={false}
        onChange={(e) => onChange?.(e.target.value)}
        className={cx(
          "w-full rounded-xl border-2 border-line bg-card px-3 py-2 text-sm outline-none transition placeholder:text-muted/60 focus:border-brand read-only:bg-surface",
          mono && "mono",
          className,
        )}
        {...rest}
      />
    </div>
  );
}

/* ---------- Copy ---------- */

export function useCopy(timeout = 1500) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), timeout);
    },
    [timeout],
  );
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return { copied, copy };
}

export function CopyButton({ text, label = "コピー", size = "sm", disabled }: { text: string; label?: string; size?: "sm" | "md"; disabled?: boolean }) {
  const { copied, copy } = useCopy();
  return (
    <Button
      size={size}
      variant={copied ? "primary" : "secondary"}
      onClick={() => copy(text)}
      disabled={disabled || text === ""}
      aria-live="polite"
    >
      {copied ? "✓ コピーしました" : label}
    </Button>
  );
}

/* ---------- Output ---------- */

export function Output({
  label,
  value,
  hint,
  rows = 8,
  wrap = true,
  actions,
  className,
}: {
  label?: React.ReactNode;
  value: string;
  hint?: React.ReactNode;
  rows?: number;
  wrap?: boolean;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex min-w-0 flex-col", className)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-bold">
          {label}
          {hint && <span className="ml-2 text-xs font-normal text-muted">{hint}</span>}
        </span>
        <span className="flex items-center gap-2">
          {actions}
          <CopyButton text={value} />
        </span>
      </div>
      <pre
        className={cx(
          "mono min-h-24 w-full overflow-auto rounded-xl border-2 border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink",
          wrap ? "whitespace-pre-wrap break-all" : "whitespace-pre",
        )}
        style={{ maxHeight: `${rows * 1.625 + 1.5}rem` }}
      >
        {value || <span className="text-muted/60">（結果がここに表示されます）</span>}
      </pre>
    </div>
  );
}

export function ValueLine({ label, value, mono = true }: { label: React.ReactNode; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border-2 border-line bg-card px-3 py-2 sm:flex-row sm:items-center sm:gap-3">
      <span className="w-40 shrink-0 text-xs font-bold text-muted">{label}</span>
      <span className={cx("min-w-0 flex-1 break-all text-sm", mono && "mono")}>{value || "—"}</span>
      <CopyButton text={value} />
    </div>
  );
}

export function ErrorBox({ title = "エラー", children }: { title?: string; children: React.ReactNode }) {
  return (
    <div role="alert" className="rounded-xl border-2 border-pop-red/40 bg-pop-red/10 px-4 py-3 text-sm text-pop-red">
      <div className="font-bold">⚠ {title}</div>
      <div className="mt-1 break-all text-ink">{children}</div>
    </div>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed text-muted">{children}</p>;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "ok" | "warn" | "bad" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
        tone === "neutral" && "bg-surface text-muted",
        tone === "ok" && "bg-pop-green/15 text-pop-green",
        tone === "warn" && "bg-pop-yellow/25 text-pop-yellow-deep",
        tone === "bad" && "bg-pop-red/15 text-pop-red",
      )}
    >
      {children}
    </span>
  );
}

/* ---------- Converter shell (input left, output right) ---------- */

export function ConverterShell({
  controls,
  input,
  onInput,
  output,
  error,
  onSwap,
  onClear,
  inputLabel = "入力",
  outputLabel = "結果",
  inputHint,
  outputHint,
  placeholder,
  rows = 10,
}: {
  controls?: React.ReactNode;
  input: string;
  onInput: (v: string) => void;
  output: string;
  error?: string | null;
  onSwap?: () => void;
  onClear?: () => void;
  inputLabel?: React.ReactNode;
  outputLabel?: React.ReactNode;
  inputHint?: React.ReactNode;
  outputHint?: React.ReactNode;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Card>
      <Row className="mb-4">
        {controls}
        <span className="ml-auto flex gap-2">
          {onSwap && (
            <Button size="sm" onClick={onSwap} disabled={!output || !!error}>
              ⇄ 結果を入力に移す
            </Button>
          )}
          {onClear && (
            <Button size="sm" variant="ghost" onClick={onClear}>
              クリア
            </Button>
          )}
        </span>
      </Row>
      <div className="grid gap-4 lg:grid-cols-2">
        <TextArea label={inputLabel} hint={inputHint} value={input} onChange={onInput} rows={rows} placeholder={placeholder} />
        <div className="flex flex-col gap-3">
          {error ? (
            <>
              <Label>{outputLabel}</Label>
              <ErrorBox>{error}</ErrorBox>
            </>
          ) : (
            <Output label={outputLabel} hint={outputHint} value={output} rows={rows} />
          )}
        </div>
      </div>
    </Card>
  );
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} バイト`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
