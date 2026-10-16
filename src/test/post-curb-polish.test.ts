import { describe, expect, it } from "vitest";
import { ROADS, buildings, buildingPlot, door } from "@/lib/town-world";
import { kerbSegments, pavementRects } from "@/components/town3d/ground";
import { findRoute } from "@/lib/pathfinding";

describe("postal corner and frontage polish",()=>{
  const east=ROADS.find(r=>r.x===22.6&&r.d>20)!;
  const spur=ROADS.find(r=>r.w>6&&r.x>20&&r.y<8)!;
  const post=buildings(0).find(b=>b.id==="post")!;
  it("meets the side street at a square right angle without a stepped western edge",()=>{
    expect(spur.x).toBe(east.x);
    expect(spur.y+spur.d).toBeGreaterThan(east.y);
    expect(spur.y).toBeLessThan(east.y);
    const ends=kerbSegments().filter(k=>k.axis==="z"&&Math.abs(k.x-spur.x)<0.01);
    expect(ends.length).toBeGreaterThan(0);
  });
  it("stops the post office garden exactly where the pavement starts",()=>{
    const plot=buildingPlot(post);
    const sidewalk=pavementRects().find(r=>Math.abs(r.y-(spur.y-0.58))<0.001&&r.w>7)!;
    expect(plot.y+plot.d).toBeCloseTo(sidewalk.y);
    expect(plot.y+plot.d).toBeLessThan(post.y+post.d+0.15);
  });
  it("keeps all entrances reachable after the squared road change",()=>{
    const bs=buildings(0);
    for(const b of bs)expect(findRoute({x:9.95,y:9},door(b),bs).length,b.id).toBeGreaterThan(0);
  });
});
