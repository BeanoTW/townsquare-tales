import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import { finishRail, hasEquippedBoard } from "@/lib/minigames";
import {
  APPROACH_MS, GRIND_MS, JUMP_MS, MAX_LEVEL, SAFE, fallReason, instability, jumpWindow, newRun, pressJump, scoreRun,
  stepRun, trickName, unlockedLevel, wobble, type RailRun,
} from "@/lib/rail-grind";

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Start a run and get it onto the rail with a perfect jump. */
function onRail(level: number, seed = 1): RailRun {
  const run = newRun(level, seeded(seed));
  const w = jumpWindow(level);
  stepRun(run, (w.perfectFrom + w.perfectTo) / 2, 0);
  expect(pressJump(run, seeded(seed + 100))).toBe("jumped");
  stepRun(run, JUMP_MS + 20, 0);
  expect(run.phase).toBe("grind");
  return run;
}
/** A player with ~110 ms reaction time leaning against the drift. */
function play(run: RailRun, reactMs = 110, until = 6000) {
  const queue: number[] = [];
  const delay = Math.round(reactMs / 16);
  let elapsed = 0;
  while (run.phase === "grind" && elapsed < until) {
    queue.push(-Math.sign(run.b + 0.3 * run.v));
    const input = queue.length > delay ? queue.shift()! : 0;
    stepRun(run, 16, input);
    elapsed += 16;
  }
  return run;
}

describe("rail grind balance", () => {
  it("needs continuous input: doing nothing always falls well before four seconds", () => {
    for (let level = 1; level <= MAX_LEVEL; level++)
      for (let seed = 1; seed <= 20; seed++) {
        const run = onRail(level, seed);
        stepRun(run, 6000, 0);
        expect(run.outcome, `L${level} s${seed} kick ${run.kick} p ${run.p1} f ${run.f1}`).toBe("fell");
        expect(run.grindMs).toBeLessThan(GRIND_MS);
      }
  });
  it("holding one direction the whole time also falls (no single-input solution)", () => {
    for (const dir of [-1, 1])
      for (let level = 1; level <= MAX_LEVEL; level++) {
        const run = onRail(level, 3);
        stepRun(run, 6000, dir);
        expect(run.outcome).toBe("fell");
      }
  });
  it("a single early tap then nothing still falls", () => {
    const run = onRail(2, 5);
    stepRun(run, 200, -Math.sign(run.b || 1));
    stepRun(run, 6000, 0);
    expect(run.outcome).toBe("fell");
  });
  it("active, timely correction completes the full four seconds at every level", () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      let clean = 0;
      for (let seed = 1; seed <= 20; seed++) {
        const run = play(onRail(level, seed));
        if (run.outcome === "clean") {
          clean++;
          expect(run.grindMs).toBe(GRIND_MS);
        }
      }
      expect(clean).toBeGreaterThanOrEqual(18);
    }
  });
  it("completion happens exactly at four seconds of grinding", () => {
    const run = onRail(1, 2);
    let guard = 0;
    while (run.phase === "grind" && guard++ < 1000) stepRun(run, 16, -Math.sign(run.b + 0.3 * run.v));
    expect(run.outcome).toBe("clean");
    expect(run.grindMs).toBe(GRIND_MS);
    stepRun(run, 2000, 0);
    expect(run.phase).toBe("done");
  });
  it("difficulty ramps up through the grind and with the level", () => {
    expect(instability(1, GRIND_MS)).toBeGreaterThan(instability(1, 0));
    for (let l = 2; l <= MAX_LEVEL; l++) expect(instability(l, 0)).toBeGreaterThan(instability(l - 1, 0));
    const r = newRun(3, seeded(9));
    const early = Math.abs(wobble(r, 0));
    expect(early).toBeLessThan(2);
    // slower reactions fail more often at the hardest level
    let slowFalls = 0;
    for (let seed = 1; seed <= 20; seed++) if (play(onRail(MAX_LEVEL, seed), 380).outcome === "fell") slowFalls++;
    expect(slowFalls).toBeGreaterThan(8);
  });
  it("falls when the marker leaves the safe zone for too long, and says which way", () => {
    const run = onRail(1, 4);
    run.b = SAFE + 0.2;
    run.v = 0.0;
    stepRun(run, 600, 0);
    expect(run.outcome).toBe("fell");
    expect(fallReason(run)).toMatch(/right/i);
  });
  it("a brief brush outside the safe zone is forgiven", () => {
    const run = onRail(1, 4);
    run.b = SAFE + 0.02;
    stepRun(run, 48, -1);
    expect(run.phase).toBe("grind");
  });
});

