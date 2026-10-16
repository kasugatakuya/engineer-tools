"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ACCENT_CLASSES, GROUPS, SITE_NAME, TOOLS } from "@/lib/tools";
import { cx } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The drawer is "open" only for the path it was opened on, so navigating closes it.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (v: boolean) => setOpenAt(v ? pathname : null);

  return (
    <div className="min-h-screen lg:flex">
      {/* mobile header */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b-2 border-line bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="メニューを開く"
          className="grid size-10 place-items-center rounded-xl border-2 border-line bg-card text-xl active:scale-95"
        >
          ☰
        </button>
        <Link href="/" className="font-display text-lg font-extrabold tracking-tight">
          🧰 {SITE_NAME}
        </Link>
        <span className="ml-auto">
          <ThemeToggle />
        </span>
      </header>

      {open && (
        <button
          type="button"
          aria-label="メニューを閉じる"
          className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r-2 border-line bg-card transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link href="/" className="flex items-center gap-3 px-5 pb-4 pt-6">
          <span className="grid size-11 place-items-center rounded-2xl bg-brand text-2xl shadow-pop">🧰</span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-extrabold">{SITE_NAME}</span>
            <span className="block text-xs font-medium text-muted">engineer-tools</span>
          </span>
        </Link>
        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          {GROUPS.map((group) => (
            <div key={group} className="mb-4">
              <div className="px-3 pb-1 pt-2 text-[11px] font-bold tracking-wider text-muted">{group}</div>
              <ul className="space-y-0.5">
                {TOOLS.filter((t) => t.group === group).map((tool) => {
                  const active = pathname === `/tools/${tool.slug}`;
                  const accent = ACCENT_CLASSES[tool.accent];
                  return (
                    <li key={tool.slug}>
                      <Link
                        href={`/tools/${tool.slug}`}
                        className={cx(
                          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition",
                          active ? "bg-brand/10 text-brand-deep" : "text-ink hover:bg-surface",
                        )}
                      >
                        <span className={cx("grid size-8 shrink-0 place-items-center rounded-lg text-base", accent.soft)}>
                          {tool.emoji}
                        </span>
                        <span>{tool.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-3 border-t-2 border-line px-5 py-4 text-xs leading-relaxed text-muted">
          <span className="flex-1">すべての処理はブラウザ内で完結します。入力内容は外部に送信されません。</span>
          <span className="hidden lg:block">
            <ThemeToggle />
          </span>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
