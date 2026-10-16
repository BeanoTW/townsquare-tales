import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import { runAction, housingAction, buyHouseAction, sleepAction } from "@/lib/actions";
import { hustleAction } from "@/lib/side-hustles";

describe("economy foundation balance", () => {
 it("keeps starter side work supplementary rather than a wage replacement", () => {
   const state={...START,money:100,energy:100,hour:8,str:5,cha:5};
   for(const id of ["deliveries","odd-jobs","market-stall"] as const){
     const r=runAction(state,hustleAction(id),()=>0.5);
     expect(r.ok).toBe(true);
     if(r.ok)expect(r.next.money-state.money).toBeLessThanOrEqual(60);
   }
 });
 it("does not allow renewing the same rental agreement to reset the weekly clock",()=>{
   const state={...START,money:2000,house:1,housingMode:1,housingTier:1,housingLastPaidDay:1,day:7};
   const r=runAction(state,housingAction(state,1,1));
   expect(r.ok).toBe(false);
 });
 it("does not let rent arrears disappear when changing properties",()=>{
   const state={...START,money:20000,house:1,housingMode:1,housingTier:1,housingArrears:500,housingLastPaidDay:1,day:8};
   expect(runAction(state,housingAction(state,2,1)).ok).toBe(false);
   expect(runAction(state,buyHouseAction(state,2)).ok).toBe(false);
 });
 it("charges rent every full seven-day interval",()=>{
   const state={...START,money:1200,house:1,housingMode:1,housingTier:1,housingLastPaidDay:1,day:7,hour:22};
   const r=runAction(state,sleepAction(state));
   expect(r.ok).toBe(true);
   if(r.ok){expect(r.next.money).toBe(900);expect(r.next.housingLastPaidDay).toBe(8);}
 });
});
