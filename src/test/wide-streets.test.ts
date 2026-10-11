import { describe, expect, it } from "vitest";
import { ROADS, buildings, door } from "@/components/TownMap";
import { findRoute } from "@/lib/pathfinding";

describe("wider town roads", () => {
  it("keeps the main and side streets wide, with side roads joined to the spines", () => {
    const main=ROADS[0]!;
    expect(main.w).toBeGreaterThanOrEqual(2.7);
    expect(ROADS[5]!.w).toBeGreaterThanOrEqual(2.7);
    for (const road of ROADS.slice(1,5)) {
      expect(road.d).toBeGreaterThanOrEqual(2.8);
      expect(road.x < main.x+main.w && road.x+road.w > main.x || road.x < ROADS[5]!.x+ROADS[5]!.w && road.x+road.w > ROADS[5]!.x).toBe(true);
    }
  });
  it("leaves shopfronts and the workers yard outside the widened carriageways", () => {
    const lots=buildings(0);
    for (const id of ["gym","shop","furniture","yard"]) {
      const b=lots.find(item=>item.id===id)!;
      for (const road of ROADS) {
        const overlapX=b.x<road.x+road.w && b.x+b.w>road.x;
        const overlapY=b.y<road.y+road.d && b.y+b.d>road.y;
        expect(overlapX && overlapY, id+" intersects a road").toBe(false);
      }
    }
  });
  it("keeps entrances navigable after widening streets", () => {
    const lots=buildings(1);
    const gym=lots.find(b=>b.id==="gym")!;
    const bar=lots.find(b=>b.id==="bar")!;
    expect(findRoute(door(gym),door(bar),lots).length).toBeGreaterThan(0);
  });
});