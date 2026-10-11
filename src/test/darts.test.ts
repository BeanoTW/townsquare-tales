import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import {
  BOARD_R, DARTS_PER_TURN, FLINCH_MS, RADII, SEGMENTS, STEADY_MS, TIRE_AFTER_MS, aimPoint, applyDart, banterFor, gusMatchLine,
  gusThreeDarts, gusVisit, newAimer, press, release, reticle, scoreAt, segmentAt, sigmaNow, stepAimer, threeDartScore,
  type Dart, type Turn,
} from "@/lib/darts";
import { finishDarts, takeWager } from "@/lib/minigames";

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
const at = (n: number, ring: "single" | "double" | "treble") => {
  const p = aimPoint(n, ring);
  return scoreAt(p.x, p.y);
};

describe("dartboard scoring", () => {
  it("has the standard clockwise number order", () => {
    expect(SEGMENTS.slice(0, 5)).toEqual([20, 1, 18, 4, 13]);
    expect(segmentAt(0, -0.8)).toBe(20);
    expect(segmentAt(0.8, 0)).toBe(6);
    expect(segmentAt(0, 0.8)).toBe(3);
    expect(segmentAt(-0.8, 0)).toBe(11);
  });
  it("every segment scores singles, doubles and trebles correctly", () => {
    for (const n of SEGMENTS) {
      expect(at(n, "single")).toMatchObject({ ring: "single", points: n, number: n });
      expect(at(n, "double")).toMatchObject({ ring: "double", points: n * 2, isDouble: true, label: `D${n}` });
      expect(at(n, "treble")).toMatchObject({ ring: "treble", points: n * 3, label: `T${n}` });
    }
  });
  it("bull, outer bull, rim and off-board", () => {
    expect(scoreAt(0, 0)).toMatchObject({ ring: "bull", points: 50, isDouble: true });
    expect(scoreAt(0, -(RADII.bull + RADII.outerBull) / 2)).toMatchObject({ ring: "outer-bull", points: 25, isDouble: false });
    expect(scoreAt(0, -1.1)).toMatchObject({ ring: "rim", points: 0, offBoard: false });
    expect(scoreAt(0, -(BOARD_R + 0.1))).toMatchObject({ ring: "off", points: 0, offBoard: true, label: "Miss" });
  });
  it("ring boundaries sit where a real board puts them", () => {
    expect(scoreAt(0, -(RADII.trebleInner - 0.005)).ring).toBe("single");
    expect(scoreAt(0, -(RADII.trebleInner + 0.005)).ring).toBe("treble");
    expect(scoreAt(0, -(RADII.trebleOuter + 0.005)).ring).toBe("single");
    expect(scoreAt(0, -(RADII.doubleInner + 0.005)).ring).toBe("double");
    expect(scoreAt(0, -(RADII.doubleInner - 0.005)).ring).toBe("single");
  });
  it("sums a three-dart score and the maximum is 180", () => {
    expect(threeDartScore([at(20, "treble"), at(20, "treble"), at(20, "treble")])).toBe(180);
    expect(threeDartScore([at(1, "single"), at(5, "double"), scoreAt(0, 0)])).toBe(61);
  });
});

describe("301 rules", () => {
  const turn = (start: number): Turn => ({ darts: [], startRemaining: start });
  const bull = scoreAt(0, 0);
  it("counts down and ends the turn after three darts", () => {
    const t = turn(301);
    let r = applyDart(t, at(20, "treble"));
    expect(r).toMatchObject({ kind: "ok", remaining: 241, turnOver: false });
    r = applyDart(t, at(20, "treble"));
    r = applyDart(t, at(20, "treble"));
    expect(r).toMatchObject({ kind: "ok", remaining: 121, turnOver: true });
    expect(DARTS_PER_TURN).toBe(3);
  });
  it("busts when going below zero and reverts to the start of the turn", () => {
    const t = turn(30);
    applyDart(t, at(10, "single"));
    const r = applyDart(t, at(20, "treble"));
    expect(r).toMatchObject({ kind: "bust", reason: "over", remaining: 30, turnOver: true });
  });
  it("busts when leaving exactly one", () => {
    const r = applyDart(turn(21), at(20, "single"));
    expect(r).toMatchObject({ kind: "bust", reason: "one", remaining: 21 });
  });
  it("reaching zero on a single or treble is a bust (double-out)", () => {
    expect(applyDart(turn(20), at(20, "single"))).toMatchObject({ kind: "bust", reason: "no-double" });
    expect(applyDart(turn(60), at(20, "treble"))).toMatchObject({ kind: "bust", reason: "no-double" });
  });
  it("finishes on a double or the bull", () => {
    expect(applyDart(turn(40), at(20, "double"))).toMatchObject({ kind: "win", remaining: 0 });
    expect(applyDart(turn(50), bull)).toMatchObject({ kind: "win" });
    const t = turn(50);
    applyDart(t, at(20, "single"));
    expect(applyDart(t, at(15, "double"))).toMatchObject({ kind: "win" });
  });
  it("a bust mid-turn reverts everything scored that turn", () => {
    const t = turn(50);
    expect(applyDart(t, at(20, "single"))).toMatchObject({ kind: "ok", remaining: 30 });
    expect(applyDart(t, at(20, "single"))).toMatchObject({ kind: "ok", remaining: 10 });
    expect(applyDart(t, at(10, "single"))).toMatchObject({ kind: "bust", remaining: 50 });
  });
});

