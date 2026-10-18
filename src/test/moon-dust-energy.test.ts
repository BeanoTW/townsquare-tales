import { describe, expect, it } from "vitest";
import { runAction, STAY_AWAKE, sleepAction, type ActionDef } from "@/lib/actions";
import { START } from "@/lib/game-data";
const job: ActionDef = {id:"work",label:"Work",hours:2,energy:30,resolve:s=>({patch:{money:s.money+50},message:"Worked"})};
const start = { ...START, day:1, hour:18, energy:5, health:100, money:100, karma:0, stimulantPacks:4, wakeStreak:0 };
describe("Moon Dust grinding",()=>{
 it("ignores energy costs after a dose, but preserves time costs",()=>{
  const first=runAction(start,STAY_AWAKE);expect(first.ok).toBe(true);if(!first.ok)return;
  expect(first.next.karma).toBe(-1);expect(first.next.energy).toBe(100);expect(first.next.wakeStreak).toBe(1);
  const after={...first.next,energy:0,hour:12};
  const grind=runAction(after,job);expect(grind.ok).toBe(true);if(!grind.ok)return;
  expect(grind.next.money).toBe(150);expect(grind.next.energy).toBe(100);expect(grind.next.hour).toBe(14);
  expect(runAction({...after,hour:23},job).ok).toBe(false);
 });
 it("charges karma on every dose and hospitalises on third consecutive skip",()=>{
  const a=runAction(start,STAY_AWAKE);if(!a.ok)throw Error(a.message);
  const b=runAction({...a.next,hour:22},STAY_AWAKE);if(!b.ok)throw Error(b.message);
  expect(b.next.karma).toBe(-2);expect(b.next.wakeStreak).toBe(2);
  const c=runAction({...b.next,hour:22},STAY_AWAKE);if(!c.ok)throw Error(c.message);
  expect(c.next.karma).toBe(-3);expect(c.next.wakeStreak).toBe(0);expect(c.next.medicalDebt).toBe(10000);
 });
 it("resets free energy after normal sleep",()=>{
  const a=runAction(start,STAY_AWAKE);if(!a.ok)throw Error(a.message);
  const slept=runAction({...a.next,hour:22,lastActiveDay:a.next.day},sleepAction({...a.next,hour:22,lastActiveDay:a.next.day}));
  expect(slept.ok).toBe(true);if(!slept.ok)return;
  expect(slept.next.wakeStreak).toBe(0);
  expect(runAction({...slept.next,energy:0,hour:12},job).ok).toBe(false);
 });
});