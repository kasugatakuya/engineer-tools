import { describe, expect, it } from "vitest";
import { diffLines, inlineDiff } from "../diff";

const before = `function total(items) {\n  let sum = 0;\n  for (const item of items) {\n    sum += item.price * item.qty;\n  }\n  return sum;\n}\n\nexport default total;\n`;
const after = `function total(items, taxRate = 0.1) {\n  let sum = 0;\n  for (const item of items) {\n    sum += item.price * item.quantity;\n  }\n  return Math.round(sum * (1 + taxRate));\n}\n\nexport default total;\n`;

describe("diffLines", () => {
  it("pairs changed lines as replace rows", () => {
    const d = diffLines(before, after);
    expect(d.stats).toEqual({ added: 0, deleted: 0, changed: 3 });
    expect(d.rows).toHaveLength(9);
    expect(d.rows[0].type).toBe("replace");
  });

  it("supports context mode with skip rows", () => {
    const d = diffLines("a\nb\nc\nd\ne\nf\ng\n", "a\nb\nc\nX\ne\nf\ng\nh\n", { context: 1 });
    expect(d.rows[0]).toEqual({ type: "skip", count: 2 });
    expect(d.stats).toEqual({ added: 1, deleted: 0, changed: 1 });
  });

  it("ignores whitespace and case when asked", () => {
    const d = diffLines("Hello  World", "hello world", { ignoreCase: true, ignoreWhitespace: true });
    expect(d.rows[0].type).toBe("equal");
    expect(diffLines("Hello  World", "hello world").rows[0].type).toBe("replace");
  });

  it("handles empty inputs", () => {
    expect(diffLines("", "").rows).toHaveLength(0);
    expect(diffLines("", "a").stats.added).toBe(1);
    expect(diffLines("a\n", "").stats.deleted).toBe(1);
  });

  it("handles large inputs", () => {
    const a = Array.from({ length: 3000 }, (_, i) => `line ${i}`).join("\n");
    const b = a.replace("line 1500", "LINE 1500") + "\nextra";
    const d = diffLines(a, b);
    expect(d.stats).toEqual({ added: 1, deleted: 0, changed: 1 });
  });
});

describe("inlineDiff", () => {
  it("highlights only the changed tokens", () => {
    const r = inlineDiff("sum += item.price * item.qty;", "sum += item.price * item.quantity;");
    expect(r.rightSegs.some((s) => s.type === "insert" && s.text === "quantity")).toBe(true);
    expect(r.leftSegs.some((s) => s.type === "delete" && s.text === "qty")).toBe(true);
    expect(r.similarity).toBeGreaterThan(0.5);
  });

  it("tokenizes Japanese text per word run", () => {
    const r = inlineDiff("今日は晴れ", "今日は雨");
    expect(r.rightSegs).toEqual([{ type: "equal", text: "今日は" }, { type: "insert", text: "雨" }]);
    expect(r.leftSegs).toEqual([{ type: "equal", text: "今日は" }, { type: "delete", text: "晴れ" }]);
    const mixed = inlineDiff("userName を更新", "userId を更新");
    expect(mixed.rightSegs[0]).toEqual({ type: "insert", text: "userId" });
  });
});
