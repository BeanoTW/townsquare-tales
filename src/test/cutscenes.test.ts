import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import type { GameState } from "@/lib/game-state";
import { planFor } from "@/lib/home3d/plans";
import { venuePlan } from "@/lib/home3d/venues";
import type { HomePlan } from "@/lib/home3d/layout";
import { gainsOf, planCutscene, ScenePlays, toWorld, type CutsceneRequest } from "@/lib/cutscenes";

const ALL_HOME = ["bed", "kitchen", "weights", "desk", "sofa", "tv", "console", "bookshelf"];
const base: GameState = { ...START, str: 12, int: 12, energy: 60, day: 3 };
const req = (actionId: string, after: Partial<GameState> = {}, before: Partial<GameState> = {}): Omit<CutsceneRequest, "slotId"> & { slotId: null } => ({
  actionId, slotId: null, changes: ["Strength: +2", "Energy: -20"], before: { ...base, ...before }, after: { ...base, ...after },
});
const ctx = (plays = new ScenePlays(), visibleSlotIds = ALL_HOME, luxury: Record<string, boolean> = {}) => ({ visibleSlotIds, luxury, hasBed: true, plays });
const studio = planFor(1)!;
const gym = venuePlan("gym")!;

/** The actor stands on or right beside the fixture they are using. */
function nearSlot(plan: HomePlan, slotId: string, x: number, z: number) {
  const s = plan.slots.find((q) => q.id === slotId)!;
  return Math.hypot(s.x - x, s.z - z) <= Math.max(s.w, s.d) / 2 + 1.2;
}

describe("in-world cutscenes", () => {
  it("acts out home actions at the fixture the action belongs to", () => {
    const expectations: [string, string, string][] = [
      ["sleep", "bed", "sleep"], ["cook", "kitchen", "cook"], ["study-desk", "desk", "type"],
      ["tv-science", "sofa", "watch"], ["tv-comedy", "sofa", "laugh"], ["tv-fitness", "sofa", "jacks"],
      ["game-puzzle", "sofa", "game"], ["read-fiction", "sofa", "read"], ["relax", "sofa", "relax"],
    ];
    for (const [action, slot, act] of expectations) {
      const cut = planCutscene(req(action), studio, ctx())!;
      expect(cut, action).not.toBeNull();
      expect([cut.slotId, cut.act]).toEqual([slot, act]);
      expect(nearSlot(studio, cut.slotId, cut.x, cut.z), action).toBe(true);
    }
  });

  it("rotates gym lifts through bench, squat and deadlift, and runs on a treadmill", () => {
    const plays = new ScenePlays();
    const acts = [0, 1, 2, 3].map(() => planCutscene(req("lift"), gym, ctx(plays, ["rack", "track"]))!.act);
    expect(acts).toEqual(["bench", "squat", "deadlift", "bench"]);
    const run = planCutscene(req("jog"), gym, ctx(new ScenePlays(), ["rack", "track"]))!;
    expect(run.act).toBe("run");
    expect(nearSlot(gym, "track", run.x, run.z)).toBe(true);
  });

  it("gives every home tier a workout scene with props in hand", () => {
    for (const tier of [0, 1, 2, 3] as const) {
      const plan = planFor(tier)!;
      const cut = planCutscene(req("home-workout"), plan, ctx())!;
      expect(cut.slotId).toBe("weights");
      expect(cut.held).not.toBeNull();
      expect(nearSlot(plan, "weights", cut.x, cut.z)).toBe(true);
    }
  });

  it("falls back when the fixture is missing, and leaves unknown actions to the card", () => {
    expect(planCutscene(req("relax"), studio, ctx(new ScenePlays(), ["bed"]))).toBeNull();
    // No sofa: TV is watched standing at the set.
    expect(planCutscene(req("tv-science"), studio, ctx(new ScenePlays(), ["tv"]))!.slotId).toBe("tv");
    expect(planCutscene(req("lift"), studio, ctx())).toBeNull();
    // A workplace with its fixture hidden can't stage the scene either.
    expect(planCutscene(req("shift"), venuePlan("diner")!, ctx(new ScenePlays(), ["counter"]))).toBeNull();
    expect(planCutscene(req("mug"), studio, ctx())).toBeNull();
  });

  it("plays in full the first time each day, then a short version", () => {
    const plays = new ScenePlays();
    const first = planCutscene(req("cook"), studio, ctx(plays))!;
    const again = planCutscene(req("cook"), studio, ctx(plays))!;
    const tomorrow = planCutscene(req("cook", {}, { day: 4 }), studio, ctx(plays))!;
    expect([first.short, again.short, tomorrow.short]).toEqual([false, true, false]);
    expect(again.duration).toBeLessThan(first.duration);
    expect(new Set([first.key, again.key, tomorrow.key]).size).toBe(3);
  });

  it("calls out milestones and exhaustion", () => {
    const pb = planCutscene(req("lift", { str: 20 }, { str: 18 }), gym, ctx(new ScenePlays(), ["rack"]))!;
    expect(pb.caption).toMatch(/PERSONAL BEST/);
    expect(pb.short).toBe(false);
    const brain = planCutscene(req("study-desk", { int: 30 }, { int: 29 }), studio, ctx())!;
    expect(brain.caption).toMatch(/BRAIN WAVE/);
    const tired = planCutscene(req("lift", { energy: 8 }), gym, ctx(new ScenePlays(), ["rack"]))!;
    expect([tired.tired, tired.caption]).toEqual([true, "RUNNING ON EMPTY"]);
    const sleepy = planCutscene(req("sleep", { energy: 5 }), studio, ctx())!;
    expect(sleepy.tired).toBe(false);
    expect(sleepy.night).toBe(true);
  });

  it("shows only gains as floating chips", () => {
    expect(gainsOf(["Strength: +2", "Energy: -20", "Cash: +40", "Charm: +1", "Intelligence: +1"])).toEqual(["Strength +2", "+$40", "Charm +1"]);
  });

  it("maps fixture-local marks the same way the renderer rotates slots", () => {
    const slot = { ...studio.slots[0]!, x: 2, z: 3, rot: Math.PI / 2 };
    // A slot rotated a quarter turn faces +x: one metre "in front" is one metre east.
    const p = toWorld(slot, 0, 1);
    expect(p.x).toBeCloseTo(3);
    expect(p.z).toBeCloseTo(3);
  });
});
