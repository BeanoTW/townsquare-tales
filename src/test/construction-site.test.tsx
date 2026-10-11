import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { ConstructionSite } from "@/components/ConstructionSite";
import { buildings, door, ROADS } from "@/components/TownMap";
import { findRoute } from "@/lib/pathfinding";

describe("construction compound", () => {
  it("draws multiple construction areas, machinery and a foreman who offers existing yard jobs", () => {
    const onForeman=vi.fn();
    const view=render(<svg><ConstructionSite onForeman={onForeman}/></svg>);
    for (const name of ["construction-site","construction-crane","construction-dumper","construction-digger","construction-foreman"]) {
      expect(view.container.querySelector("[data-"+name+"]")).toBeInTheDocument();
    }
    expect(view.container.querySelector("[data-site-ground-detail]")).toBeInTheDocument();
    expect(view.container.querySelector("[data-site-scaffolding]")).toBeInTheDocument();
    expect(view.container.querySelector("[data-site-materials]")).toBeInTheDocument();
    fireEvent.click(view.getByRole("button",{name:"Talk to the construction foreman"}));
    expect(onForeman).toHaveBeenCalledOnce();
  });
  it("keeps the yard office reachable without intersecting streets or other buildings", () => {
    const lots=buildings(0), yard=lots.find(b=>b.id==="yard")!;
    expect(yard.x).toBeGreaterThan(16);
    expect(yard.y).toBeGreaterThan(21);
    for (const b of [...lots.filter(b=>b.id!=="yard"),...ROADS]) {
      expect(yard.x < b.x+b.w && yard.x+yard.w > b.x && yard.y < b.y+b.d && yard.y+yard.d > b.y).toBe(false);
    }
    expect(findRoute({x:9.95,y:9},door(yard),lots).length).toBeGreaterThan(0);
  });
});