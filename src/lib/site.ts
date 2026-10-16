/**
 * 公開 URL（末尾スラッシュなし）。サイトマップ・robots.txt・canonical に使う。
 *
 * 優先順位:
 *   1. NEXT_PUBLIC_SITE_URL（明示指定。独自ドメインならこれを設定する）
 *   2. Vercel が自動で入れる本番ドメイン (VERCEL_PROJECT_PRODUCTION_URL)
 *   3. Cloudflare Pages が自動で入れる URL (CF_PAGES_URL)
 *   4. 仮のドメイン（この場合は Search Console にサイトマップを登録できない）
 */
const PLACEHOLDER = "https://engineer-tools.example.com";

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  const cf = process.env.CF_PAGES_URL;
  if (cf) return cf;
  if (process.env.NODE_ENV === "production") {
    console.warn(
      `[engineer-tools] NEXT_PUBLIC_SITE_URL が未設定のため、サイトマップと canonical に仮ドメイン ${PLACEHOLDER} を使います。公開 URL を環境変数で指定してください。`,
    );
  }
  return PLACEHOLDER;
}

export const SITE_URL = resolveSiteUrl().replace(/\/+$/, "");
export const SITE_URL_IS_PLACEHOLDER = SITE_URL === PLACEHOLDER;
