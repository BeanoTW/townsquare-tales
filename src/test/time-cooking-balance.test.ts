import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {durationLabel} from "@/lib/day-cycle";
import {COOK_AT_HOME,HOME_WORKOUT,runAction} from "@/lib/actions";
import {actionBlockReason} from "@/components/rooms/ActionPanel";
describe("time labels and cooking balance",()=>{
 it("formats fractional time as hours and minutes",()=>{expect(durationLabel(1.75)).toBe("1h 45m");expect(durationLabel(0.25)).toBe("15m");expect(durationLabel(2)).toBe("2h");});
 it("explains why a 2-hour workout cannot fit at 22:15",()=>{expect(actionBlockReason({...START,hour:22.25},HOME_WORKOUT)).toContain("1h 45m available");});
 it("restores 20 energy for a standard kitchen",()=>{const s={...START,house:1,money:50,energy:20,furniture:2};const r=runAction(s,COOK_AT_HOME);expect(r.ok).toBe(true);if(r.ok)expect(r.next.energy).toBe(40);});
 it("restores 40 energy with an upgraded kitchen",()=>{const s={...START,house:2,money:50,energy:20,furniture:2,luxuryFurniture:2};const r=runAction(s,COOK_AT_HOME);expect(r.ok).toBe(true);if(r.ok)expect(r.next.energy).toBe(60);});
 it("rejects cooking from the cardboard home, including old saves",()=>{expect(runAction({...START,money:50,furniture:2},COOK_AT_HOME).ok).toBe(false);});
});