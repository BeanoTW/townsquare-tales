import { convexHull } from "@/lib/town-world";
import { daylight } from "@/lib/home3d/layout";
import { mixColor } from "@/components/town3d/palette";

/**
 * Screen-space side of the 3D town, free of three.js so the SVG layer can use it
 * without loading the 3D bundle. World: X = map x (east), Y = height, Z = map y (south).
 * The ground maps exactly like the classic projection P (48 × 36 px per tile);
 * height lifts LIFT px per tile and leans SKEW px right, so the south and west walls face the player
 * (as the classic building art does).
 */
export const TILE_X = 48;
export const TILE_Z = 36;
export const LIFT = 30;
export const SKEW = 12;
export const VIEW_W = 330;
export const VIEW_H = 550;

/** Screen position (classic SVG world units, before the follow-camera offset) of a 3D point. */
export function screenOf(X: number, Y: number, Z: number): [number, number] {
  return [X * TILE_X + Y * SKEW, Z * TILE_Z - Y * LIFT];
}

/** Convex screen outline of a box from the ground to `top` (transparent tap areas). */
export function boxHull(x: number, z: number, w: number, d: number, top: number): [number, number][] {
  const corners: [number, number][] = [];
  for (const X of [x, x + w]) for (const Z of [z, z + d]) for (const Y of [0, top]) corners.push(screenOf(X, Y, Z));
  return convexHull(corners);
}

/** Night factor 0 (day) … 1 (night), shared by lights, sky and glowing materials. */
export const nightLevel = (hour: number) => Math.max(0, Math.min(1, (0.94 - daylight(hour)) / 0.88));

/** How warm the light is around sunrise and sunset (0 … 1). */
export const duskLevel = (hour: number) => {
  const d = daylight(hour);
  return d > 0.07 && d < 0.99 ? 1 - Math.abs(d - 0.5) * 2 : 0;
};

/** Sky gradient behind the town, matching the interior scenes' day/night sky. */
export function townSky(hour: number): string {
  const day = daylight(hour), dusk = duskLevel(hour);
  const top = mixColor(mixColor("#0e1530", "#8fc3e8", day), "#e98b5a", dusk * 0.55);
  const bottom = mixColor(mixColor("#26304e", "#dceefb", day), "#f6c28a", dusk * 0.6);
  return `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`;
}

/** Top of the diner's kitchen chimney, where the SVG steam overlay rises from. */
export const DINER_CHIMNEY = { x: 7.45, y: 1.1, z: 14.15 } as const;
