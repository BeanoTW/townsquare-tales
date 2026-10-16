import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import { runAction, buyCaffeineAction, sleepAction } from "@/lib/actions";
import { sleepOutcome } from "@/lib/day-cycle";
import { parseGame } from "@/lib/game-state";

describe("caffeine pills and early alarms", () => {
  it("sells a single pill for $75 and persists stock", () => {
    const r=runAction({...START,money:100},buyCaffeineAction());
    expect(r.ok).toBe(true);
    if(!r.ok)return;
    expect(r.next.money).toBe(25);
    expect(parseGame(JSON.stringify(r.next),START).caffeinePills).toBe(1);
  });
  it("wakes at seven with clock and pill, consuming one only on sleep", () => {
    const state={...START,hour:22,energy:30,alarm:1,caffeinePills:2};
    expect(sleepOutcome(state).hour).toBe(7);
    const r=runAction(state,sleepAction(state));
    expect(r.ok).toBe(true);
    if(!r.ok)return;
    expect(r.next.hour).toBe(7);
    expect(r.next.caffeinePills).toBe(1);
  });
  it("caffeine alone matches the alarm boost and is consumed", () => {
    const state={...START,hour:22,alarm:0,caffeinePills:1};
    expect(sleepOutcome(state).hour).toBe(sleepOutcome({...state,alarm:1,caffeinePills:0}).hour);
    const r=runAction(state,sleepAction(state));
    expect(r.ok).toBe(true);
    if(r.ok)expect(r.next.caffeinePills).toBe(0);
  });
});
