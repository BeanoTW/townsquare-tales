import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import { runAction, sleepAction } from "@/lib/actions";
import { CONTRACTS, contractOutcome, settleContract, startContractAction } from "@/lib/construction-contracts";
import { trackBest } from "@/lib/career-history";

describe("construction contract economy",()=>{
 it("requires construction career experience and enough capital",()=>{
  expect(runAction({...START,money:50000},startContractAction(3)).ok).toBe(false);
  expect(runAction({...START,careerBest3:3,money:200},startContractAction(3)).ok).toBe(false);
  const accepted=runAction({...START,careerBest3:1,money:1000},startContractAction(1));
  expect(accepted.ok).toBe(true);
  if(!accepted.ok)return;
  expect(accepted.next.money).toBe(550);
  expect(accepted.next.contractType).toBe(1);
  expect(accepted.next.contractDueDay).toBe(START.day+3);
  expect(runAction(accepted.next,startContractAction(1)).ok).toBe(false);
 });
 it("uses deterministic outcomes that can be profitable or loss-making",()=>{
  const s={...START,careerBest3:1};
  const outcomes=Array.from({length:80},(_,i)=>contractOutcome(s,1,i+5)!);
  expect(outcomes.some(x=>x.net<0)).toBe(true);
  expect(outcomes.some(x=>x.net>0)).toBe(true);
  expect(contractOutcome(s,1,12)).toEqual(contractOutcome(s,1,12));
 });
 it("settles exactly on completion day, not before",()=>{
  const s={...START,day:3,contractType:1,contractDueDay:5,money:500};
  expect(settleContract(s,4)).toEqual({});
  const end=settleContract(s,5);
  expect(end.contractType).toBe(0);
  expect(end.contractDueDay).toBe(0);
 });
 it("preserves construction receipts alongside housing charges on sleep",()=>{
  const s={...START,day:7,hour:22,house:1,money:1000,careerBest3:1,contractType:1,contractDueDay:8,housingMode:1,housingTier:1,housingLastPaidDay:1};
  const completed=settleContract(s,8);
  const r=runAction(s,sleepAction(s));
  expect(r.ok).toBe(true);
  if(r.ok){expect(r.next.contractType).toBe(0);expect(r.next.money).toBe((completed.money??s.money)-300);}
 });
 it("never requires quitting an existing job to run independent contracts",()=>{
  const s={...START,career:0,job:2,employed:1,careerBest3:2,money:9000};
  expect(runAction(s,startContractAction(2)).ok).toBe(true);
 });
});