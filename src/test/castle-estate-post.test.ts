import { describe, expect, it } from "vitest";
import { buildings, CASTLE_PLOT, door, ESTATE, townSolids } from "@/lib/town-world";
import { findRoute, isWalkable } from "@/lib/pathfinding";
import { HOUSES, START } from "@/lib/game-data";
import { buyHouseAction, runAction } from "@/lib/actions";
import { homeZones, isVenue, venueZones } from "@/lib/home-zones";
import { planFor } from "@/lib/home3d/plans";
import { venuePlan } from "@/lib/home3d/venues";
import { roomFor } from "@/lib/rooms";
import type { GameState } from "@/lib/game-state";

const start = { x: 9.9, y: 9 };
/** Where a route crosses the estate's west wall line. */
function wallCrossings(goal: { x: number; y: number }, house = 1) {
  const r = [start, ...findRoute(start, goal, townSolids(buildings(house)))];
  return r.slice(1).map((p, i) => [r[i]!, p] as const).filter(([a, b]) => (a.x - ESTATE.x0) * (b.x - ESTATE.x0) < 0)
    .map(([a, b]) => a.y + (b.y - a.y) * (ESTATE.x0 - a.x) / (b.x - a.x));
}

describe("mansion estate", () => {
  it("is walled all round, with the gated drive as the only way in", () => {
    const solids = townSolids(buildings(1));
    for (let y = ESTATE.z0; y <= ESTATE.z1; y += 0.5) {
      const open = isWalkable({ x: ESTATE.x0 - 0.25, y }, solids) && isWalkable({ x: ESTATE.x0 + 0.25, y }, solids);
      expect(open, `west wall at y=${y}`).toBe(y > ESTATE.gate[0] && y < ESTATE.gate[1]);
    }
    for (const x of [31, 33, 35]) {
      expect(isWalkable({ x, y: ESTATE.z0 }, solids)).toBe(false);
      expect(isWalkable({ x, y: ESTATE.z1 }, solids)).toBe(false);
    }
  });

  it("reaches the mansion door and both gardens through the gate", () => {
    const mansion = buildings(1).find((b) => b.label === "Mansion")!;
    for (const goal of [door(mansion), { x: 32.5, y: 2.5 }, { x: 33, y: 13 }]) {
      const crossings = wallCrossings(goal);
      expect(crossings.length, JSON.stringify(goal)).toBeGreaterThan(0);
      for (const y of crossings) expect(y).toBeGreaterThan(ESTATE.gate[0]);
      for (const y of crossings) expect(y).toBeLessThan(ESTATE.gate[1]);
    }
  });
});

describe("castle", () => {
  const rich: GameState = { ...START, money: 2_000_000, house: 3, ownedHomes: 0b1111 };

  it("is the fifth home tier, bought at the bank like the others", () => {
    expect(HOUSES[4]?.name).toBe("Castle");
    expect(roomFor("bank", rich).hotspots.find((h) => h.id === "loans")!.actions!(rich).map((a) => a.id)).toContain("buy-house-4");
    const out = runAction(rich, buyHouseAction(rich, 4));
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.next.house).toBe(4);
      expect(out.next.ownedHomes! & (1 << 4)).toBeTruthy();
    }
  });

  it("replaces the cardboard box on its plot once built, even while living elsewhere", () => {
    const before = buildings(1).map((b) => b.label);
    expect(before).toContain("Cardboard Box");
    const lived = buildings(4);
    const home = lived.find((b) => b.id === "home")!;
    expect(home.label).toBe("Home · Castle");
    expect({ x: home.x, y: home.y, w: home.w, d: home.d }).toEqual(CASTLE_PLOT);
    expect(lived.map((b) => b.label)).not.toContain("Cardboard Box");
    const away = buildings(3, true);
    expect(away.find((b) => b.id === "residence-4")?.label).toBe("Castle");
    expect(away.map((b) => b.label)).not.toContain("Cardboard Box");
  });

  it("fits its plot without blocking the streets, and its gate is reachable", () => {
    const bs = buildings(4);
    const home = bs.find((b) => b.id === "home")!;
    expect(home.x + home.w).toBeLessThan(8.1); // Main Street pavement
    expect(home.y + home.d).toBeLessThan(6.6); // upper west street pavement
    const d = door(home);
    const r = findRoute(start, d, townSolids(bs));
    const end = r[r.length - 1]!;
    expect(Math.hypot(end.x - d.x, end.y - d.y)).toBeLessThan(0.6);
  });

  it("has its own interior with castle rooms", () => {
    expect(planFor(4)?.kind).toBe("castle");
    expect(homeZones(4).map((z) => z.label)).toEqual(["Great Hall", "Banquet Hall", "Royal Chamber", "Library Tower", "Armoury", "Games Gallery"]);
  });
});

describe("post office", () => {
  it("is a 3D venue whose fixtures match the existing hotspots", () => {
    expect(isVenue("post")).toBe(true);
    expect(venueZones("post").map((z) => z.label)).toEqual(["Public hall", "Sorting office"]);
    const plan = venuePlan("post")!;
    expect(plan.kind).toBe("post");
    expect(plan.slots.map((s) => s.id).sort()).toEqual(roomFor("post", START).hotspots.map((h) => h.id).sort());
  });
});
