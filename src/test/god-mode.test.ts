import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import { grantGodPowers, parseGodSave, runGodAction } from "@/lib/god-mode";
import { LIFT_WEIGHTS, STUDY_LIBRARY, SLOTS } from "@/lib/actions";

describe("God Mode sandbox", () => {
  it("maxes resources and progression without mutating the original state", () => {
    const original={...START};
    const god=grantGodPowers(original);
    expect(god).toMatchObject({money:1e12, bank:1e12, energy:100, str:1e6, int:1e6, cha:1e6, xp:1e6, house:3, school:4, job:4, furniture:63});
    expect(original).toEqual(START);
  });
  it("executes activities repeatedly with infinite time and energy", () => {
    const god=grantGodPowers({...START,hour:23});
    const first=runGodAction(god,LIFT_WEIGHTS);
    expect(first.ok).toBe(true);
    if(!first.ok)return;
    expect(first.next.hour).toBe(23);
    expect(first.next.energy).toBe(100);
    expect(first.next.str).toBe(1e6);
    const second=runGodAction(first.next,STUDY_LIBRARY);
    expect(second.ok).toBe(true);
    if(!second.ok)return;
    expect(second.next.hour).toBe(23);
    expect(second.next.int).toBe(1e6);
  });
  it("keeps wealth unlimited even after gambling losses", () => {
    const result=runGodAction(grantGodPowers(START),SLOTS,()=>0);
    if(!result.ok)throw Error(result.message);
    expect(result.next.money).toBe(1e12);
  });
  it("restores powered sandbox records and falls back safely", () => {
    expect(parseGodSave("broken",START).money).toBe(1e12);
    expect(parseGodSave(JSON.stringify({...START,day:7}),START).day).toBe(7);
  });
});