describe("aiming", () => {
  it("holding steadies the throw: slower sweep and less scatter", () => {
    const a = newAimer("normal", seeded(1));
    const free = sigmaNow(a);
    press(a);
    stepAimer(a, 50);
    const tau0 = a.tau;
    for (let i = 0; i < STEADY_MS / 10; i++) stepAimer(a, 10);
    const steady = sigmaNow(a);
    expect(steady).toBeLessThan(free * 0.45);
    const slowMove = a.tau - tau0;
    expect(slowMove).toBeLessThan((STEADY_MS / 1000) * 0.8);
    const before = a.tau;
    for (let i = 0; i < 100; i++) stepAimer(a, 10);
    expect(a.tau - before).toBeLessThan(0.3); // fully steady: crawling
  });
  it("flinching (releasing at once) sprays; holding too long tires the arm", () => {
    const a = newAimer("normal", seeded(2));
    press(a);
    stepAimer(a, 40);
    const flinch = sigmaNow(a);
    stepAimer(a, FLINCH_MS + 100);
    stepAimer(a, STEADY_MS);
    const steady = sigmaNow(a);
    expect(flinch).toBeGreaterThan(steady * 3);
    stepAimer(a, TIRE_AFTER_MS + 1500);
    expect(sigmaNow(a)).toBeGreaterThan(steady * 1.8);
  });
  it("the reticle stays on the board's scoring area and is deterministic", () => {
    const a = newAimer("hard", seeded(3));
    for (let i = 0; i < 2000; i++) {
      stepAimer(a, 16);
      const p = reticle(a);
      expect(Math.hypot(p.x, p.y)).toBeLessThan(1.25);
    }
    const b = newAimer("hard", seeded(3));
    const c = newAimer("hard", seeded(3));
    stepAimer(b, 700);
    stepAimer(c, 700);
    expect(reticle(b)).toEqual(reticle(c));
  });
  it("a steady throw usually lands near the reticle; scatter is bounded", () => {
    let near = 0;
    const rng = seeded(7);
    for (let i = 0; i < 200; i++) {
      const a = newAimer("normal", rng);
      press(a);
      stepAimer(a, STEADY_MS + 100);
      const d = release(a, rng);
      if (Math.hypot(d.x - d.aimX, d.y - d.aimY) < 0.1) near++;
      expect(a.holding).toBe(false);
    }
    expect(near).toBeGreaterThan(185);
  });
  it("a flinchy throw can miss the board entirely, which counts as a full miss", () => {
    const rng = seeded(11);
    let off = 0;
    for (let i = 0; i < 400; i++) {
      const a = newAimer("hard", rng);
      stepAimer(a, rng() * 4000);
      press(a);
      stepAimer(a, 20);
      const d = release(a, rng);
      if (d.offBoard) off++;
    }
    expect(off).toBeGreaterThan(0);
  });
});

