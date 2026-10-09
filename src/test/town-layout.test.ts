import { describe, expect, it } from "vitest";
import { buildings, door } from "@/components/TownMap";
import { findRoute } from "@/lib/pathfinding";

const roads = [
  { x: 0, y: 8, w: 30, d: 2 },
  { x: 0, y: 18.3, w: 30, d: 1.6 },
  { x: 0, y: 28.2, w: 30, d: 1.5 },
  { x: 8, y: 0, w: 2, d: 30 },
  { x: 18.3, y: 0, w: 1.6, d: 30 },
];
const overlap = (a: {x:number;y:number;w:number;d:number}, b: {x:number;y:number;w:number;d:number}) =>
  a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.d && a.y+a.d > b.y;

describe("town masterplan geometry", () => {
  const lots = buildings(0);
  it("preserves all 15 destinations", () => expect(new Set(lots.map(l => l.id)).size).toBe(15));
  it("keeps building footprints clear of roads and each other", () => {
    for (const b of lots) {
      expect(roads.some(r => overlap(b,r)), b.label + " overlaps a road").toBe(false);
      expect(lots.some(other => other.id !== b.id && overlap(b,other)),b.label+" overlaps another building").toBe(false);
    }
  });
  it("gives every doorway a reachable street-facing pavement position", () => {
    for (const b of lots) {
      const d = door(b);
      expect(d.y, b.id + " door y").toBeGreaterThan(b.y+b.d);
      expect(lots.some(other => other.id !== b.id && d.x > other.x && d.x < other.x+other.w && d.y > other.y && d.y < other.y+other.d), b.label + " blocked door").toBe(false);
      const route=findRoute({x:8.9,y:8.9},d,lots);
      expect(route.length,b.label + " unreachable").toBeGreaterThan(0);
    }
  });
});
