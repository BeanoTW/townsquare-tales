import { describe, expect, it } from "vitest";
import { findRoute, isWalkable } from "@/lib/pathfinding";
describe("town navigation", () => {
  it("routes around a building", () => {
    const obstacle={x:2,y:2,w:3,d:3};
    const route=findRoute({x:1,y:3},{x:7,y:3},[obstacle]);
    expect(route.length).toBeGreaterThan(0);
    expect(route.at(-1)?.x).toBe(7);
    for(const p of route) expect(!(p.x>1.85&&p.x<5.15&&p.y>1.85&&p.y<5.15)).toBe(true);
  });
  it("reaches the expanded commercial district", () => {
    const obstacles = [{x:21,y:2,w:3.5,d:3.5},{x:25,y:2,w:3,d:3.5}];
    const route = findRoute({x:8.9,y:8.9},{x:22.75,y:6.1},obstacles);
    expect(route.length).toBeGreaterThan(0);
    expect(route.at(-1)?.x).toBeGreaterThan(20);
  });
  it("routes a tap on a building to the nearest reachable pavement", () => {
    const b={x:8,y:7,w:4,d:5};
    const path=findRoute({x:6,y:6},{x:10,y:9},[b]);
    expect(path.length).toBeGreaterThan(0);
    expect(isWalkable(path.at(-1)!,[b])).toBe(true);
    expect(path.at(-1)!.x).toBeLessThan(12.5);
  });
  it("does not strand the player when a revised map encloses their old spawn", () => {
    const b={x:8.5,y:8.5,w:1,d:1};
    const path=findRoute({x:9,y:9},{x:14,y:14},[b]);
    expect(path.length).toBeGreaterThan(0);
    expect(path.at(-1)).toEqual({x:14,y:14});
  });
  it("returns an empty route when completely enclosed", () => {
    expect(findRoute({x:3,y:3},{x:15,y:15},[{x:0,y:0,w:18,d:18}])).toEqual([]);
  });
});
