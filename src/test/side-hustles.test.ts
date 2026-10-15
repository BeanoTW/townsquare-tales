import { describe,expect,it } from "vitest";
import { hustleAction } from "@/lib/side-hustles";
import { INITIAL_STATE } from "@/lib/game-data";
import { runAction } from "@/lib/actions";

describe("side hustles",()=>{
  it("pays for deliveries and consumes time and energy",()=>{
    const start={...INITIAL_STATE, money:100, hour:9, energy:100, day:3};
    const r=runAction(start,hustleAction("deliveries"),()=>0);
    expect(r.ok).toBe(true);
    if(r.ok){ expect(r.next.money).toBeGreaterThan(100);expect(r.next.hour).toBe(11);expect(r.next.energy).toBe(84); }
  });
  it("charges stock costs and can lose money on a bad market day",()=>{
    const start={...INITIAL_STATE,money:100,hour:9,energy:100,day:3,cha:0};
    const r=runAction(start,hustleAction("market-stall"),()=>0);
    expect(r.ok).toBe(true);
    if(r.ok)expect(r.next.money).toBe(100+Math.floor(65*0.35)-25);
  });
  it("limits jobs to three per day",()=>{
    const start={...INITIAL_STATE,money:100,hour:9,energy:100,day:3,sideHustleDay:3,sideHustlesToday:3};
    expect(runAction(start,hustleAction("deliveries"),()=>0).ok).toBe(false);
    expect(runAction({...start,day:4},hustleAction("deliveries"),()=>0).ok).toBe(true);
  });
});