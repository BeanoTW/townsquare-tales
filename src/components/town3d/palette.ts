/**
 * The town theme is defined as oklch CSS variables. Three.js needs sRGB hex, so
 * resolve each `var(--name)` once through a 2D canvas, which converts any CSS colour.
 */
const cache = new Map<string, string>();
let probe: CanvasRenderingContext2D | null | undefined;

function toHex(css: string): string | null {
  if (typeof document === "undefined") return null;
  if (probe === undefined) {
    try {
      const c = document.createElement("canvas");
      c.width = c.height = 1;
      probe = c.getContext("2d", { willReadFrequently: true });
    } catch {
      probe = null;
    }
  }
  if (!probe) return null;
  try {
    if (typeof CSS !== "undefined" && !CSS.supports("color", css)) return null;
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = "#000";
    probe.fillStyle = css;
    probe.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0] = probe.getImageData(0, 0, 1, 1).data;
    return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

/** Resolve a colour reference ("var(--town-grass)", "#abc", "oklch(...)") to #rrggbb. */
export function townColor(ref: string, fallback = "#8a8a8a"): string {
  const hit = cache.get(ref);
  if (hit) return hit;
  let css = ref.trim();
  for (let i = 0; i < 4; i++) {
    const m = /^var\((--[\w-]+)\)$/.exec(css);
    if (!m || typeof document === "undefined") break;
    css = getComputedStyle(document.documentElement).getPropertyValue(m[1]!).trim();
  }
  const hex = (css && toHex(css)) || fallback;
  cache.set(ref, hex);
  return hex;
}

/** Blend two #rrggbb colours; t = 0 gives a, t = 1 gives b. */
export function mixColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const mix = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
  return "#" + [16, 8, 0].map((s) => mix(s).toString(16).padStart(2, "0")).join("");
}

/** Lighten (amount > 0) or darken (amount < 0) a #rrggbb colour. */
export function shade(hex: string, amount: number): string {
  return amount >= 0 ? mixColor(hex, "#ffffff", amount) : mixColor(hex, "#000000", -amount);
}
