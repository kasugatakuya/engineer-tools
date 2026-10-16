import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-3xl border-2 border-line bg-card px-6 py-16 text-center">
      <div className="text-5xl">🫥</div>
      <h1 className="mt-4 font-display text-2xl font-extrabold">ページが見つかりません</h1>
      <p className="mt-2 text-sm text-muted">URLが間違っているか、ツールが存在しません。</p>
      <Link href="/" className="mt-6 inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-pop">
        ツール一覧へ戻る
      </Link>
    </div>
  );
}
