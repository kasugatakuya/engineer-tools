import { describe, expect, it } from "vitest";
import { csvToJson, jsonToCsv } from "../csv";
import { formatJson, minifyJson, parseJson } from "../json";
import { valueToYaml, yamlToValue } from "../yaml";

describe("json", () => {
  it("formats with sorted keys", () => {
    const r = parseJson('{"b":1,"a":[1,2]}');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(formatJson(r.value, 2, true)).toBe('{\n  "a": [\n    1,\n    2\n  ],\n  "b": 1\n}');
      expect(minifyJson(r.value, false)).toBe('{"b":1,"a":[1,2]}');
    }
  });
  it("reports position and hint on error", () => {
    const r = parseJson('{"a":1,}');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.line).toBe(1);
      expect(r.error.hint).toContain("カンマ");
    }
  });
});

describe("yaml", () => {
  it("converts both ways", () => {
    const y = yamlToValue("name: app\nlist:\n  - 1\n  - two\n");
    expect(y.ok && y.value).toEqual({ name: "app", list: [1, "two"] });
    expect(valueToYaml({ a: 1, b: ["x", "y"] })).toBe("a: 1\nb:\n  - x\n  - y\n");
  });
  it("reports errors", () => {
    expect(yamlToValue("a: [1, 2\n").ok).toBe(false);
  });
});

describe("csv", () => {
  const opts = { delimiter: "auto" as const, header: true, trim: true, convertTypes: true, emptyAsNull: true };
  it("parses quoted fields and converts types", () => {
    const csv = 'name,age,active,note\n"Tanaka, Taro",30,true,"says ""hi"""\nSuzuki,,false,\n';
    expect(csvToJson(csv, opts).data).toEqual([
      { name: "Tanaka, Taro", age: 30, active: true, note: 'says "hi"' },
      { name: "Suzuki", age: null, active: false, note: null },
    ]);
  });
  it("auto-detects tabs", () => {
    expect(csvToJson("a\tb\n1\t2", { ...opts, convertTypes: false }).data).toEqual([{ a: "1", b: "2" }]);
  });
  it("serializes objects back to csv", () => {
    expect(jsonToCsv([{ a: "x,y", b: 1 }, { a: null, c: true }], ",")).toBe("a,b,c\n\"x,y\",1,\n,,true");
    expect(() => jsonToCsv(42, ",")).toThrow();
  });
});
