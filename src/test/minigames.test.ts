import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import { parseGame, type GameState } from "@/lib/game-state";
import { accuracy, clampWager, finishBasketball, startSession } from "@/lib/minigames";

const base: GameState = { ...START, energy: 80, hour: 10, money: 100, day: 4 };

describe("minigame sessions", () => {
  it("charges time and energy once and refuses when exhausted", () => {
    const r = startSession(base, "basketball");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.next.energy).toBeLessThan(base.energy);
    const tired = startSession({ ...base, energy: 0 }, "basketball");
    expect(tired.ok).toBe(false);
  });
});

describe("basketball records and rewards", () => {
  it("records personal bests and awards strength once per day", () => {
    const a = finishBasketball(base, "five", 3, 5, true);
    expect(a.next.bbBest5).toBe(3);
    expect(a.next.str).toBe(base.str + 1);
    expect(a.next.parkHoopDay).toBe(4);
    const b = finishBasketball(a.next, "five", 5, 5, true);
    expect(b.next.bbBest5).toBe(5);
    expect(b.next.str).toBe(a.next.str); // no second reward the same day
    expect(b.next.bbMade).toBe(8);
    expect(b.next.bbShots).toBe(10);
  });
  it("practice and abandoned rounds never reward or set records", () => {
    const p = finishBasketball(base, "practice", 4, 6, true);
    expect(p.next.str).toBe(base.str);
    expect(p.next.bbBest5).toBe(0);
    expect(p.next.bbMade).toBe(0);
    expect(p.next.bbShots).toBe(0);
    const ab = finishBasketball(base, "timed", 9, 12, false);
    expect(ab.next.str).toBe(base.str);
    expect(ab.next.bbBestTimed).toBe(0);
  });
  it("scoring nothing gives nothing", () => {
    const z = finishBasketball(base, "five", 0, 5, true);
    expect(z.next.str).toBe(base.str);
    expect(z.next.parkHoopDay).toBe(base.parkHoopDay);
  });
  it("accuracy and wager helpers stay in range", () => {
    expect(accuracy(0, 0)).toBe(0);
    expect(accuracy(3, 4)).toBe(75);
    expect(clampWager(500, 1000)).toBeLessThanOrEqual(20);
    expect(clampWager(20, 3)).toBeLessThanOrEqual(3);
  });
});

describe("save compatibility", () => {
  it("old saves without minigame fields load with zero records", () => {
    const old: Record<string, unknown> = { ...START };
    for (const k of ["bbBest5", "bbBestTimed", "bbMade", "bbShots", "railGrinds", "railFalls", "railLongest", "railLevel", "dartBest3", "dartThrows", "dartHits", "dartWins", "dartLosses", "dartDay"]) delete old[k];
    const g = parseGame(JSON.stringify(old), START);
    expect(g.bbBest5).toBe(0);
    expect(g.railLevel).toBe(0);
    expect(g.dartWins).toBe(0);
  });
  it("clamps corrupted record values", () => {
    const g = parseGame(JSON.stringify({ ...START, bbBest5: 99, bbMade: -5, railLevel: 12 }), START);
    expect(g.bbBest5).toBe(5);
    expect(g.bbMade).toBe(0);
    expect(g.railLevel).toBe(5);
  });
});
