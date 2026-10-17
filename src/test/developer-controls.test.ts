import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {grantGodPowers,developerBoost,developerStory,runGodAction,parseGodSave} from "@/lib/god-mode";
import type {ActionDef} from "@/lib/actions";
describe("developer sandbox shortcuts",()=>{
 it("unlocks starter skateboard and owned car without filling every category",()=>{
  const g=grantGodPowers(START);
  expect(g.skateboard).toBe(1);expect(g.abandonedCar).toBe(1);expect(g.wreckRepairs).toBe(3);
  expect(g.house).toBe(START.house);expect(g.school).toBe(START.school);
 });
 it("offers opt-in stat and karma boosts",()=>{
  const a=developerBoost(START,"max-stats");
  expect(a.str).toBeGreaterThan(100);expect(START.str).toBe(5);
  expect(developerBoost(START,"bad-karma").karma).toBeLessThan(-100);
  expect(developerBoost(START,"good-karma").karma).toBeGreaterThan(100);
 });
 it("opens specific story only when requested",()=>{
  const g=developerStory(START,4);
  expect(g.underworldStoryActive).toBe(4);
  expect(g.underworldStoryMask).toBeUndefined();
  expect(developerStory(g,0).underworldStoryActive).toBe(0);
 });
 it("bypasses stat and resource checks without silently maxing permanent stats",()=>{
  const action:ActionDef={id:"test",label:"Test",hours:2,energy:99,cost:1000,resolve:s=>s.int<100?"Too inexperienced":{patch:{snacks:1},message:"OK"}};
  const result=runGodAction(START,action,()=>0.5);
  expect(result.ok).toBe(true);
  if(result.ok){expect(result.next.int).toBe(START.int);expect(result.next.snacks).toBe(1);expect(result.hoursUsed).toBe(0);}
 });
 it("keeps the sandbox isolated when loading ordinary saves",()=>{
  expect(parseGodSave(null,START).skateboard).toBe(1);
  expect(START.skateboard).toBe(0);
 });
});
