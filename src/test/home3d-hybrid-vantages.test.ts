import {describe,it,expect} from "vitest";
import {PLANS} from "@/lib/home3d/plans";
import {VENUES} from "@/lib/home3d/venues";
import {vantageFor} from "@/lib/home3d/layout";

describe("hybrid first-person room vantages",()=>{
  for(const plan of [...PLANS,...Object.values(VENUES)]){
    it(`${plan.kind}: viewpoints stay inside real room boundaries`,()=>{
      for(const room of plan.rooms){
        const v=vantageFor(plan,room.zone);
        expect(v.eye[0]).toBeGreaterThanOrEqual(Math.max(0,room.rect.x0));
        expect(v.eye[0]).toBeLessThanOrEqual(Math.min(plan.size.w,room.rect.x1));
        expect(v.eye[2]).toBeGreaterThanOrEqual(Math.max(0,room.rect.z0));
        expect(v.eye[2]).toBeLessThanOrEqual(Math.min(plan.size.d,room.rect.z1));
        expect(v.eye[1]).toBeGreaterThan(0);
        expect(v.eye[1]).toBeLessThan(plan.size.h);
        expect(v.lookAt.every(Number.isFinite)).toBe(true);
      }
    });
  }
});
