import type { B } from "@/lib/town-world";
import { boxHull } from "@/components/town3d/screen";

/**
 * Highest point of each 3D building model, in tiles. Used for transparent tap
 * outlines so a tap anywhere on the visible building enters it.
 */
const TOPS: Record<string, number> = {
  yard: 1.05,
  gym: 1.95,
  school: 3.05,
  bar: 1.9,
  work: 4.7,
  bank: 2.1,
  shop: 1.12,
  diner: 1.62,
  pawn: 1.4,
  furniture: 2.0,
  casino: 2.65,
  depot: 1.3,
  police: 2.25,
  clinic: 1.5,
};
/** Home models by tier: cardboard box, flat, house, mansion, castle. */
const HOME_TOPS = [0.8, 2.15, 1.95, 2.15, 3.1];

export function buildingTop(b: Pick<B, "id">, house = 0): number {
  if (b.id === "home") return HOME_TOPS[house] ?? HOME_TOPS[0]!;
  if (b.id === "residence-4") return HOME_TOPS[4]!;
  return TOPS[b.id] ?? 1.5;
}

/** Screen-space tap outline of a building in the 3D view. */
export function buildingHull3d(b: B, house = 0): [number, number][] {
  return boxHull(b.x, b.y, b.w, b.d, buildingTop(b, house));
}
