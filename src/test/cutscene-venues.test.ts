import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import type { GameState } from "@/lib/game-state";
import { venuePlan } from "@/lib/home3d/venues";
import type { HomePlan } from "@/lib/home3d/layout";
import { lossesOf, gainsOf, planCutscene, ScenePlays, type Cutscene } from "@/lib/cutscenes";

const base: GameState = { ...START, money: 500, str: 12, int: 12, energy: 60, day: 5, employed: 1, job: 1 };
const plan = (v: string) => venuePlan(v as never) as HomePlan;
function play(venue: string, actionId: string, after: Partial<GameState> = {}, changes: string[] = []): Cutscene | null {
  const p = plan(venue);
  return planCutscene({ actionId, slotId: null, changes, before: base, after: { ...base, ...after } }, p, {
    visibleSlotIds: p.slots.map((s) => s.id), luxury: {}, hasBed: true, plays: new ScenePlays(),
  });
}

/** Every venue action that should now act out in-world, and the act it gets. */
const SCENES: [string, string, string][] = [
  ["work", "shift", "type"], ["work", "promote", "promote"], ["work", "apply-1", "apply"], ["work", "quit-job", "resign"],
  ["yard", "shift", "shovel"], ["yard", "promote", "promote"],
  ["diner", "shift", "flip"], ["diner", "lunch-shift", "serve"], ["diner", "hot-meal", "eat"], ["diner", "promote", "promote"],
  ["shop", "shift", "scan"], ["shop", "buy-shoes", "pay"], ["shop", "snack", "munch"], ["shop", "promote", "promote"],
  ["furniture", "furniture-sofa", "bounce"], ["furniture", "furniture-luxury-bed", "flop"], ["furniture", "furniture-tv", "pay"],
  ["bank", "deposit-50", "pay"], ["bank", "withdraw-all", "atm"], ["bank", "bank-loan-1000", "sign"],
  ["school", "library", "read"], ["school", "enroll", "write"],
  ["clinic", "recovery", "heal"],
  ["depot", "departures", "board"], ["depot", "hustle-deliveries", "carry"],
  ["pawn", "sell-shoes", "sell"], ["police", "fine", "payfine"],
  ["bar", "round", "drink"], ["bar", "chat-up", "dance"],
];

describe("venue cutscenes", () => {
  it("acts out every venue action at its fixture", () => {
    for (const [venue, action, act] of SCENES) {
      const cut = play(venue, action);
      expect(cut, `${venue}/${action}`).not.toBeNull();
      expect(cut!.act, `${venue}/${action}`).toBe(act);
      const p = plan(venue);
      // The actor stays inside the room.
      expect(cut!.x).toBeGreaterThan(0); expect(cut!.x).toBeLessThan(p.size.w);
      expect(cut!.z).toBeGreaterThan(0); expect(cut!.z).toBeLessThan(p.size.d);
    }
  });

  it("only cues staff and regulars who are actually in the room", () => {
    for (const [venue, action] of SCENES) {
      const ids = new Set((plan(venue).npcs ?? []).map((n) => n.id));
      for (const c of play(venue, action)!.cast) expect(ids.has(c.id), `${venue}/${action} → ${c.id}`).toBe(true);
    }
  });

  it("plays the dice win and loss differently", () => {
    const win = play("casino", "high-dice", { money: 700 }, ["Cash: +200"])!;
    const lose = play("casino", "high-dice", { money: 300 }, ["Cash: -200"])!;
    expect([win.act, win.caption, win.gains]).toEqual(["dice-win", "LUCKY ROLL!", ["+$200"]]);
    expect([lose.act, lose.caption, lose.losses]).toEqual(["dice-lose", "SNAKE EYES", ["−$200"]]);
    expect(win.cast.some((c) => c.cue === "cheer")).toBe(true);
    expect(lose.cast.some((c) => c.cue === "cheer")).toBe(false);
  });

  it("runs off with the till, or trips and gets caught", () => {
    for (const venue of ["shop", "pawn", "furniture", "diner", "bar"]) {
      const ok = play(venue, `rob-till-${venue}`, { money: 600 })!;
      const bust = play(venue, `rob-till-${venue}`, { money: 480 })!;
      expect([ok.act, bust.act], venue).toEqual(["rob", "caught"]);
      expect(bust.caption).toBe("CAUGHT RED-HANDED");
      // The camera leads the getaway rather than staring at the empty counter.
      expect(Math.hypot(ok.frame.tx - ok.x, ok.frame.tz - ok.z)).toBeGreaterThan(1);
    }
  });

  it("celebrates promotions, hires and enrolments", () => {
    expect(play("work", "promote", { job: 2 })!.caption).toBe("PROMOTED!");
    expect(play("work", "promote")!.caption).toBeNull();
    expect(play("yard", "apply-3")!.caption).toBe("YOU'RE HIRED!");
    expect(play("school", "enroll", { school: base.school + 1 })!.caption).toBe("ENROLLED!");
  });

  it("alternates shift variants so repeated grinding doesn't look identical", () => {
    const p = plan("yard"); const plays = new ScenePlays();
    const acts = [0, 1, 2].map(() => planCutscene({ actionId: "shift", slotId: null, changes: [], before: base, after: base }, p, { visibleSlotIds: p.slots.map((s) => s.id), luxury: {}, hasBed: true, plays })!.act);
    expect(acts).toEqual(["shovel", "carry", "shovel"]);
  });

  it("leaves minigames and venue-less actions to their own screens", () => {
    expect(play("casino", "slots")).toBeNull();
    expect(play("work", "snack")).toBeNull();
    expect(play("police", "rob-till-police")).toBeNull();
  });

  it("formats money as gains and losses", () => {
    expect(gainsOf(["Cash: +35", "Work XP: +4", "Job: +1"])).toEqual(["+$35", "Work XP +4"]);
    expect(lossesOf(["Cash: -40", "Energy: +100"])).toEqual(["−$40"]);
  });
});
