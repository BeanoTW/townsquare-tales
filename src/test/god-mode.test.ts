import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import { grantGodPowers, parseGodSave, runGodAction } from "@/lib/god-mode";
import { LIFT_WEIGHTS, STUDY_LIBRARY, SLOTS } from "@/lib/actions";

describe("God Mode sandbox", () => {
  it("boosts developer resources without completing progression", () => {
    const original={...START};
    const god=grantGodPowers(original);
    expect(god).toMatchObject({money:1e12, bank:1e12, energy:100, xp:1e6, str:5, int:5, cha:5, house:0, school:0, job:0, furniture:0, skateboard:0});
    expect(original).toEqual(START);
  });
  it("executes activities repeatedly with infinite time and energy", () => {
    const god=grantGodPowers({...START,hour:23});
    const first=runGodAction(god,LIFT_WEIGHTS);
    expect(first.ok).toBe(true);
    if(!first.ok)return;
    expect(first.next.hour).toBe(23);
    expect(first.next.energy).toBe(100);
    expect(first.next.str).toBeGreaterThan(god.str);
    const second=runGodAction(first.next,STUDY_LIBRARY);
    expect(second.ok).toBe(true);
    if(!second.ok)return;
    expect(second.next.hour).toBe(23);
    expect(second.next.int).toBeGreaterThan(first.next.int);
  });
  it("does not bypass normal house purchase and job promotion decisions", () => {
    const developer = grantGodPowers(START);
    expect(developer.house).toBe(0);
    expect(developer.job).toBe(0);
    expect(developer.school).toBe(0);
    expect(developer.furniture).toBe(0);
  });
  it("keeps wealth unlimited even after gambling losses", () => {
    const result=runGodAction(grantGodPowers(START),SLOTS,()=>0);
    if(!result.ok)throw Error(result.message);
    expect(result.next.money).toBe(1e12);
  });
  it("rejects malformed sandbox fields rather than allowing corrupted save values", () => {
    const restored = parseGodSave(JSON.stringify({
      ...START, day: -900, hour: 10000, karma: "bad", lastMara: -12, relNox: 500, snacks: 99999,
    }), START);
    expect(restored.day).toBe(1);
    expect(restored.hour).toBe(24);
    expect(restored.karma).toBe(0);
    expect(restored.lastMara).toBe(0);
    expect(restored.relNox).toBe(10);
    expect(restored.snacks).toBe(99);
  });
  it("restores powered sandbox records and falls back safely", () => {
    expect(parseGodSave("broken",START).money).toBe(1e12);
    expect(parseGodSave(JSON.stringify({...START,day:7}),START).day).toBe(7);
  });
});

it("preserves the real hour for contextual rules while bypassing action costs",()=>{
  const result=runGodAction({...START,hour:23},{id:"context-check",label:"Context",hours:2,energy:200,resolve:s=>({patch:{int:s.int+1},message:`Clock ${s.hour}`})});
  if(!result.ok)throw Error(result.message);
  expect(result.message).toBe("Clock 23");
  expect(result.next.hour).toBe(23);expect(result.hoursUsed).toBe(0);
});
