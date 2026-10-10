import { describe,expect,it } from "vitest";
import { START } from "@/lib/game-data";
import { LIFT_WEIGHTS, STUDY_LIBRARY } from "@/lib/actions";
import { actionBlockReason } from "@/components/LocationScene";
describe("interior action affordances",()=>{
  it("explains insufficient energy",()=>expect(actionBlockReason({...START,energy:4},LIFT_WEIGHTS)).toMatch(/Need 20 energy/));
  it("explains insufficient remaining time",()=>expect(actionBlockReason({...START,hour:23},STUDY_LIBRARY)).toMatch(/Not enough time/));
  it("leaves affordable actions enabled",()=>expect(actionBlockReason(START,STUDY_LIBRARY)).toBeNull());
  it("never blocks actions in God Mode",()=>expect(actionBlockReason({...START,hour:24,energy:0},LIFT_WEIGHTS,true)).toBeNull());
});