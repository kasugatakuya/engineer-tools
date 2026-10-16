/** 公開 URL。デプロイ先に合わせて NEXT_PUBLIC_SITE_URL を設定する（末尾スラッシュなし）。 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://engineer-tools.example.com").replace(/\/+$/, "");
