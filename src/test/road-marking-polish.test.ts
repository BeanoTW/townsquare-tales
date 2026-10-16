import { describe, expect, it } from "vitest";
import { ROADS, laneDashes, buildings, door } from "@/lib/town-world";

describe("junction-aware town road markings",()=>{
  it("keeps yellow centre dashes away from intersecting streets",()=>{
    const dashes=laneDashes();
    expect(dashes.length).toBeGreaterThan(8);
    for(const dash of dashes) {
      const touching=ROADS.filter(road=>dash.x<road.x+road.w+0.18&&dash.x+dash.w>road.x-0.18&&dash.y<road.y+road.d+0.18&&dash.y+dash.d>road.y-0.18);
      expect(touching.length).toBe(1);
    }
  });
  it("preserves the accessible Post Office road layout",()=>{
    const post=buildings(0).find(b=>b.id==="post")!;
    const p=door(post);
    expect(ROADS.some(r=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.d)).toBe(true);
    expect(laneDashes().some(d=>d.y>6&&d.y<8&&d.x>23)).toBe(true);
  });
});
