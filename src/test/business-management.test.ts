import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {runAction} from "@/lib/actions";
import {buyBusinessAction,hireBusinessManagerAction,expandBusinessAction,weeklyBusinessResult,settleBusinesses} from "@/lib/owned-businesses";

describe("business managers and expansion",()=>{
 const owner={...START,restaurantOwned:1,money:300000,businessLastDay:1};
 it("recruits only for owned businesses and charges upfront",()=>{
  expect(runAction(START,hireBusinessManagerAction("restaurant",1)).ok).toBe(false);
  const result=runAction(owner,hireBusinessManagerAction("restaurant",1));
  expect(result.ok).toBe(true);
  if(!result.ok)return;
  expect(result.next.restaurantManager).toBe(1);
  expect(result.next.money).toBe(298800);
  expect(runAction(result.next,hireBusinessManagerAction("restaurant",1)).ok).toBe(false);
 });
 it("manager salary is included in ongoing expenses",()=>{
  const noManager=weeklyBusinessResult(owner,"restaurant",3);
  const manager=weeklyBusinessResult({...owner,restaurantManager:1},"restaurant",3);
  expect(manager.revenue).toBeGreaterThan(noManager.revenue);
  expect(manager.expenses-noManager.expenses).toBe(420);
 });
 it("opens branches with real costs and applies profit or loss per branch",()=>{
  const result=runAction(owner,expandBusinessAction("restaurant"));
  expect(result.ok).toBe(true);if(!result.ok)return;
  expect(result.next.restaurantBranches).toBe(2);
  expect(result.next.money).toBe(220000);
  const base=settleBusinesses(owner,8);
  const twice=settleBusinesses({...owner,restaurantBranches:2},8);
  expect((twice.money??0)-owner.money).toBe(2*((base.money??0)-owner.money));
 });
 it("limits expansion to three branches and prevents debt-funded growth",()=>{
  expect(runAction({...owner,restaurantBranches:3},expandBusinessAction("restaurant")).ok).toBe(false);
  expect(runAction({...owner,businessDebt:100},expandBusinessAction("restaurant")).ok).toBe(false);
 });
 it("keeps established businesses on one branch for old saves",()=>{
  const base=settleBusinesses(owner,8);
  const one=settleBusinesses({...owner,restaurantBranches:1},8);
  expect(base).toEqual(one);
 });
});