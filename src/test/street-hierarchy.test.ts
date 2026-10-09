import { describe, expect, it } from "vitest";
import { ROADS, buildings } from "@/components/TownMap";
describe("street hierarchy", () => {
  it("has at least two intentionally terminating roads", () => {
    expect(ROADS.filter(r => r.x+r.w < 30 || r.y+r.d < 30).length).toBeGreaterThanOrEqual(2);
  });
  it("keeps all building footprints off the road surface", () => {
    for (const b of buildings(0)) for(const r of ROADS) {
      const overlaps=b.x<r.x+r.w && b.x+b.w>r.x && b.y<r.y+r.d && b.y+b.d>r.y;
      expect(overlaps,b.id + " on road").toBe(false);
    }
  });
});