describe("rail grind jump", () => {
  it("ignores a too-early press and keeps rolling", () => {
    const run = newRun(2, seeded(1));
    stepRun(run, 100, 0);
    expect(pressJump(run)).toBe("early");
    expect(run.phase).toBe("approach");
    const w = jumpWindow(2);
    stepRun(run, Math.max(0, w.open + 5 - 100), 0);
    expect(pressJump(run)).toBe("jumped");
    expect(run.jump).toBe("good");
  });
  it("a perfect jump starts centred; later jumps start slightly off-centre", () => {
    const w = jumpWindow(1);
    const a = newRun(1, seeded(1));
    stepRun(a, (w.perfectFrom + w.perfectTo) / 2, 0);
    pressJump(a);
    expect(a.jump).toBe("perfect");
    expect(Math.abs(a.b)).toBe(0);
    const b = newRun(1, seeded(1));
    stepRun(b, w.close - 5, 0);
    pressJump(b);
    expect(b.jump).toBe("late");
    expect(Math.abs(b.b)).toBeGreaterThan(0.1);
  });
  it("never jumping ends the run as a missed jump", () => {
    const run = newRun(1, seeded(1));
    stepRun(run, APPROACH_MS + 500, 0);
    expect(run.outcome).toBe("missed-jump");
    expect(fallReason(run)).toMatch(/never jumped/i);
    stepRun(run, 3000, 0);
    expect(run.phase).toBe("done");
  });
  it("jump presses outside the approach are ignored", () => {
    const run = onRail(1, 2);
    expect(pressJump(run)).toBe("ignored");
  });
  it("the window tightens at higher levels", () => {
    const a = jumpWindow(1);
    const b = jumpWindow(MAX_LEVEL);
    expect(APPROACH_MS - b.open).toBeLessThan(APPROACH_MS - a.open);
  });
});

describe("rail grind scoring, records and requirements", () => {
  it("a clean grind outscores a fall, and records update", () => {
    const clean = play(onRail(2, 2));
    expect(clean.outcome).toBe("clean");
    const fell = onRail(2, 2);
    stepRun(fell, 6000, 0);
    expect(scoreRun(clean)).toBeGreaterThan(scoreRun(fell));
    expect(trickName(clean)).toContain("Boardslide");
    const base = { ...START, day: 5, cha: 10 };
    const win = finishRail(base, { level: 2, success: true, balancedMs: clean.streakMs });
    expect(win.next.railGrinds).toBe(1);
    expect(win.next.railLevel).toBe(2);
    expect(win.next.railLongest).toBeGreaterThan(1000);
    expect(win.next.cha).toBe(11);
    const lose = finishRail(win.next, { level: 3, success: false, balancedMs: 900 });
    expect(lose.next.railFalls).toBe(1);
    expect(lose.next.cha).toBe(11);
    expect(lose.next.railLevel).toBe(2);
  });
  it("Charm is rewarded once per day only", () => {
    const base = { ...START, day: 5, cha: 10 };
    const a = finishRail(base, { level: 1, success: true, balancedMs: 4000 });
    const b = finishRail(a.next, { level: 1, success: true, balancedMs: 4000 });
    expect(b.next.cha).toBe(a.next.cha);
    expect(b.next.railGrinds).toBe(2);
    const nextDay = finishRail({ ...b.next, day: 6 }, { level: 1, success: true, balancedMs: 4000 });
    expect(nextDay.next.cha).toBe(a.next.cha + 1);
  });
  it("levels unlock one at a time and cap at the maximum", () => {
    expect(unlockedLevel(0)).toBe(1);
    expect(unlockedLevel(2)).toBe(3);
    expect(unlockedLevel(5)).toBe(MAX_LEVEL);
    expect(unlockedLevel(99)).toBe(MAX_LEVEL);
  });
  it("requires an owned and equipped skateboard", () => {
    expect(hasEquippedBoard({ ...START, skateboard: 0, skateboardEquipped: 0 } as never)).toBe(false);
    expect(hasEquippedBoard({ ...START, skateboard: 1, skateboardEquipped: 0 } as never)).toBe(false);
    expect(hasEquippedBoard({ ...START, skateboard: 1, skateboardEquipped: 1 } as never)).toBe(true);
  });
});

import { SCENE, poseAt } from "@/lib/rail-grind";
describe("rail grind pose", () => {
  it("the board rolls in from the left, jumps to the rail, and rides it", () => {
    const run = newRun(1, seeded(1));
    const start = poseAt(run);
    expect(start.x).toBeLessThan(SCENE.takeoffX);
    const w = jumpWindow(1);
    stepRun(run, (w.perfectFrom + w.perfectTo) / 2, 0);
    pressJump(run, seeded(2));
    stepRun(run, JUMP_MS / 2, 0);
    const mid = poseAt(run);
    expect(mid.airborne).toBe(true);
    expect(mid.y).toBeLessThan(SCENE.railY - 7); // above the rail while in the air
    stepRun(run, JUMP_MS / 2 + 40, 0);
    const grind = poseAt(run);
    expect(grind.sparks).toBe(true);
    expect(grind.y).toBe(SCENE.railY - 7);
    expect(grind.x).toBeGreaterThanOrEqual(SCENE.railX0);
  });
  it("the board tilts with the balance marker and the pose is one angle for board and rider", () => {
    const run = onRail(1, 2);
    run.b = 0.3;
    expect(poseAt(run).angle).toBeGreaterThan(5);
    run.b = -0.3;
    expect(poseAt(run).angle).toBeLessThan(-5);
  });
  it("a fall tumbles in the direction of the drift and ends on the ground", () => {
    const run = onRail(1, 4);
    run.b = SAFE + 0.2;
    stepRun(run, 800, 0);
    expect(run.outcome).toBe("fell");
    const end = poseAt(run);
    run.phase = "done";
    const done = poseAt(run);
    expect(done.y).toBeCloseTo(SCENE.ground - 8, 3);
    expect(Math.sign(end.angle)).toBe(run.fellTo);
  });
  it("a clean grind finishes with a landing on the ground beyond the rail", () => {
    const run = play(onRail(1, 2));
    stepRun(run, 2000, 0);
    const p = poseAt(run);
    expect(run.outcome).toBe("clean");
    expect(p.y).toBeCloseTo(SCENE.ground - 8, 3);
    expect(p.x).toBeGreaterThan(SCENE.railX1 - 10);
  });
});
