import type { Metadata } from "next";
import Link from "next/link";
import { ACCENT_CLASSES, GROUPS, SITE_NAME, TOOLS } from "@/lib/tools";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <div>
      <section className="dot-grid mb-8 rounded-3xl border-2 border-line bg-card px-6 py-10 sm:px-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand-deep">
          🔒 すべてブラウザ内で処理・外部送信なし
        </div>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          {SITE_NAME}
          <span className="ml-3 text-base font-bold text-muted">engineer-tools</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
          差分比較、エンコード・デコード、JSON整形、JWT、Unix時間、ハッシュ、UUID、正規表現、画像変換、カラーコード。
          エンジニアが毎日使う小さな道具を {TOOLS.length} 個そろえました。どのツールも最初から例が入っています。
        </p>
      </section>

      {GROUPS.map((group) => (
        <section key={group} className="mb-8">
          <h2 className="mb-3 font-display text-lg font-extrabold">{group}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {TOOLS.filter((t) => t.group === group).map((tool) => {
              const accent = ACCENT_CLASSES[tool.accent];
              return (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="group flex gap-4 rounded-2xl border-2 border-line bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-pop"
                >
                  <span className={`grid size-12 shrink-0 place-items-center rounded-xl text-2xl ${accent.soft}`}>{tool.emoji}</span>
                  <span className="min-w-0">
                    <span className="block font-display text-base font-extrabold group-hover:text-brand-deep">
                      {tool.name}
                      <span className="ml-2 text-xs font-bold text-muted">{tool.en}</span>
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">{tool.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
