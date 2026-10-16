import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {runAction,applyAction,shiftAction,PROMOTE} from "@/lib/actions";
import {trackXp,trackBest} from "@/lib/career-history";

describe("career-specific experience",()=>{
 it("starts in a different profession at zero XP without losing corporate history",()=>{
   const s={...START,career:0,job:3,xp:210,employed:0,money:100};
   const next=runAction(s,applyAction(1));
   expect(next.ok).toBe(true);
   if(!next.ok)return;
   expect(next.next.career).toBe(1);
   expect(next.next.job).toBe(0);
   expect(next.next.xp).toBe(0);
   expect(trackXp(next.next,0)).toBe(210);
   expect(trackBest(next.next,0)).toBe(3);
 });
 it("restores earned XP on returning to a previous career but rehires at entry level",()=>{
   const s={...START,career:1,job:2,xp:90,careerXp0:210,careerBest0:3,employed:0};
   const result=runAction(s,applyAction(0));
   expect(result.ok).toBe(true);
   if(!result.ok)return;
   expect(result.next.xp).toBe(210);
   expect(result.next.job).toBe(0);
   expect(trackXp(result.next,1)).toBe(90);
 });
 it("writes XP only to the current profession after a shift",()=>{
   const s={...START,employed:1,career:2,job:0,xp:12,careerXp0:200};
   const result=runAction(s,shiftAction(s));
   expect(result.ok).toBe(true);
   if(!result.ok)return;
   expect(result.next.careerXp2).toBe(16);
   expect(result.next.careerXp0).toBe(200);
 });
 it("continues recognising legacy saves without per-career fields",()=>{
   const legacy={...START,career:3,job:2,xp:150};
   expect(trackXp(legacy,3)).toBe(150);
   expect(trackBest(legacy,3)).toBe(2);
   expect(trackXp(legacy,0)).toBe(0);
 });
});