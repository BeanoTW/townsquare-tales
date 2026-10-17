import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {runAction,sleepAction,HOME_WORKOUT} from "@/lib/actions";
import {parseGame} from "@/lib/game-state";
describe("no repeat idle sleep",()=>{
 it("lets first sleep end the day, then blocks next sleep if nothing was done",()=>{
  const first=runAction(START,sleepAction(START));
  expect(first.ok).toBe(true);if(!first.ok)return;
  const again=runAction(first.next,sleepAction(first.next));
  expect(again.ok).toBe(false);if(!again.ok)expect(again.message).toMatch(/mattress/i);
  expect(first.next.day).toBe(2);
 });
 it("allows sleeping after a successful activity on the day you woke",()=>{
  const first=runAction(START,sleepAction(START));
  if(!first.ok)throw Error(first.message);
  const activity=runAction(first.next,HOME_WORKOUT);
  if(!activity.ok)throw Error(activity.message);
  const second=runAction(activity.next,sleepAction(activity.next));
  expect(second.ok).toBe(true);
  if(second.ok)expect(second.next.day).toBe(3);
 });
 it("does not advance day, accrue interest or use a caffeine tablet when blocked",()=>{
  const initial={...START,day:11,lastSleepDay:11,lastActiveDay:10,caffeinePills:1};
  const outcome=runAction(initial,sleepAction(initial));
  expect(outcome.ok).toBe(false);
  expect(initial.caffeinePills).toBe(1);
  expect(initial.day).toBe(11);
 });
 it("preserves compatibility with old saves lacking the tracking fields",()=>{
  const old=parseGame(JSON.stringify({...START,day:43}),START);
  expect(runAction(old,sleepAction(old)).ok).toBe(true);
 });
});