describe("Gus", () => {
  it("his three-dart scores stay in range with a sensible average", () => {
    const rng = seeded(5);
    let sum = 0;
    for (let i = 0; i < 2000; i++) {
      const s = gusThreeDarts(rng);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(180);
      sum += s;
    }
    const mean = sum / 2000;
    expect(mean).toBeGreaterThan(30);
    expect(mean).toBeLessThan(55);
  });
  it("never goes below zero or leaves one, only wins from an even score, and always finishes a game eventually", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const rng = seeded(seed);
      let rem = 301;
      let visits = 0;
      let won = false;
      while (!won && visits < 120) {
        const v = gusVisit(rem, rng);
        expect(v.remaining).toBeGreaterThanOrEqual(v.won ? 0 : 2);
        if (v.won) expect(rem % 2).toBe(0);
        if (v.bust) expect(v.remaining).toBe(rem);
        rem = v.remaining;
        won = v.won;
        visits++;
      }
      expect(won).toBe(true);
    }
  });
  it("is noticeably more unimpressed by a full miss, and says something about busts and matches", () => {
    const rng = seeded(1);
    const miss = banterFor(scoreAt(0, -2), rng);
    expect(miss.crowd).not.toBeNull();
    expect(miss.gus).toMatch(/wall|pigeon|board|move|five seconds/i);
    const bad = banterFor(scoreAt(0, -0.8), rng) as { gus: string };
    expect(bad.gus.length).toBeGreaterThan(5);
    expect(banterFor(scoreAt(0, 0), rng).gus).not.toBe(bad.gus);
    expect(banterFor(scoreAt(0, 0.5), rng, { bust: true }).gus).toMatch(/bust/i);
    expect(gusMatchLine(true, rng)).toBeTruthy();
    expect(gusMatchLine(null, rng)).toMatch(/draw/i);
  });
});

describe("darts records, wagers and rewards", () => {
  const base = { ...START, money: 100, day: 5, cha: 10, relGus: 0 };
  const win = (s = base, extra: Partial<Parameters<typeof finishDarts>[1]> = {}) =>
    finishDarts(s, { mode: "x01", throws: 9, hits: 7, won: true, completed: true, wager: 10, ...extra });
  it("a won wager pays double the stake already taken, plus Charm and Gus once per day", () => {
    const taken = takeWager(base, 10);
    expect(taken.money).toBe(90);
    const w = win(taken);
    expect(w.next.money).toBe(110);
    expect(w.next.dartWins).toBe(1);
    expect(w.next.cha).toBe(11);
    expect(w.next.relGus).toBe(1);
    const again = win(w.next);
    expect(again.next.cha).toBe(11);
    expect(again.next.relGus).toBe(1);
    expect(again.next.dartWins).toBe(2);
    const nextDay = win({ ...again.next, day: 6 });
    expect(nextDay.next.cha).toBe(12);
  });
  it("a lost wager is simply gone, and walking out of a match counts as a loss", () => {
    const l = finishDarts(takeWager(base, 20), { mode: "x01", throws: 5, hits: 3, won: false, completed: true, wager: 20 });
    expect(l.next.money).toBe(80);
    expect(l.next.dartLosses).toBe(1);
    const walk = finishDarts(takeWager(base, 5), { mode: "x01", throws: 2, hits: 2, completed: false, wager: 5 });
    expect(walk.next.dartLosses).toBe(1);
    expect(walk.next.money).toBe(95);
  });
  it("a draw returns the stake and records neither a win nor a loss", () => {
    const d = finishDarts(takeWager(base, 10), { mode: "three", throws: 3, hits: 3, score: 40, won: null, completed: true, wager: 10 });
    expect(d.next.money).toBe(100);
    expect(d.next.dartWins).toBe(0);
    expect(d.next.dartLosses).toBe(0);
  });
  it("wagers are capped and never exceed the player's money", () => {
    expect(takeWager({ ...base, money: 3 }, 20).money).toBe(0);
    expect(takeWager({ ...base, money: 1000 }, 500).money).toBe(980);
  });
  it("practice never changes any saved records, accuracy or rewards", () => {
    const p = finishDarts(base, { mode: "practice", throws: 12, hits: 9, score: 120, won: true, completed: true });
    expect(p.next.dartBest3).toBe(0);
    expect(p.next.dartWins).toBe(0);
    expect(p.next.cha).toBe(10);
    expect(p.next.dartThrows).toBe(0);
    expect(p.next.dartHits).toBe(0);
  });
  it("tracks the best three-dart score only when it improves", () => {
    const a = finishDarts(base, { mode: "three", throws: 3, hits: 3, score: 60, won: true, completed: true });
    expect(a.next.dartBest3).toBe(60);
    expect(a.newBest).toBe(true);
    const b = finishDarts(a.next, { mode: "three", throws: 3, hits: 2, score: 45, won: false, completed: true });
    expect(b.next.dartBest3).toBe(60);
    expect(b.newBest).toBe(false);
  });
});
