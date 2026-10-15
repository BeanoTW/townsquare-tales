/** Shift the paper-coloured head continuously toward red or blue with karma. */
export function karmaHeadColor(karma: number): string {
  const intensity = Math.min(1, Math.abs(karma) / 30);
  const base = [255, 244, 214];
  const target = karma < 0 ? [216, 59, 76] : [73, 161, 255];
  const mix = base.map((c, i) => Math.round(c + ((target[i] ?? c) - c) * intensity));
  return `rgb(${mix.join(", ")})`;
}


/** Column-major matrix matching the shop's centred SVG viewBox, including letterboxing. */
export function shopPlayerClipMatrix(width: number, height: number): number[] {
  const w = Math.max(1, width), h = Math.max(1, height);
  const scale = Math.min(w / 432, h / 360);
  const sx = 2 * scale / w, sy = 2 * scale / h;
  return [
    24 * sx, 0, 0, 0,
    0, 24 * sy, -1 / 30, 0,
    0, -24 * sy, -1 / 30, 0,
    -216 * sx, 180 * sy, 0, 1,
  ];
}
