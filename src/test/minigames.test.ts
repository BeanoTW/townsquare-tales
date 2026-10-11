import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import { parseGame } from "@/lib/game-state";
import { shopRoute, SHOP_ENTRY, SHOP_LAYOUTS } from "@/lib/walkable-shops";
import {
  startSkill,
  finishSkill,
  newBasketball,
  basketballHold,
  basketballRelease,
  basketballStep,
  hoopPosition,
  newSkate,
  skateJump,
  skateStep,
  dartScore,
  newDarts,
  dartsThrow,
  dartsTotal,
} from "@/lib/minigames";

describe("skill game economy and saves", () => {
  it.each(["basketball", "skateboard", "darts"] as const)(
    "checks %s costs before changing state",
    (game) => {
      const s = { ...START, skateboard: 1, skateboardEquipped: 1 };
      expect(startSkill({ ...s, energy: 0 }, game).ok).toBe(false);
      expect(startSkill({ ...s, hour: 24 }, game).ok).toBe(false);
      const result = startSkill(s, game);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.next.hour).toBeGreaterThan(s.hour);
        expect(result.next.energy).toBeLessThan(s.energy);
        expect(result.next.money).toBe(s.money);
      }
    },
  );
  it("requires an equipped skateboard", () => {
    expect(startSkill(START, "skateboard").ok).toBe(false);
    expect(startSkill({ ...START, skateboard: 1 }, "skateboard").ok).toBe(false);
  });
  it.each([
    ["basketball", 3, "str"],
    ["skateboard", 4, "cha"],
    ["darts", 180, "cha"],
  ] as const)("rewards %s performance once per saved day", (game, score, stat) => {
    const failed = finishSkill(START, game, score - 1);
    expect(failed.rewarded).toBe(false);
    expect(failed.next[stat]).toBe(START[stat]);
    const won = finishSkill(START, game, score);
    expect(won.next[stat]).toBe(START[stat] + 1);
    const saved = parseGame(JSON.stringify(won.next), START);
    expect(finishSkill(saved, game, score).rewarded).toBe(false);
    expect(finishSkill({ ...saved, day: saved.day + 1 }, game, score).rewarded).toBe(true);
  });
  it("preserves fractional grind records and migrates old saves", () => {
    const s = parseGame(
      JSON.stringify({ ...START, skateBest: 2.73, dartsBest: 999, basketBest: -5 }),
      START,
    );
    expect(s.skateBest).toBe(2.73);
    expect(s.dartsBest).toBe(540);
    expect(s.basketBest).toBe(0);
    expect(
      finishSkill(parseGame(JSON.stringify(START), START), "basketball", 0).next.basketBest,
    ).toBe(0);
  });
  it("keeps the new pub dartboard reachable", () => {
    const fixture = SHOP_LAYOUTS.bar.find((f) => f.id === "dartboard")!;
    expect(shopRoute("bar", SHOP_ENTRY, fixture.approach).length).toBeGreaterThan(0);
  });
});

describe("basketball timing", () => {
  it("does not shoot without holding first and scores five well-timed releases", () => {
    let s = newBasketball();
    expect(basketballRelease(s)).toBe(s);
    for (let i = 0; i < 5; i++) {
      s = basketballRelease({ ...basketballHold(s), held: hoopPosition(s.time + 0.75) });
      s = basketballStep(s, 0.9);
    }
    expect(s.score).toBe(5);
    expect(s.phase).toBe("done");
    expect(basketballStep(s, 10)).toBe(s);
    expect(basketballRelease(s)).toBe(s);
  });
  it("misses badly timed shots and cannot shoot again during flight", () => {
    const shot = basketballRelease(basketballHold(newBasketball()));
    expect(shot.hit).toBe(false);
    expect(basketballRelease(shot)).toBe(shot);
    expect(basketballStep(shot, 1).score).toBe(0);
  });
  it("locks a release to one outcome while the hoop moves", () => {
    const shot = basketballRelease({ ...newBasketball(), held: hoopPosition(0.75) });
    const next = basketballStep(shot, 0.5);
    expect(next.hit).toBe(shot.hit);
    expect(next.time).toBe(0.5);
    expect(next.shots).toBe(0);
  });
});

describe("rail balancing", () => {
  it("requires the jump window and fails a missed approach", () => {
    expect(skateJump(newSkate()).phase).toBe("done");
    expect(skateStep(newSkate(), 2, 0).phase).toBe("done");
    expect(skateJump(skateStep(newSkate(), 1.3, 0)).phase).toBe("grind");
  });
  it("falls without balancing, but corrective input holds the rail for four seconds", () => {
    const grind = skateJump({ ...newSkate(), time: 1.3 });
    let idle = grind;
    for (let i = 0; i < 600 && idle.phase !== "done"; i++) idle = skateStep(idle, 1 / 120, 0);
    expect(idle.landed).toBe(false);
    expect(idle.score).toBeLessThan(4);
    let balanced = grind;
    for (let i = 0; i < 600 && balanced.phase !== "done"; i++)
      balanced = skateStep(
        balanced,
        1 / 120,
        -Math.sign(balanced.balance + balanced.velocity * 0.7),
      );
    expect(balanced.landed).toBe(true);
    expect(balanced.score).toBe(4);
  });
  it("uses equivalent physics at 30 and 120 frames per second", () => {
    const grind = skateJump({ ...newSkate(), time: 1.3 });
    let a = grind,
      b = grind;
    for (let i = 0; i < 30; i++) a = skateStep(a, 1 / 30, -0.2);
    for (let i = 0; i < 120; i++) b = skateStep(b, 1 / 120, -0.2);
    expect(a.balance).toBeCloseTo(b.balance, 8);
  });
});

describe("standard dartboard", () => {
  it("scores bulls, singles, trebles, doubles and misses", () => {
    expect(dartScore(0, 0)).toBe(50);
    expect(dartScore(0.06, 0)).toBe(25);
    expect(dartScore(0, -0.4)).toBe(20);
    expect(dartScore(0, -0.6)).toBe(60);
    expect(dartScore(0, -0.98)).toBe(40);
    expect(dartScore(0.6, 0)).toBe(18);
    expect(dartScore(0, 1.1)).toBe(0);
    expect(dartScore(NaN, 0)).toBe(0);
  });
  it("ends after nine darts and cannot score again", () => {
    let s = newDarts();
    for (let i = 0; i < 9; i++) s = dartsThrow(s);
    expect(s.phase).toBe("done");
    expect(s.throws).toHaveLength(9);
    expect(dartsThrow(s)).toBe(s);
    expect(dartsTotal(s)).toBe(s.throws.reduce((t, d) => t + d.score, 0));
  });
});
