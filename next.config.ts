import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静的書き出し: サーバー不要。Vercel / Cloudflare Pages / GitHub Pages などにそのまま置ける
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
