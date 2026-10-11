import { describe, expect, it } from "vitest";
import { buildings, door } from "@/components/TownMap";
import { PARK_KID_SPOT } from "@/lib/park-kid";
import { GANG_SPOT } from "@/lib/street-gang";
import { findRoute, isWalkable } from "@/lib/pathfinding";

describe("central MegaCorp and northeast park", () => {
  const lots = buildings(1);
  const corp = lots.find(b => b.id === "work")!;
  it("places MegaCorp directly south of the bank with a west-facing entrance", () => {
    expect(corp.facing).toBe("west");
    const bank=lots.find(b=>b.id==="bank")!;
    expect(corp.x).toBe(bank.x);
    expect(corp.y).toBeGreaterThanOrEqual(bank.y+bank.d);
    expect(corp.y-(bank.y+bank.d)).toBeLessThan(1);
    expect(corp.y).toBeGreaterThanOrEqual(20);
    const entrance = door(corp);
    expect(entrance.x).toBeLessThan(corp.x);
    expect(isWalkable(entrance, lots)).toBe(true);
    expect(findRoute({x:9.95,y:9},entrance,lots).length).toBeGreaterThan(0);
  });
  it("puts the bench regular on the northeast park without overlapping the gang", () => {
    expect(PARK_KID_SPOT.x).toBeGreaterThan(25);
    expect(PARK_KID_SPOT.y).toBeGreaterThan(8);
    expect(Math.hypot(PARK_KID_SPOT.x-GANG_SPOT.x,PARK_KID_SPOT.y-GANG_SPOT.y)).toBeGreaterThan(2);
    expect(isWalkable(PARK_KID_SPOT,lots)).toBe(true);
    expect(findRoute({x:9.95,y:9},PARK_KID_SPOT,lots).length).toBeGreaterThan(0);
  });
});