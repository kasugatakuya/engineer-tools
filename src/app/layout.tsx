import type { Metadata } from "next";
import { Geist_Mono, M_PLUS_Rounded_1c, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Shell } from "@/components/Shell";
import { SITE_NAME } from "@/lib/tools";

const body = Noto_Sans_JP({
  variable: "--font-body",
  subsets: ["latin"],
  preload: false,
});

const display = M_PLUS_Rounded_1c({
  variable: "--font-display",
  weight: ["500", "700", "800"],
  subsets: ["latin"],
  preload: false,
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} | engineer-tools`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "差分比較・Base64・URLエンコード・JSON整形・JWTデコード・Unix時間・ハッシュ・UUID・正規表現など、エンジニアがよく使うツールをブラウザ内だけで処理します。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" suppressHydrationWarning className={`${body.variable} ${display.variable} ${mono.variable} h-full`}>
      <body className="min-h-full">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <Shell>{children}</Shell>
        </ThemeProvider>
      </body>
    </html>
  );
}
