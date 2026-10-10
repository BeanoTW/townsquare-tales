import { describe, expect, it } from "vitest";
import { buildings, door, ROADS } from "@/components/TownMap";
import { findRoute } from "@/lib/pathfinding";

const roads = ROADS;
const overlap = (a: {x:number;y:number;w:number;d:number}, b: {x:number;y:number;w:number;d:number}) =>
  a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.d && a.y+a.d > b.y;

describe("town masterplan geometry", () => {
  const lots = buildings(0);
  it("keeps 15 enterable buildings, with the former Dark Alley now a street encounter", () => {
    expect(new Set(lots.map(l => l.id)).size).toBe(15);
    expect(lots.some(b => b.id === "alley")).toBe(false);
  });
  it("keeps building footprints clear of roads and each other", () => {
    for (const b of lots) {
      expect(roads.some(r => overlap(b,r)), b.label + " overlaps a road").toBe(false);
      expect(lots.some(other => other.id !== b.id && overlap(b,other)),b.label+" overlaps another building").toBe(false);
    }
  });
  it("gives every doorway a reachable street-facing pavement position", () => {
    for (const b of lots) {
      const d = door(b);
      expect(d.x >= 0.2 && d.y >= 0.2 && d.x <= 29.8 && d.y <= 29.8,b.id + " bounds").toBe(true);
      expect(lots.some(other => other.id !== b.id && d.x > other.x && d.x < other.x+other.w && d.y > other.y && d.y < other.y+other.d), b.label + " blocked door").toBe(false);
      const route=findRoute({x:8.9,y:8.9},d,lots);
      expect(route.length,b.label + " unreachable").toBeGreaterThan(0);
    }
  });
});
