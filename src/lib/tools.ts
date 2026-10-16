export type Accent = "pink" | "orange" | "yellow" | "green" | "sky" | "violet" | "teal" | "red";

export interface ToolMeta {
  slug: string;
  name: string;
  en: string;
  description: string;
  emoji: string;
  accent: Accent;
  group: string;
}

export const GROUPS = ["テキスト", "変換", "解析", "生成・計算", "画像・色"] as const;

export const TOOLS: ToolMeta[] = [
  { slug: "diff", name: "差分比較", en: "Diff", emoji: "🔍", accent: "pink", group: "テキスト", description: "2つのテキストを行単位で比較し、変わった語だけを強調します。" },
  { slug: "regex", name: "正規表現テスター", en: "Regex Tester", emoji: "🎯", accent: "red", group: "テキスト", description: "一致箇所の強調、キャプチャグループ、置換結果を確認できます。" },
  { slug: "base64", name: "Base64", en: "Base64", emoji: "🔤", accent: "sky", group: "変換", description: "UTF-8テキストをBase64にエンコード・デコードします。URLセーフ形式にも対応。" },
  { slug: "url", name: "URLエンコード", en: "URL Encode", emoji: "🔗", accent: "teal", group: "変換", description: "パーセントエンコードの変換。用途に合わせて方式を選べます。" },
  { slug: "html-entity", name: "HTMLエンティティ", en: "HTML Entity", emoji: "🏷️", accent: "orange", group: "変換", description: "< や & などの特殊文字をエスケープ・アンエスケープします。" },
  { slug: "yaml", name: "YAML ⇄ JSON", en: "YAML / JSON", emoji: "🔁", accent: "violet", group: "変換", description: "YAMLとJSONを相互に変換します。構文エラーは位置つきで表示します。" },
  { slug: "csv", name: "CSV ⇄ JSON", en: "CSV / JSON", emoji: "📊", accent: "green", group: "変換", description: "CSV/TSVをJSONに、JSONをCSVに変換します。区切り文字は自動判定。" },
  { slug: "json", name: "JSON整形", en: "JSON Format", emoji: "🧹", accent: "yellow", group: "解析", description: "整形と圧縮、キーの並べ替え、構文エラーの理由表示に対応。" },
  { slug: "jwt", name: "JWTデコード", en: "JWT Decode", emoji: "🎫", accent: "violet", group: "解析", description: "ヘッダーとペイロードを表示し、有効期限を日時で確認できます。" },
  { slug: "unixtime", name: "Unix時間", en: "Unix Time", emoji: "⏱️", accent: "sky", group: "解析", description: "秒・ミリ秒を自動判定して日時に変換。JST/UTCの相互変換も。" },
  { slug: "hash", name: "ハッシュ", en: "Hash", emoji: "🔐", accent: "green", group: "生成・計算", description: "MD5・SHA-1・SHA-256・SHA-384・SHA-512を一度に計算。ファイルも可。" },
  { slug: "hmac", name: "HMAC", en: "HMAC", emoji: "🗝️", accent: "orange", group: "生成・計算", description: "秘密鍵つきのハッシュ（HMAC-MD5 / SHA-1 / SHA-256 など）を計算します。" },
  { slug: "uuid", name: "UUID生成", en: "UUID", emoji: "🎲", accent: "pink", group: "生成・計算", description: "暗号論的乱数でUUID v4 / v7をまとめて生成します。" },
  { slug: "image", name: "画像形式変換", en: "Image Convert", emoji: "🖼️", accent: "teal", group: "画像・色", description: "PNG・JPEG・WebPの相互変換とリサイズ。ブラウザ内で完結します。" },
  { slug: "color", name: "カラーコード", en: "Color Code", emoji: "🎨", accent: "red", group: "画像・色", description: "HEX・RGB・HSL・HSV・CMYKの相互変換とコントラスト比の確認。" },
];

export const TOOL_MAP: Record<string, ToolMeta> = Object.fromEntries(TOOLS.map((t) => [t.slug, t]));

export const ACCENT_CLASSES: Record<Accent, { bg: string; soft: string; text: string; border: string }> = {
  pink: { bg: "bg-pop-pink", soft: "bg-pop-pink/15", text: "text-pop-pink", border: "border-pop-pink" },
  orange: { bg: "bg-pop-orange", soft: "bg-pop-orange/15", text: "text-pop-orange", border: "border-pop-orange" },
  yellow: { bg: "bg-pop-yellow", soft: "bg-pop-yellow/20", text: "text-pop-yellow-deep", border: "border-pop-yellow" },
  green: { bg: "bg-pop-green", soft: "bg-pop-green/15", text: "text-pop-green", border: "border-pop-green" },
  sky: { bg: "bg-pop-sky", soft: "bg-pop-sky/15", text: "text-pop-sky", border: "border-pop-sky" },
  violet: { bg: "bg-pop-violet", soft: "bg-pop-violet/15", text: "text-pop-violet", border: "border-pop-violet" },
  teal: { bg: "bg-pop-teal", soft: "bg-pop-teal/15", text: "text-pop-teal", border: "border-pop-teal" },
  red: { bg: "bg-pop-red", soft: "bg-pop-red/15", text: "text-pop-red", border: "border-pop-red" },
};

export const SITE_NAME = "エンジニア道具箱";
