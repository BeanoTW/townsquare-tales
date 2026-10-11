import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { AMBIENT_ROUTES, ambientVisible, makeActor, moveActor, moveBird, townAtmosphere, type StreetBird } from "@/lib/street-life";
import { buildings } from "@/components/TownMap";
import { ConstructionSite } from "@/components/ConstructionSite";
import { isWalkable } from "@/lib/pathfinding";

describe("neighbourhood atmosphere",()=>{
  it("switches social activity across the day and preserves navigable lighting",()=>{
    expect(townAtmosphere(8)).toMatchObject({period:"morning",lit:false,constructionActive:true});
    expect(townAtmosphere(14).period).toBe("afternoon");
    expect(townAtmosphere(18)).toMatchObject({period:"evening",lit:true,constructionActive:false});
    expect(townAtmosphere(23)).toMatchObject({period:"late-night",lit:true,dinerActive:false});
    expect(ambientVisible("delivery",8)).toBe(true);expect(ambientVisible("delivery",14)).toBe(false);
    expect(ambientVisible("park",14)).toBe(true);expect(ambientVisible("park",23)).toBe(false);
    expect(ambientVisible("casino",20)).toBe(true);expect(ambientVisible("casino",8)).toBe(false);
    expect(AMBIENT_ROUTES.filter(r=>ambientVisible(r.id,23)).length).toBeLessThan(AMBIENT_ROUTES.filter(r=>ambientVisible(r.id,8)).length);
  });
  it("keeps every background route outside building lots and movement continuous",()=>{
    const lots=buildings(3);
    for(const r of AMBIENT_ROUTES) for(const stops of [r.morning,r.evening]) {
      for(const stop of stops) expect(isWalkable(stop,lots),r.id).toBe(true);
      const a=makeActor(stops[0],lots);
      for(let n=0;n<300;n++) {
        const before={x:a.x,y:a.y}; moveActor(a,stops[1],lots,.1);
        expect(isWalkable(a,lots),r.id).toBe(true);
        expect(Math.hypot(a.x-before.x,a.y-before.y)).toBeLessThanOrEqual(.081);
      }
    }
  });
  it("scatters and returns pigeons without teleporting or repeatedly frightening them",()=>{
    const home={x:8,y:11.2}, bird:StreetBird={...home,angle:0,scatterUntil:0,armed:true};
    for(let n=0;n<100;n++) {
      const before={x:bird.x,y:bird.y};
      moveBird(bird,home,{x:7.5,y:11.2},n*.1,.1,0,[]);
      expect(Math.hypot(bird.x-before.x,bird.y-before.y)).toBeLessThanOrEqual(.161);
    }
    expect(bird.scatterUntil).toBe(3);
    expect(Math.hypot(bird.x-home.x,bird.y-home.y)).toBeLessThan(.3);
    moveBird(bird,home,{x:1,y:1},11,.1,0,[]);expect(bird.armed).toBe(true);
  });
  it("keeps birds outside buildings and uses gentler reduced-motion flight",()=>{
    const home={x:5,y:5}, lots=[{x:5.3,y:4,w:2,d:2}];
    const bird:StreetBird={...home,angle:0,scatterUntil:0,armed:true};
    moveBird(bird,home,{x:4.5,y:5},0,.1,0,lots,true);
    expect(Math.hypot(bird.x-home.x,bird.y-home.y)).toBeLessThanOrEqual(.066);
    for(let n=0;n<100;n++) moveBird(bird,home,{x:4.5,y:5},n*.1,.1,0,lots);
    expect(isWalkable(bird,lots)).toBe(true);
  });
  it("closes decorative construction work after hours while retaining the foreman",()=>{
    const view=render(<svg><ConstructionSite active={false} onForeman={()=>{}}/></svg>);
    expect(view.container.querySelector("[data-construction-site]")).toHaveAttribute("data-active","false");
    expect(view.container.querySelector("[data-construction-worker]")).toHaveAttribute("visibility","hidden");
    expect(view.getByRole("button",{name:"Talk to the construction foreman"})).toBeInTheDocument();
  });
});
