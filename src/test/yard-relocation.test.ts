import {describe,it,expect} from "vitest";
import {buildings} from "@/lib/town-world";
import {townHallBuilt} from "@/lib/civic-career";
describe("Workers Yard relocation milestone",()=>{
 it("retains the original work site before the driving milestone",()=>{
   const yard=buildings(0,false,false).find(b=>b.id==="yard")!;
   expect(yard.x).toBe(19.5);expect(yard.y).toBe(22.8);
 });
 it("relocates the full office beyond the police station once transport is unlocked",()=>{
   const bs=buildings(0,false,true);
   const yard=bs.find(b=>b.id==="yard")!;
   const police=bs.find(b=>b.id==="police")!;
   expect(yard.x).toBeGreaterThan(police.x+police.w);
   expect(yard.y).toBeGreaterThanOrEqual(police.y);
   expect(yard.facing).toBe("south");
   expect(bs.filter(b=>b.id==="yard")).toHaveLength(1);
 });
 it("keeps all other workplaces where they are",()=>{
   const before=buildings(1,false,false).filter(b=>b.id!=="yard");
   const after=buildings(1,false,true).filter(b=>b.id!=="yard");
   expect(after).toEqual(before);
 });
 it("Town Hall completes at day 30 independently of the car",()=>{
   expect(townHallBuilt({day:29})).toBe(false);
   expect(townHallBuilt({day:30})).toBe(true);
 });
});