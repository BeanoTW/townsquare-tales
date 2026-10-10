import {describe,it,expect} from "vitest";
import {ENCOUNTER_SPOTS,encounterForDay} from "@/lib/world-encounters";
import {buildings} from "@/components/TownMap";
import {isWalkable} from "@/lib/pathfinding";
describe("optional outdoor encounters",()=>{
 it("all encounters occupy reachable unobstructed locations",()=>{
  const lots=buildings(0);
  for(const e of ENCOUNTER_SPOTS)expect(isWalkable({x:e.x,y:e.y},lots),e.id).toBe(true);
 });
 it("does not force an encounter on each arrival",()=>{
  expect(encounterForDay(1)).toBeNull();
  expect(encounterForDay(3)).toBeNull();
  expect(encounterForDay(4)?.id).toBeTruthy();
 });
 it("has multiple poses and readable interaction bubbles",()=>{
  expect(new Set(ENCOUNTER_SPOTS.map(e=>e.pose)).size).toBeGreaterThan(1);
  for(const e of ENCOUNTER_SPOTS)expect(e.icon.length).toBeGreaterThan(0);
 });
});