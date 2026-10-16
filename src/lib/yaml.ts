import YAML, { YAMLParseError } from "yaml";

export interface YamlError {
  message: string;
  line?: number;
  column?: number;
}

export function yamlToValue(text: string): { ok: true; value: unknown; docs: number } | { ok: false; error: YamlError } {
  try {
    const docs = YAML.parseAllDocuments(text, { prettyErrors: true });
    const values: unknown[] = [];
    for (const doc of docs) {
      if (doc.errors.length > 0) {
        const err = doc.errors[0];
        const pos = err.linePos?.[0];
        return { ok: false, error: { message: err.message, line: pos?.line, column: pos?.col } };
      }
      values.push(doc.toJS());
    }
    if (values.length === 0) return { ok: true, value: null, docs: 0 };
    if (values.length === 1) return { ok: true, value: values[0], docs: 1 };
    return { ok: true, value: values, docs: values.length };
  } catch (e) {
    if (e instanceof YAMLParseError) {
      const pos = e.linePos?.[0];
      return { ok: false, error: { message: e.message, line: pos?.line, column: pos?.col } };
    }
    return { ok: false, error: { message: e instanceof Error ? e.message : String(e) } };
  }
}

export function valueToYaml(value: unknown, indent = 2): string {
  return YAML.stringify(value, { indent, lineWidth: 0 });
}
