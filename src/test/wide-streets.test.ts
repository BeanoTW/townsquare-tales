import { describe, expect, it } from "vitest";
import { ROADS, buildings, door } from "@/components/TownMap";
import { findRoute } from "@/lib/pathfinding";

describe("wider town roads", () => {
  it("keeps the main and side streets wide, with side roads joined to the spines", () => {
    const main=ROADS[0]!;
    expect(main.w).toBeGreaterThanOrEqual(2.7);
    expect(ROADS[5]!.w).toBeGreaterThanOrEqual(2.7);
    for (const road of ROADS.slice(1,5)) {
      expect(road.d).toBeGreaterThanOrEqual(2.2);
      expect(road.x < main.x+main.w && road.x+road.w > main.x || road.x < ROADS[5]!.x+ROADS[5]!.w && road.x+road.w > ROADS[5]!.x).toBe(true);
    }
  });
  it("keeps entrances navigable after widening streets", () => {
    const lots=buildings(1);
    const gym=lots.find(b=>b.id==="gym")!;
    const bar=lots.find(b=>b.id==="bar")!;
    expect(findRoute(door(gym),door(bar),lots).length).toBeGreaterThan(0);
  });
});