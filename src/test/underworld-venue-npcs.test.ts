import {describe,it,expect} from "vitest";
import {missionContactDialogue,gangTaskObjective} from "@/lib/gang-career";
import {START} from "@/lib/game-data";
describe("underworld venue NPC encounters",()=>{
 it("shows bank watcher only on the lookout stage",()=>{const c=missionContactDialogue({...START,gangTask:3});expect(c?.name).toBe("Bank watcher");expect(gangTaskObjective({...START,gangTask:3})?.place).toBe("bank");});
 it("gives buyer distinct dialogue at the pub",()=>{const c=missionContactDialogue({...START,gangTask:5});expect(c?.name).toBe("Pub buyer");expect(c?.line).toBeTruthy();});
 it("stays hidden outside those mission stages",()=>{for(const i of [0,1,2,4])expect(missionContactDialogue({...START,gangTask:i})).toBeNull();});
 it("varies dialogue by day without surfacing thresholds",()=>{const a=missionContactDialogue({...START,gangTask:5,day:11})?.line;const b=missionContactDialogue({...START,gangTask:5,day:12})?.line;expect(a).not.toBe(b);expect(a).not.toMatch(/trust\s*\d+|reputation\s*\d+/i);});
});
