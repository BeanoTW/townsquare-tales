import { describe, expect, it } from "vitest";
import { ROADS, buildings, door } from "@/lib/town-world";
import { PARK_OBJECTS } from "@/lib/park-life";
import { PARK_KID_SPOT } from "@/lib/park-kid";
import { TOWN_RAILS } from "@/lib/town-rails";
import { findRoute, isWalkable } from "@/lib/pathfinding";

const contains=(r:{x:number;y:number;w:number;d:number},p:{x:number;y:number}) =>
  p.x>=r.x && p.x<=r.x+r.w && p.y>=r.y && p.y<=r.y+r.d;
const overlaps=(a:{x:number;y:number;w:number;d:number},b:{x:number;y:number;w:number;d:number}) =>
  a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.d && a.y+a.d>b.y;

describe("joined park recreation and postal road",()=>{
  const lots=buildings(0);
  const post=lots.find(x=>x.id==="post")!;
  const school=lots.find(x=>x.id==="school")!;
  const park={x:17,y:1.1,w:5,d:5.6};
  it("places skate ramp and basketball hoop together in the park beyond Stick U",()=>{
    expect(park.x).toBeGreaterThanOrEqual(school.x+school.w);
    for(const kind of ["ramp","hoop","hide"]) {
      const fixture=PARK_OBJECTS.find(x=>x.id===kind)!;
      expect(contains(park,fixture),kind).toBe(true);
      expect(isWalkable(fixture,lots),kind).toBe(true);
      expect(findRoute({x:9.95,y:9},fixture,lots).length,kind).toBeGreaterThan(0);
    }
    expect(contains(park,PARK_KID_SPOT)).toBe(true);
    const rail=TOWN_RAILS.find(r=>r.id==="park")!;
    expect(contains(park,rail.a)).toBe(true);
    expect(contains(park,rail.b)).toBe(true);
  });
  it("adds an L-shaped northeast postal road connected to the existing eastern street",()=>{
    const north=ROADS.find(r=>r.x>23&&r.x+r.w>=29&&r.y<7)!;
    const east=ROADS.find(r=>r.x===22.6&&r.d>20)!;
    expect(north).toBeDefined();
    expect(east).toBeDefined();
    expect(overlaps(north,east)).toBe(true);
    expect(post.facing).toBe("south");
    expect(contains(north,door(post))).toBe(true);
    for (const b of lots) for (const road of ROADS)
      expect(overlaps(b,road),b.id+" overlaps new or old road").toBe(false);
  });
  it("keeps every entrance reachable after extending the streets",()=>{
    for(const b of lots) {
      expect(isWalkable(door(b),lots),b.id).toBe(true);
      expect(findRoute({x:9.95,y:9},door(b),lots).length,b.id).toBeGreaterThan(0);
    }
  });
});
