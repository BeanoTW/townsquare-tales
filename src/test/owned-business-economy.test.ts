import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {runAction,sleepAction} from "@/lib/actions";
import {buyBusinessAction,weeklyBusinessResult,settleBusinesses} from "@/lib/owned-businesses";

describe("business ownership economy",()=>{
 it("buys existing restaurant or retail businesses with sufficient capital",()=>{
  const s={...START,money:90000};
  const r=runAction(s,buyBusinessAction("restaurant"));
  expect(r.ok).toBe(true);
  if(r.ok){
   expect(r.next.restaurantOwned).toBe(1);
   expect(r.next.money).toBe(10000);
   expect(runAction(r.next,buyBusinessAction("restaurant")).ok).toBe(false);
  }
 });
 it("hospitality experience improves restaurant margin substantially",()=>{
  const novice=weeklyBusinessResult({...START}, "restaurant",5);
  const veteran=weeklyBusinessResult({...START,careerBest1:4},"restaurant",5);
  expect(veteran.profit).toBeGreaterThan(novice.profit+2000);
 });
 it("retail expertise benefits retail and lowers restaurant procurement expenses",()=>{
  const base=weeklyBusinessResult(START,"restaurant",3);
  const veteran=weeklyBusinessResult({...START,careerBest2:4},"restaurant",3);
  expect(veteran.expenses).toBeLessThan(base.expenses);
  expect(weeklyBusinessResult({...START,careerBest2:4},"retail",3).profit).toBeGreaterThan(weeklyBusinessResult(START,"retail",3).profit);
 });
 it("only settles completed weeks and records losses instead of negative cash",()=>{
  const s={...START,restaurantOwned:1,businessLastDay:1,money:0};
  expect(settleBusinesses(s,7)).toEqual({});
  const result=settleBusinesses(s,8);
  expect(result.businessLastDay).toBe(8);
  expect((result.money??0)).toBeGreaterThanOrEqual(0);
  expect((result.businessDebt??0)).toBeGreaterThanOrEqual(0);
 });
 it("business proceeds remain when housing payment is due on the same sleep",()=>{
  const s={...START,day:7,hour:22,money:1000,restaurantOwned:1,businessLastDay:1,house:1,housingMode:1,housingTier:1,housingLastPaidDay:1};
  const r=runAction(s,sleepAction(s));
  expect(r.ok).toBe(true);
  if(r.ok){const outcome=settleBusinesses(s,8);expect(r.next.money).toBe((outcome.money??1000)-300);}
 });
});