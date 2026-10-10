import { describe, expect, it } from "vitest";
import { buildings, ROADS } from "@/components/TownMap";

describe("irregular market street", () => {
  it("groups three shopfronts in one row without joining their footprints", () => {
    const row = buildings(0).filter(b => ["gym", "shop", "furniture"].includes(b.id)).sort((a,b)=>a.x-b.x);
    expect(row.length).toBe(3);
    expect(row.every(b=>b.facing==="south" && b.y+b.d<12.4)).toBe(true);
    for(const [i,b] of row.entries()) {
      const next=row[i+1];
      if(next) expect(next.x-(b.x+b.w)).toBeGreaterThanOrEqual(.4);
    }
  });
  it("retains long and short roads rather than repeated square blocks", () => {
    const lengths=ROADS.map(r=>Math.max(r.w,r.d));
    expect(Math.max(...lengths)).toBe(30);
    expect(Math.min(...lengths)).toBe(9);
    expect(new Set(lengths).size).toBeGreaterThanOrEqual(4);
  });
});