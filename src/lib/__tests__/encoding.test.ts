import { describe, expect, it } from "vitest";
import { base64Decode, base64Encode, htmlEscape, htmlUnescape, urlDecode, urlEncode } from "../encoding";

describe("base64", () => {
  it("round-trips UTF-8", () => {
    expect(base64Encode("こんにちは、Hello 世界！")).toBe("44GT44KT44Gr44Gh44Gv44CBSGVsbG8g5LiW55WM77yB");
    expect(base64Decode("44GT44KT44Gr44Gh44Gv44CBSGVsbG8g5LiW55WM77yB")).toBe("こんにちは、Hello 世界！");
  });
  it("supports url-safe and unpadded input", () => {
    expect(base64Encode("?>?", true)).toBe("Pz4_");
    expect(base64Decode("Pz4_")).toBe("?>?");
    expect(base64Decode(" Pz4/ ")).toBe("?>?");
  });
  it("rejects invalid input", () => {
    expect(() => base64Decode("!!!")).toThrow();
    expect(() => base64Decode("A")).toThrow();
  });
});

describe("url", () => {
  it("encodes per mode", () => {
    expect(urlEncode("検索 キーワード&sort=desc", "component")).toBe("%E6%A4%9C%E7%B4%A2%20%E3%82%AD%E3%83%BC%E3%83%AF%E3%83%BC%E3%83%89%26sort%3Ddesc");
    expect(urlEncode("https://x.jp/a b?q=あ", "uri")).toBe("https://x.jp/a%20b?q=%E3%81%82");
    expect(urlEncode("a b!", "form")).toBe("a+b%21");
  });
  it("decodes and reports malformed input", () => {
    expect(urlDecode("a+b%21", "form")).toBe("a b!");
    expect(() => urlDecode("%E", "component")).toThrow();
  });
});

describe("html entities", () => {
  it("escapes special characters", () => {
    expect(htmlEscape(`<a href="/s?q=a&b">'x'</a>`)).toBe("&lt;a href=&quot;/s?q=a&amp;b&quot;&gt;&#39;x&#39;&lt;/a&gt;");
    expect(htmlEscape("あ", true)).toBe("&#x3042;");
  });
  it("unescapes named and numeric references", () => {
    expect(htmlUnescape("&lt;p&gt;&#x3042;&#12354;&copy;&unknown;")).toBe("<p>ああ©&unknown;");
    expect(htmlUnescape("&foo;", (n) => (n === "foo" ? "F" : undefined))).toBe("F");
  });
});
