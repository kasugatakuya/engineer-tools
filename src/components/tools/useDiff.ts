"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { diffLines, type DiffOptions, type DiffRow, type DiffStats } from "@/lib/diff";

export interface DiffResult {
  rows: DiffRow[];
  stats: DiffStats;
}

/** Inputs above this size are diffed in a Web Worker so typing never freezes the page. */
export const WORKER_THRESHOLD = 20_000;
const DEBOUNCE_MS = 150;

const EMPTY: DiffResult = { rows: [], stats: { added: 0, deleted: 0, changed: 0 } };

export function useDiff(before: string, after: string, opts: DiffOptions): { result: DiffResult; pending: boolean } {
  const large = before.length + after.length > WORKER_THRESHOLD;
  const optsKey = `${opts.ignoreWhitespace ? 1 : 0}${opts.ignoreCase ? 1 : 0}${opts.context ?? "n"}`;

  // small inputs: synchronous, no flicker
  const syncResult = useMemo(
    () => (large ? null : diffLines(before, after, opts)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [large, before, after, optsKey],
  );

  const workerRef = useRef<Worker | null>(null);
  const seq = useRef(0);
  const [workerResult, setWorkerResult] = useState<{ key: string; value: DiffResult } | null>(null);
  const requestKey = `${before.length}:${after.length}:${optsKey}:${before.slice(0, 64)}:${after.slice(0, 64)}`;

  useEffect(() => {
    if (!large) return;
    if (typeof Worker === "undefined") return;
    const timer = setTimeout(() => {
      if (!workerRef.current) {
        // public/diff.worker.js は `npm run build:worker`（dev/build 前に自動実行）で esbuild が生成する
        workerRef.current = new Worker("/diff.worker.js");
      }
      const worker = workerRef.current;
      const id = ++seq.current;
      const handler = (e: MessageEvent<{ id: number } & DiffResult>) => {
        if (e.data.id !== id) return;
        setWorkerResult({ key: requestKey, value: { rows: e.data.rows, stats: e.data.stats } });
        worker.removeEventListener("message", handler);
      };
      worker.addEventListener("message", handler);
      worker.postMessage({ id, before, after, opts });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [large, before, after, optsKey]);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    [],
  );

  if (!large) return { result: syncResult ?? EMPTY, pending: false };
  const fresh = workerResult?.key === requestKey;
  return { result: workerResult?.value ?? EMPTY, pending: !fresh };
}
