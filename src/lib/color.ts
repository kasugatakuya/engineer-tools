export interface RGB { r: number; g: number; b: number; a: number }
export interface HSL { h: number; s: number; l: number }
export interface HSV { h: number; s: number; v: number }
export interface CMYK { c: number; m: number; y: number; k: number }

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function parseAlpha(s: string | undefined): number {
  if (s == null || s === "") return 1;
  const t = s.trim();
  if (t.endsWith("%")) return clamp(parseFloat(t) / 100, 0, 1);
  return clamp(parseFloat(t), 0, 1);
}

function parseChannel(s: string, max: number): number {
  const t = s.trim();
  if (t.endsWith("%")) return clamp((parseFloat(t) / 100) * max, 0, max);
  return clamp(parseFloat(t), 0, max);
}

function parseHue(s: string): number {
  const t = s.trim().toLowerCase();
  let v = parseFloat(t);
  if (t.endsWith("rad")) v = (v * 180) / Math.PI;
  else if (t.endsWith("turn")) v = v * 360;
  else if (t.endsWith("grad")) v = v * 0.9;
  return ((v % 360) + 360) % 360;
}

/** Parses #hex, rgb(), rgba(), hsl(), hsla(). Returns null when not recognized. */
export function parseColor(input: string): RGB | null {
  const s = input.trim();
  const hex = /^#?([0-9a-fA-F]{3,8})$/.exec(s);
  if (hex) {
    const h = hex[1];
    if (h.length === 3 || h.length === 4) {
      const [r, g, b, a] = h.split("").map((c) => parseInt(c + c, 16));
      return { r, g, b, a: h.length === 4 ? a / 255 : 1 };
    }
    if (h.length === 6 || h.length === 8) {
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
      return { r, g, b, a };
    }
    return null;
  }
  const fn = /^(rgba?|hsla?)\(\s*([^)]+)\)$/i.exec(s);
  if (fn) {
    const name = fn[1].toLowerCase();
    const body = fn[2].trim();
    let parts: string[];
    let alpha: string | undefined;
    if (body.includes(",")) {
      parts = body.split(",").map((p) => p.trim());
      alpha = parts[3];
    } else {
      const [main, a] = body.split("/").map((p) => p.trim());
      parts = main.split(/\s+/);
      alpha = a;
    }
    if (parts.length < 3) return null;
    if (name.startsWith("rgb")) {
      const r = parseChannel(parts[0], 255);
      const g = parseChannel(parts[1], 255);
      const b = parseChannel(parts[2], 255);
      if ([r, g, b].some(Number.isNaN)) return null;
      return { r, g, b, a: parseAlpha(alpha) };
    }
    const h = parseHue(parts[0]);
    const sat = parseChannel(parts[1], 100);
    const l = parseChannel(parts[2], 100);
    if ([h, sat, l].some(Number.isNaN)) return null;
    return { ...hslToRgb({ h, s: sat, l }), a: parseAlpha(alpha) };
  }
  return null;
}

export function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: HSL): { r: number; g: number; b: number } {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb: [number, number, number];
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const m = ln - c / 2;
  return { r: (rgb[0] + m) * 255, g: (rgb[1] + m) * 255, b: (rgb[2] + m) * 255 };
}

export function rgbToHsv({ r, g, b }: { r: number; g: number; b: number }): HSV {
  const { h } = rgbToHsl({ r, g, b });
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const v = max;
  const s = max === 0 ? 0 : (max - min) / max;
  return { h, s: s * 100, v: v * 100 };
}

export function rgbToCmyk({ r, g, b }: { r: number; g: number; b: number }): CMYK {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: ((1 - rn - k) / (1 - k)) * 100,
    m: ((1 - gn - k) / (1 - k)) * 100,
    y: ((1 - bn - k) / (1 - k)) * 100,
    k: k * 100,
  };
}

const hex2 = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0");

export function toHex(c: RGB, withAlpha = false): string {
  const base = `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;
  return withAlpha || c.a < 1 ? `${base}${hex2(c.a * 255)}` : base;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function toRgbString(c: RGB): string {
  const r = Math.round(c.r);
  const g = Math.round(c.g);
  const b = Math.round(c.b);
  return c.a < 1 ? `rgba(${r}, ${g}, ${b}, ${r1(c.a) === c.a ? c.a : Math.round(c.a * 100) / 100})` : `rgb(${r}, ${g}, ${b})`;
}

export function toHslString(c: RGB): string {
  const { h, s, l } = rgbToHsl(c);
  const base = `${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%`;
  return c.a < 1 ? `hsla(${base}, ${Math.round(c.a * 100) / 100})` : `hsl(${base})`;
}

export function toHsvString(c: RGB): string {
  const { h, s, v } = rgbToHsv(c);
  return `hsv(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(v)}%)`;
}

export function toCmykString(c: RGB): string {
  const { c: cc, m, y, k } = rgbToCmyk(c);
  return `cmyk(${Math.round(cc)}%, ${Math.round(m)}%, ${Math.round(y)}%, ${Math.round(k)}%)`;
}

export function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function adjustLightness(c: RGB, delta: number): RGB {
  const hsl = rgbToHsl(c);
  return { ...hslToRgb({ ...hsl, l: clamp(hsl.l + delta, 0, 100) }), a: c.a };
}

export function shiftHue(c: RGB, delta: number): RGB {
  const hsl = rgbToHsl(c);
  return { ...hslToRgb({ ...hsl, h: hsl.h + delta }), a: c.a };
}
