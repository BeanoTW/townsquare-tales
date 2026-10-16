import { describe, expect, it } from "vitest";
import { clearSegment, slideMove, smoothRoute } from "@/components/home3d/fluid-motion";
import type { Nav } from "@/lib/home3d/nav";

const nav: Nav = {
  nx: 9, nz: 9, cell: .1, blocked: new Uint8Array(81),
};
const mark=(x:number,z:number)=>{nav.blocked[x*nav.nz+z]=1;};
describe("fluid interior steering",()=>{
  it("slides along a blocked axis instead of crossing a wall",()=>{
    nav.blocked.fill(0);
    mark(5,5);
    const from={x:.4,z:.5};
    const next=slideMove(nav,from,.1,-.06);
    expect(next.x).toBeCloseTo(.4);
    expect(next.z).toBeCloseTo(.44);
  });
  it("never commits a blocked diagonal destination",()=>{
    nav.blocked.fill(0);
    mark(5,5);
    const next=slideMove(nav,{x:.4,z:.4},.1,.1);
    expect(next.x===.5&&next.z===.5).toBe(false);
    expect([next.x,next.z]).not.toEqual([.5,.5]);
  });
  it("shortens clear paths without cutting through obstacles",()=>{
    nav.blocked.fill(0);
    const source={x:.1,z:.1};
    const turns=[{x:.2,z:.1},{x:.3,z:.1},{x:.4,z:.1}];
    expect(smoothRoute(nav,source,turns)).toEqual([{x:.4,z:.1}]);
    mark(3,2);
    expect(clearSegment(nav,{x:.1,z:.1},{x:.5,z:.3})).toBe(false);
  });
});
