import { describe, expect, it } from "vitest";
import { findRoute } from "@/lib/pathfinding";
describe("town navigation", () => {
  it("routes around a building", () => {
    const obstacle={x:2,y:2,w:3,d:3};
    const route=findRoute({x:1,y:3},{x:7,y:3},[obstacle]);
    expect(route.length).toBeGreaterThan(0);
    expect(route.at(-1)?.x).toBe(7);
    for(const p of route) expect(!(p.x>1.85&&p.x<5.15&&p.y>1.85&&p.y<5.15)).toBe(true);
  });
  it("returns an empty route when completely enclosed", () => {
    expect(findRoute({x:3,y:3},{x:15,y:15},[{x:0,y:0,w:18,d:18}])).toEqual([]);
  });
});
