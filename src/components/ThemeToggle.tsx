"use client";

import { useTheme } from "next-themes";
import { useHydrated } from "@/components/hooks";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const dark = hydrated && resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
      title={dark ? "ライトモード" : "ダークモード"}
      className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-line bg-card text-lg transition hover:border-line-strong hover:bg-surface active:scale-95"
    >
      {hydrated ? (dark ? "☀️" : "🌙") : ""}
    </button>
  );
}
