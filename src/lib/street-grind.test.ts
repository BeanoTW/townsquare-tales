import {describe,expect,it} from "vitest";
import {beginStreetGrind,advanceStreetGrind,grindPosition} from "./street-grind";
import {TOWN_RAILS} from "./town-rails";
describe("overworld balance grinds",()=>{
 const rail=TOWN_RAILS[0]!;
 it("starts only near the rail interior",()=>{
  expect(beginStreetGrind({x:18.9,y:1.9},rail)).not.toBeNull();
  expect(beginStreetGrind({x:20,y:20},rail)).toBeNull();
 });
 it("moves along a rail and lands at the endpoint",()=>{
  let run=beginStreetGrind({x:18.9,y:1.8},rail)!;
  for(let i=0;i<25&&run.outcome==="grinding";i++)run=advanceStreetGrind(run,.05,0);
  expect(run.outcome).toBe("landed");
  expect(grindPosition(run).x).toBeCloseTo(rail.b.x);
 });
 it("falls if balance drifts outside the allowed band",()=>{
  let run=beginStreetGrind({x:18.9,y:1.8},rail)!;
  run.balance=.99; run.velocity=1;
  run=advanceStreetGrind(run,.05,1);
  expect(run.outcome).toBe("fell");
 });
});
