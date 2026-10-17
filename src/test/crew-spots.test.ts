import {describe,it,expect} from "vitest";
import {CREW_SPOTS,GANG_SPOT,nearestCrew} from "@/lib/street-gang";
import {START} from "@/lib/game-data";
import {gangTaskObjective} from "@/lib/gang-career";
describe("physical crew locations",()=>{
 it("gives three distinct positions around the existing hangout",()=>{
  const entries=Object.entries(CREW_SPOTS);
  expect(entries).toHaveLength(3);
  expect(new Set(entries.map(([,v])=>v.x+","+v.y)).size).toBe(3);
  for(const [,p] of entries)expect(Math.hypot(p.x-GANG_SPOT.x,p.y-GANG_SPOT.y)).toBeLessThan(GANG_SPOT.approach);
 });
 it("uses same target coordinates for approach selection",()=>{
  for(const [id,spot] of Object.entries(CREW_SPOTS))expect(nearestCrew(spot.x,spot.y)).toBe(id);
 });
 it("keeps in-progress save mission objectives unchanged",()=>{
  expect(gangTaskObjective({...START,gangTask:2})?.place).toBe("gang");
  expect(gangTaskObjective({...START,gangTask:4})?.place).toBe("gang");
 });
});
