import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {runAction} from "@/lib/actions";
import {buyLaptopAction,marketAction,marketUnlocked,sharePrice} from "@/lib/investing";
import {mailFor,markRead,hasRead} from "@/lib/town-mail";
import {parseGame} from "@/lib/game-state";

describe("MegaCorp investment progression",()=>{
 it("requires Analyst experience, retaining it after career changes",()=>{
  expect(marketUnlocked({...START,career:0,job:1})).toBe(false);
  expect(marketUnlocked({...START,career:0,job:2})).toBe(true);
  expect(marketUnlocked({...START,career:1,job:0,careerBest0:2})).toBe(true);
 });
 it("requires powered housing and charges a one-off laptop purchase",()=>{
  expect(runAction({...START,money:3000},buyLaptopAction()).ok).toBe(false);
  const s={...START,house:1,money:3000};
  const r=runAction(s,buyLaptopAction());
  expect(r.ok).toBe(true);
  if(r.ok){expect(r.next.money).toBe(500);expect(r.next.laptop).toBe(1);}
 });
 it("trades shares with fees, never profitable to buy and instantly resell",()=>{
  const s={...START,day:12,house:1,money:10000,laptop:1,careerBest0:2};
  const b=runAction(s,marketAction("buy",10));
  expect(b.ok).toBe(true);if(!b.ok)return;
  expect(b.next.marketShares).toBe(10);
  const sale=runAction(b.next,marketAction("sell",10));
  expect(sale.ok).toBe(true);if(!sale.ok)return;
  expect(sale.next.marketShares).toBe(0);
  expect(sale.next.money).toBeLessThan(10000);
  expect(sharePrice(s.day)).toBe(sharePrice(s.day));
 });
 it("blocks trades without access or shares and retains holdings in saves",()=>{
  expect(runAction({...START,money:5000},marketAction("buy",1)).ok).toBe(false);
  const s={...START,house:1,laptop:1,careerBest0:2,marketShares:7};
  expect(runAction(s,marketAction("sell",10)).ok).toBe(false);
  expect(parseGame(JSON.stringify(s),START).marketShares).toBe(7);
 });
 it("sends a lasting readable investing letter",()=>{
  const s={...START,day:9,careerBest0:2};
  expect(mailFor(s).some(l=>l.id===11)).toBe(true);
  expect(hasRead(markRead(s,11),11)).toBe(true);
  expect(parseGame(JSON.stringify(markRead(s,11)),START).mailReadMask).toBe(2048);
 });
});