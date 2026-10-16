import { expect, test } from "@playwright/test";
import path from "node:path";

const FIXTURE = path.join(__dirname, "fixtures", "sample.png");

test("トップページから各ツールへ移動できる", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("エンジニア道具箱");
  await page.locator("main").getByRole("link", { name: /差分比較/ }).click();
  await expect(page).toHaveURL(/\/tools\/diff/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("差分比較");
});

test("差分比較: 変更行と変わった語が強調される", async ({ page }) => {
  await page.goto("/tools/diff");
  await expect(page.getByText("変更 3 行")).toBeVisible();
  await expect(page.locator("mark", { hasText: "quantity" })).toBeVisible();
  await page.getByRole("radio", { name: "上下" }).click();
  await expect(page.locator("td", { hasText: /^-$/ }).first()).toBeVisible();
});

test("差分比較: 大きな入力は Web Worker で計算される", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/tools/diff");
  const lines = Array.from({ length: 1500 }, (_, i) => `const value${i} = compute(${i});`);
  const before = lines.join("\n");
  const after = [...lines.slice(0, 700), "const inserted = true;", ...lines.slice(700)].join("\n").replace("compute(10)", "compute(99)");
  await page.getByLabel("変更前").fill(before);
  await page.getByLabel("変更後").fill(after);
  await expect(page.getByText("追加 1 行")).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("変更 1 行")).toBeVisible();
  await expect(page.getByText("計算中…")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("Base64: エンコードして結果を入力に移すと元に戻る", async ({ page }) => {
  await page.goto("/tools/base64");
  await expect(page.locator("pre")).toHaveText("44GT44KT44Gr44Gh44Gv44CBSGVsbG8g5LiW55WM77yB");
  await page.getByRole("button", { name: "結果を入力に移す" }).click();
  await expect(page.locator("pre")).toHaveText("こんにちは、Hello 世界！");
});

test("JSON整形: 構文エラーの位置とヒントを表示する", async ({ page }) => {
  await page.goto("/tools/json");
  await page.locator("textarea").fill('{"a": 1,}');
  const alert = page.getByRole("alert").first();
  await expect(alert).toContainText("1 行目");
  await expect(alert).toContainText("末尾のカンマ");
});

test("JWT: 有効期限とクレームを表示する", async ({ page }) => {
  await page.goto("/tools/jwt");
  await expect(page.getByText("alg: HS256")).toBeVisible();
  await expect(page.getByText("user-1024").first()).toBeVisible();
});

test("ハッシュ: SHA-256 を計算する", async ({ page }) => {
  await page.goto("/tools/hash");
  await expect(page.getByText("b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9")).toBeVisible();
  await expect(page.getByText("5eb63bbbe01eeed093cb22bb8f5acdc3")).toBeVisible();
});

test("画像形式変換: PNG を WebP と JPEG に変換してダウンロードできる", async ({ page }) => {
  await page.goto("/tools/image");
  await page.setInputFiles('input[type="file"]', FIXTURE);
  await expect(page.getByText("→ WebP")).toBeVisible();
  await page.getByRole("radio", { name: "JPEG" }).click();
  await expect(page.getByText("→ JPEG")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "ダウンロード" }).first().click();
  expect((await download).suggestedFilename()).toBe("sample.jpg");
});

test("カラーコード: CSS の色名を変換する", async ({ page }) => {
  await page.goto("/tools/color");
  await page.getByPlaceholder(/#ff6b9d/).fill("tomato");
  await expect(page.getByText("#ff6347").first()).toBeVisible();
});

test("ダークモードに切り替えられる", async ({ page }) => {
  await page.goto("/tools/uuid");
  await page.getByRole("button", { name: "ダークモードに切り替え" }).first().click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("横スクロールが発生しない", async ({ page }) => {
  for (const slug of ["diff", "unixtime", "regex", "csv"]) {
    await page.goto(`/tools/${slug}`);
    const [scrollWidth, innerWidth] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(scrollWidth, slug).toBeLessThanOrEqual(innerWidth);
  }
});
