import { describe, expect, it } from "vitest";
import { planFor } from "@/lib/home3d/plans";
import { buildNav, walkable } from "@/lib/home3d/nav";
import { routeHome } from "@/lib/home3d/route";
describe("walking across 3D homes",()=>{
  for(let tier=0;tier<=3;tier++){
    it(`routes in property tier ${tier} without crossing collisions`,()=>{
      const plan=planFor(tier)!;
      const nav=buildNav(plan,[]);
      const [x,z]=plan.spawn.entry;
      expect(walkable(nav,x,z)).toBe(true);
      const path=routeHome(nav,{x,z},{x:plan.size.w/2,z:plan.size.d/2});
      expect(path.length).toBeGreaterThan(0);
      for(const p of path)expect(walkable(nav,p.x,p.z)).toBe(true);
    });
  }
});