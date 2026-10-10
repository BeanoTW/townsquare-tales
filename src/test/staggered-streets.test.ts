import { describe, expect, it } from "vitest";
import { ROADS, buildings, door } from "@/components/TownMap";
import { findRoute, isWalkable } from "@/lib/pathfinding";

type Road = (typeof ROADS)[number];
function isFourWayAt(a:Road,b:Road) {
  const aVertical=a.d>a.w, bVertical=b.d>b.w;
  if(aVertical===bVertical)return false;
  const v=aVertical?a:b, h=aVertical?b:a;
  const cx=v.x+v.w/2, cy=h.y+h.d/2;
  const eps=.05;
  return h.x<cx-eps && h.x+h.w>cx+eps &&
    v.y<cy-eps && v.y+v.d>cy+eps;
}
describe("staggered street plan",()=>{
  it("contains no four-way junctions",()=>{
    for(const [i,a] of ROADS.entries())for(const [j,b] of ROADS.entries())
      if(j>i) expect(isFourWayAt(a,b),"crossroads "+i+"/"+j).toBe(false);
  });
  it("offsets west and east side-street junctions",()=>{
    const west=ROADS.filter(r=>r.w>r.d&&r.x===0).map(r=>r.y);
    const east=ROADS.filter(r=>r.w>r.d&&r.x===11).map(r=>r.y);
    for(const a of west)for(const b of east)expect(Math.abs(a-b)).toBeGreaterThan(2);
  });
  it("has 15 unobstructed building doors, leaving the gang in open terrain",()=>{
    const lots=buildings(0);
    expect(lots.length).toBe(15);
    for(const b of lots){
      const d=door(b);
      expect(isWalkable(d,lots),b.id+" door obstructed").toBe(true);
      const path=findRoute({x:9.95,y:9},d,lots);
      expect(path.length,b.id+" path missing").toBeGreaterThan(0);
      const end=path.at(-1);
      expect(end,b.id+" endpoint exists").toBeDefined();
      if(end) expect(Math.hypot(end.x-d.x,end.y-d.y),b.id+" path endpoint").toBeLessThan(.8);
    }
  });
});
