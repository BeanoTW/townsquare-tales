import { describe,expect,it } from "vitest";
import { START } from "@/lib/game-data";
import { runAction, housingAction, housingWeeklyCost, sleepAction, LIFT_WEIGHTS, studyGain } from "@/lib/actions";
import { CAREERS } from "@/lib/careers";
import { parseGame } from "@/lib/game-state";

describe("progression balancing and housing",()=>{
 it("raises experience requirements at every career step",()=>{
   for(const career of CAREERS){
     for(let i=1;i<career.roles.length;i++)expect(career.roles[i]!.experience).toBeGreaterThan(career.roles[i-1]!.experience);
     expect(career.roles[4]!.experience).toBeGreaterThanOrEqual(400);
   }
 });
 it("limits any single activity to at most two core stat points",()=>{
   expect(studyGain(2,4)).toBe(2);
   const r=runAction({...START,money:100,energy:100},LIFT_WEIGHTS);
   if(r.ok)expect(r.next.str-START.str).toBeLessThanOrEqual(2);
 });
 it("rents a flat and charges weekly on sleep while preserving owned homes",()=>{
   const start={...START,money:2000,day:1,hour:22};
   const rent=runAction(start,housingAction(start,1,1));
   expect(rent.ok).toBe(true);if(!rent.ok)return;
   expect(rent.next.house).toBe(1);
   expect(rent.next.ownedHomes).toBe(1);
   expect(housingWeeklyCost(rent.next)).toBe(300);
   const before={...rent.next,day:7,hour:22};
   const billed=runAction(before,sleepAction(before));
   expect(billed.ok).toBe(true);if(!billed.ok)return;
   expect(billed.next.money).toBe(rent.next.money-300);
   expect(billed.next.housingLastPaidDay).toBe(8);
   expect(parseGame(JSON.stringify(billed.next),START).housingMode).toBe(1);
 });
 it("mortgage takes a deposit, weekly instalments and eventually grants ownership",()=>{
   const start={...START,money:10000,day:1,hour:22};
   const loan=runAction(start,housingAction(start,1,2));
   expect(loan.ok).toBe(true);if(!loan.ok)return;
   expect(loan.next.money).toBe(6000);
   expect(loan.next.mortgageBalance).toBe(16000);
   const almost={...loan.next,day:7,hour:22,mortgageBalance:100};
   const done=runAction(almost,sleepAction(almost));
   expect(done.ok).toBe(true);if(!done.ok)return;
   expect(done.next.money).toBe(5900);
   expect(done.next.housingMode).toBe(0);
   expect((done.next.ownedHomes??0)&2).toBe(2);
 });
});
