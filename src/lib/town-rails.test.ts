import {describe,expect,it} from "vitest";
import {nearbyRail,railProximity,TOWN_RAILS} from "./town-rails";
describe("town grind rails",()=>{
 it("detects an approach along a finite segment",()=>{
  const rail=TOWN_RAILS[0]!;
  expect(nearbyRail({x:27.7,y:7.9})?.id).toBe("park");
  expect(railProximity({x:27.7,y:7.9},rail).progress).toBeCloseTo(.5);
  expect(nearbyRail({x:1,y:1})).toBeNull();
 });
 it("clamps beyond rail endpoints",()=>{
  expect(railProximity({x:40,y:7.8},TOWN_RAILS[0]!).progress).toBe(1);
 });
});
