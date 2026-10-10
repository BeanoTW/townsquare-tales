import type { CSSProperties } from "react";
import { VIEW, type Box } from "@/lib/rooms";

export type Size = { w: number; h: number };
export type Fit = { x: number; y: number; w: number; h: number };

/** Fits the fixed room canvas inside the stage without cropping, centred. */
export function fitRect(cw: number, ch: number): Fit {
  const scale = Math.min(cw / VIEW.w, ch / VIEW.h);
  const w = VIEW.w * scale;
  const h = VIEW.h * scale;
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
}

/**
 * Places the floating panel beside the tapped object, on whichever side has more
 * room, and keeps it inside the stage. Only the panel itself ever scrolls.
 */
export function panelStyle(box: Box, fit: Fit, cw: number, ch: number): CSSProperties {
  const sx = fit.w / VIEW.w;
  const sy = fit.h / VIEW.h;
  const left = fit.x + box.x * sx;
  const right = fit.x + (box.x + box.w) * sx;
  const top = fit.y + box.y * sy;
  const bottom = fit.y + (box.y + box.h) * sy;
  const width = Math.max(200, Math.min(290, cw - 16));
  const centre = (left + right) / 2;
  const clampedLeft = Math.max(8, Math.min(centre - width / 2, cw - width - 8));
  const spaceBelow = ch - bottom;
  const spaceAbove = top;
  if (spaceBelow >= spaceAbove) {
    return {
      width,
      left: clampedLeft,
      top: bottom + 10,
      maxHeight: Math.max(140, spaceBelow - 18),
    };
  }
  return {
    width,
    left: clampedLeft,
    bottom: ch - top + 10,
    maxHeight: Math.max(140, spaceAbove - 18),
  };
}
