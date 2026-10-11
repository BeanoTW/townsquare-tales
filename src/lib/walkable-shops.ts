import { findRoute, isWalkable, type Point, type Obstacle } from "@/lib/pathfinding";
import type { PlaceId } from "@/lib/rooms";
export type ShopId = "shop" | "pawn" | "furniture";
export const isWalkableShop = (id: PlaceId): id is ShopId =>
  id === "shop" || id === "pawn" || id === "furniture";
export type ShopFixture = Obstacle & { id: string; approach: Point };
export const SHOP_ENTRY = { x: 9, y: 12 };
export const SHOP_EXIT = { x: 9, y: 13.5 };
export const SHOP_LAYOUTS: Record<ShopId, ShopFixture[]> = {
  shop: [
    { id: "shelves", x: 2, y: 3, w: 3, d: 4, approach: { x: 6, y: 5 } },
    { id: "shop-board", x: 7, y: 2, w: 2, d: 1, approach: { x: 8, y: 4 } },
    { id: "back-office", x: 11, y: 2, w: 4, d: 2, approach: { x: 13, y: 5 } },
    { id: "checkout", x: 11, y: 7, w: 4, d: 2, approach: { x: 10, y: 8 } },
  ],
  pawn: [
    { id: "pawn-counter", x: 2, y: 3, w: 5, d: 2, approach: { x: 5, y: 6 } },
    { id: "curiosities", x: 11, y: 3, w: 4, d: 5, approach: { x: 10, y: 6 } },
  ],
  furniture: [
    { id: "sofa-display", x: 2, y: 4, w: 4, d: 2, approach: { x: 7, y: 5 } },
    { id: "bed-display", x: 10, y: 3, w: 4, d: 4, approach: { x: 9, y: 5 } },
    { id: "catalogue", x: 11, y: 9, w: 3, d: 2, approach: { x: 10, y: 10 } },
  ],
};
/** Reuse town navigation with padded furniture and room walls, leaving the exit open. */
export function shopObstacles(id: ShopId): Obstacle[] {
  return [
    { x: 0, y: 0, w: 30, d: 1 },
    { x: 0, y: 0, w: 1, d: 30 },
    { x: 17, y: 0, w: 13, d: 30 },
    { x: 0, y: 14, w: 30, d: 16 },
    { x: 14.5, y: 5.5, w: 1, d: 1 },
    ...SHOP_LAYOUTS[id].map((f) => ({ x: f.x - 0.25, y: f.y - 0.25, w: f.w + 0.5, d: f.d + 0.5 })),
  ];
}
export function shopRoute(id: ShopId, start: Point, goal: Point) {
  return findRoute(start, goal, shopObstacles(id));
}
export function moveShopPlayer(id: ShopId, p: Point, delta: Point): Point {
  const obstacles = shopObstacles(id);
  const x = { x: p.x + delta.x, y: p.y };
  const next = isWalkable(x, obstacles) ? x : p;
  const y = { x: next.x, y: next.y + delta.y };
  return isWalkable(y, obstacles) ? y : next;
}
export function fixtureNear(p: Point, fixture: ShopFixture) {
  return Math.hypot(p.x - fixture.approach.x, p.y - fixture.approach.y) <= 0.8;
}
