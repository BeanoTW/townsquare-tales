import {describe,it,expect} from "vitest";
import {sleepOutcome,timeLabel} from "@/lib/day-cycle";
const base={hour:21,energy:15,house:0,furniture:0,alarm:0};
describe("sleep and daily schedule",()=>{
 it("poor shelter leaves fewer productive hours",()=>{
  expect(sleepOutcome(base).hour).toBe(11);
  expect(sleepOutcome({...base,house:3}).hour).toBe(8);
 });
 it("bed and alarm independently improve wake time",()=>{
  expect(sleepOutcome({...base,furniture:1}).hour).toBe(10);
  expect(sleepOutcome({...base,alarm:1}).hour).toBe(9);
  expect(sleepOutcome({...base,furniture:1,alarm:1}).hour).toBe(8);
 });
 it("late bedtimes reduce recovery and delay morning",()=>{
  const early=sleepOutcome({...base,hour:21});
  const late=sleepOutcome({...base,hour:24});
  expect(late.hour).toBeGreaterThan(early.hour);
  expect(late.energy).toBeLessThan(early.energy);
 });
 it("sleep cannot overfill energy and time is 24-hour format",()=>{
  expect(sleepOutcome({...base,energy:98,house:3}).energy).toBe(100);
  expect(timeLabel(7)).toBe("07:00");
 });
});