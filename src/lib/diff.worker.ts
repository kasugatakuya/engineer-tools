// esbuild で public/diff.worker.js に束ねられる（package.json の build:worker）
import { diffLines, type DiffOptions } from "./diff";

export interface DiffRequest {
  id: number;
  before: string;
  after: string;
  opts: DiffOptions;
}

self.onmessage = (e: MessageEvent<DiffRequest>) => {
  const { id, before, after, opts } = e.data;
  const result = diffLines(before, after, opts);
  (self as unknown as Worker).postMessage({ id, ...result });
};
