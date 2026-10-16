# エンジニア道具箱 (engineer-tools)

エンジニアがよく使う小さなツールを 1 つにまとめた Web アプリです。
すべての処理はブラウザ内で完結し、入力内容は外部に送信されません。

## ツール一覧

| 分類 | ツール | 内容 |
| --- | --- | --- |
| テキスト | 差分比較 | 行単位の比較、変わった語だけを強調、空白/大文字小文字の無視、前後 2 行だけ表示、左右/上下表示 |
| テキスト | 正規表現テスター | 一致の強調、キャプチャグループ（名前付き含む）、置換プレビュー |
| 変換 | Base64 | UTF-8 対応、URL セーフ形式 |
| 変換 | URL エンコード | encodeURIComponent / encodeURI / フォーム形式 |
| 変換 | HTML エンティティ | エスケープ、アンエスケープ（数値参照・名前付き参照） |
| 変換 | YAML ⇄ JSON | 相互変換、エラー位置の表示 |
| 変換 | CSV ⇄ JSON | 区切り文字の自動判定、ヘッダー、型変換 |
| 解析 | JSON 整形 | 整形・圧縮・キーの並べ替え・エラー理由のヒント |
| 解析 | JWT デコード | ヘッダー/ペイロード、exp などの日時化と期限判定（署名検証なし） |
| 解析 | Unix 時間 | 秒/ミリ秒の自動判定、UTC/JST/任意タイムゾーン、日時→タイムスタンプ |
| 生成・計算 | ハッシュ | MD5 / SHA-1 / SHA-256 / SHA-384 / SHA-512（テキスト・ファイル） |
| 生成・計算 | HMAC | HMAC-MD5 / SHA-1 / SHA-256 / SHA-384 / SHA-512 |
| 生成・計算 | UUID 生成 | v4 / v7、まとめて生成 |
| 画像・色 | 画像形式変換 | PNG / JPEG / WebP（対応ブラウザでは AVIF）への変換、品質、リサイズ |
| 画像・色 | カラーコード | HEX / RGB / HSL / HSV / CMYK、コントラスト比、バリエーション |

## 開発

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 静的書き出し → out/
npm start          # out/ をローカル配信して確認
npm run lint       # ESLint
npm run typecheck  # tsc
npm test           # Vitest（lib/ のロジックテスト）
npm run e2e        # Playwright（ビルドして out/ を配信し、デスクトップ + モバイルで確認）
```

初回の E2E 実行前に `npx playwright install chromium` でブラウザを入れてください。

## 公開（ホスティング）

`output: "export"` で `out/` に静的ファイルを書き出すので、サーバーは不要です。

- Vercel: リポジトリを import するだけ（Framework: Next.js が自動検出され、`out/` が配信されます）
- Cloudflare Pages: Build command `npm run build`、Output directory `out`
- その他（GitHub Pages、S3、nginx など）: `out/` の中身をそのまま置く

各ツールは `/tools/base64` のような独立 URL とタイトル・説明文を持つため、検索から直接たどり着けます。

## ダークモード

右下（スマホでは右上）のボタンで切り替えられます。`next-themes` で `html` に `dark` クラスを付け、色はすべて `globals.css` の CSS 変数で定義しているため、ライト/ダークの両方を 1 か所で調整できます。

## 構成

- `src/lib/` … 各ツールの純粋なロジック（UI に依存しない。`__tests__/` に Vitest のテスト）
- `src/lib/diff.worker.ts` … 大きな入力（合計 2 万文字超）の差分計算を Web Worker で行う
- `src/components/tools/` … 各ツールの画面
- `src/components/ui.tsx` … 共通 UI 部品
- `src/lib/tools.ts` … ツール一覧（メニュー・トップページ・ルーティングの元データ）
- `e2e/` … Playwright の E2E テスト

新しいツールを追加するには `src/lib/tools.ts` に定義を追加し、`src/components/tools/index.tsx` にコンポーネントを登録します。

## 技術

Next.js 16 (App Router, 静的書き出し) / React 19 / TypeScript / Tailwind CSS v4 / next-themes / [yaml](https://github.com/eemeli/yaml) / Vitest / Playwright
