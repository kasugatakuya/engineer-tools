export type Op = "equal" | "insert" | "delete";

export interface Segment {
  type: Op;
  text: string;
}

export type DiffRow =
  | {
      type: "equal" | "replace";
      leftNo: number;
      rightNo: number;
      left: string;
      right: string;
      leftSegs?: Segment[];
      rightSegs?: Segment[];
    }
  | { type: "delete"; leftNo: number; left: string }
  | { type: "insert"; rightNo: number; right: string }
  | { type: "skip"; count: number };

export interface DiffOptions {
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
  context?: number | null;
}

export interface DiffStats {
  added: number;
  deleted: number;
  changed: number;
}

interface EditOp<T> {
  type: Op;
  a?: T;
  b?: T;
}

/** Myers O(ND) diff on two arrays. */
export function diffArrays<T>(
  a: readonly T[],
  b: readonly T[],
  eq: (x: T, y: T) => boolean = (x, y) => x === y,
): EditOp<T>[] {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  if (max === 0) return [];
  const offset = max + 1;
  const size = 2 * max + 3;
  let v = new Int32Array(size);
  const trace: Int32Array[] = [];
  let found = false;

  outer: for (let d = 0; d <= max; d++) {
    trace.push(v);
    const next = new Int32Array(v);
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) {
        x = v[offset + k + 1];
      } else {
        x = v[offset + k - 1] + 1;
      }
      let y = x - k;
      while (x < n && y < m && eq(a[x], b[y])) {
        x++;
        y++;
      }
      next[offset + k] = x;
      if (x >= n && y >= m) {
        found = true;
        v = next;
        break outer;
      }
    }
    v = next;
  }
  if (!found) return [];

  // backtrack
  const ops: EditOp<T>[] = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d >= 0; d--) {
    const vd = trace[d];
    const k = x - y;
    let prevK: number;
    if (k === -d || (k !== d && vd[offset + k - 1] < vd[offset + k + 1])) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }
    const prevX = d === 0 ? 0 : vd[offset + prevK];
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      ops.push({ type: "equal", a: a[x - 1], b: b[y - 1] });
      x--;
      y--;
    }
    if (d > 0) {
      if (x === prevX) {
        ops.push({ type: "insert", b: b[y - 1] });
        y--;
      } else {
        ops.push({ type: "delete", a: a[x - 1] });
        x--;
      }
    }
  }
  ops.reverse();
  return ops;
}

function normalizeLine(line: string, opts: DiffOptions): string {
  let s = line;
  if (opts.ignoreWhitespace) s = s.replace(/\s+/g, " ").trim();
  if (opts.ignoreCase) s = s.toLowerCase();
  return s;
}

// CJK characters are compared one by one (Japanese has no spaces between words);
// other letters/digits are grouped into word runs.
const CJK = "\\p{sc=Han}\\p{sc=Hiragana}\\p{sc=Katakana}ー";
const TOKEN_RE = new RegExp(`[${CJK}]|(?:(?![${CJK}])[\\p{L}\\p{N}_])+|\\s+|[^\\p{L}\\p{N}_\\s]`, "gu");

export function tokenize(s: string): string[] {
  return s.match(TOKEN_RE) ?? [];
}

/** Inline (word level) diff of two lines. Returns segments for left and right. */
export function inlineDiff(
  left: string,
  right: string,
  opts: DiffOptions = {},
): { leftSegs: Segment[]; rightSegs: Segment[]; similarity: number } {
  const ta = tokenize(left);
  const tb = tokenize(right);
  const norm = (t: string) => normalizeLine(t, opts);
  const ops = diffArrays(ta, tb, (x, y) => norm(x) === norm(y));
  const leftSegs: Segment[] = [];
  const rightSegs: Segment[] = [];
  let equalChars = 0;
  const push = (arr: Segment[], type: Op, text: string) => {
    const last = arr[arr.length - 1];
    if (last && last.type === type) last.text += text;
    else arr.push({ type, text });
  };
  for (const op of ops) {
    if (op.type === "equal") {
      push(leftSegs, "equal", op.a as string);
      push(rightSegs, "equal", op.b as string);
      equalChars += (op.a as string).length;
    } else if (op.type === "delete") {
      push(leftSegs, "delete", op.a as string);
    } else {
      push(rightSegs, "insert", op.b as string);
    }
  }
  const total = Math.max(left.length, right.length, 1);
  return { leftSegs, rightSegs, similarity: equalChars / total };
}

export function splitLines(text: string): string[] {
  if (text === "") return [];
  const lines = text.split(/\r\n|\r|\n/);
  if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

export function diffLines(
  before: string,
  after: string,
  opts: DiffOptions = {},
): { rows: DiffRow[]; stats: DiffStats } {
  const a = splitLines(before);
  const b = splitLines(after);
  const na = a.map((l) => normalizeLine(l, opts));
  const nb = b.map((l) => normalizeLine(l, opts));
  const idxA = a.map((_, i) => i);
  const idxB = b.map((_, i) => i);
  const ops = diffArrays(idxA, idxB, (i, j) => na[i] === nb[j]);

  const rows: DiffRow[] = [];
  const stats: DiffStats = { added: 0, deleted: 0, changed: 0 };
  let dels: number[] = [];
  let ins: number[] = [];

  const flush = () => {
    const pairs = Math.min(dels.length, ins.length);
    for (let i = 0; i < pairs; i++) {
      const li = dels[i];
      const ri = ins[i];
      const { leftSegs, rightSegs, similarity } = inlineDiff(a[li], b[ri], opts);
      const useInline = similarity >= 0.3;
      rows.push({
        type: "replace",
        leftNo: li + 1,
        rightNo: ri + 1,
        left: a[li],
        right: b[ri],
        leftSegs: useInline ? leftSegs : undefined,
        rightSegs: useInline ? rightSegs : undefined,
      });
      stats.changed++;
    }
    for (let i = pairs; i < dels.length; i++) {
      rows.push({ type: "delete", leftNo: dels[i] + 1, left: a[dels[i]] });
      stats.deleted++;
    }
    for (let i = pairs; i < ins.length; i++) {
      rows.push({ type: "insert", rightNo: ins[i] + 1, right: b[ins[i]] });
      stats.added++;
    }
    dels = [];
    ins = [];
  };

  for (const op of ops) {
    if (op.type === "equal") {
      flush();
      const li = op.a as number;
      const ri = op.b as number;
      rows.push({
        type: "equal",
        leftNo: li + 1,
        rightNo: ri + 1,
        left: a[li],
        right: b[ri],
      });
    } else if (op.type === "delete") {
      dels.push(op.a as number);
    } else {
      ins.push(op.b as number);
    }
  }
  flush();

  const context = opts.context;
  if (context == null || context < 0) return { rows, stats };

  // context filtering
  const keep = new Array<boolean>(rows.length).fill(false);
  rows.forEach((r, i) => {
    if (r.type !== "equal") {
      for (let j = Math.max(0, i - context); j <= Math.min(rows.length - 1, i + context); j++) {
        keep[j] = true;
      }
    }
  });
  const out: DiffRow[] = [];
  let skipped = 0;
  rows.forEach((r, i) => {
    if (keep[i]) {
      if (skipped > 0) {
        out.push({ type: "skip", count: skipped });
        skipped = 0;
      }
      out.push(r);
    } else {
      skipped++;
    }
  });
  if (skipped > 0) out.push({ type: "skip", count: skipped });
  return { rows: out, stats };
}
