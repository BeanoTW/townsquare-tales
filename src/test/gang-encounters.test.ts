import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {runAction} from "@/lib/actions";
import {crewChoices,resolveCrewEncounter} from "@/lib/gang-career";
describe("crew encounter choices",()=>{
 it("exposes context-sensitive encounter approaches",()=>{expect(crewChoices({...START,gangTask:5}).map(x=>x.id)).toEqual(["quiet","persuade","bold"]);});
 it("clean handoff pays normal amount",()=>{const s={...START,gangTask:5,gangStage:2,gangRep:3};const result=runAction(s,resolveCrewEncounter(5,"quiet"),()=>0.9);expect(result.ok).toBe(true);if(result.ok)expect(result.next).toMatchObject({gangTask:0,money:s.money+120});});
 it("negotiating with sufficient charm earns a bonus",()=>{const s={...START,gangTask:5,gangStage:2,gangRep:3,cha:20};const result=runAction(s,resolveCrewEncounter(5,"persuade"),()=>0.9);expect(result.ok).toBe(true);if(result.ok)expect(result.next.money).toBe(s.money+155);});
 it("risky choices can fail and preserve the assignment",()=>{const s={...START,gangTask:5,gangStage:2,gangRep:3};const result=runAction(s,resolveCrewEncounter(5,"bold"),()=>0);expect(result.ok).toBe(true);if(result.ok){expect(result.next.gangTask).toBe(5);expect(result.next.money).toBe(s.money);expect(result.next.heat).toBeGreaterThan(s.heat);}});
 it("a quiet lookout advances without payment",()=>{const s={...START,gangTask:3,gangStage:1,gangRep:1};const result=runAction(s,resolveCrewEncounter(3,"quiet"),()=>0.8);expect(result.ok).toBe(true);if(result.ok)expect(result.next).toMatchObject({gangTask:4,money:s.money});});
});
