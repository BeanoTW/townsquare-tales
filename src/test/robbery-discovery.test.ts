import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {robberyBlock,robberyChance,robTill,weaponBlock} from "@/lib/counter-robbery";
import {runAction} from "@/lib/actions";
describe("robbery discovery rules",()=>{
 it("keeps the attempt blocked when unarmed",()=>expect(robberyBlock({...START,weapon:0})).toBeTruthy());
 it("allows an uncertain attempt with a battered bat",()=>expect(robberyBlock({...START,weapon:1})).toBeNull());
 it("makes cunning matter without making the heavy bat a guarantee",()=>{
  const basic={...START,weapon:1,cha:5,streetSmarts:0,str:15};
  expect(robberyChance({...basic,streetSmarts:50})).toBeGreaterThan(robberyChance(basic));
  expect(robberyChance({...basic,weapon:2})).toBeGreaterThan(robberyChance(basic));
  expect(robberyChance({...basic,weapon:2})).toBeLessThan(1);
 });
 it("does not expose hidden supplier numeric gates",()=>expect(weaponBlock({...START,gangStage:0,gangRep:0,criminalTrust:0},2)).not.toMatch(/stage 2|reputation 12|trust 30/i));
 it("records consequences when a low-grade weapon attempt fails",()=>{
  const s={...START,weapon:1,energy:100};
  const o=runAction(s,robTill("shop"),()=>0.99);
  expect(o.ok).toBe(true);if(o.ok)expect(o.next).toMatchObject({tillRobberyDay:s.day,karma:s.karma-6});
 });
});
