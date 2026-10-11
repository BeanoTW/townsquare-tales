import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import { parseGame } from "@/lib/game-state";
import { finishBasketball, finishDarts, finishRail, takeWager } from "@/lib/minigames";

const legacy = (extra: object = {}) => {
  const {
    bbBest5,
    bbBestTimed,
    bbMade,
    bbShots,
    railGrinds,
    railFalls,
    railLongest,
    railLevel,
    dartBest3,
    dartThrows,
    dartHits,
    dartWins,
    dartLosses,
    ...old
  } = START;
  return JSON.stringify({
    ...old,
    basketBest: 4,
    skateBest: 4,
    dartsBest: 240,
    dartsRewardDay: START.day,
    ...extra,
  });
};
describe("arcade upgrade compatibility", () => {
  it("migrates five-shot and grind records without erasing the old nine-dart score", () => {
    const s = parseGame(legacy(), START);
    expect(s.bbBest5).toBe(4);
    expect(s.railLongest).toBe(4000);
    expect(s.railLevel).toBe(1);
    expect(s.railGrinds).toBe(1);
    expect(s.dartBest3).toBe(0);
    expect(s.dartsBest).toBe(240);
  });
  it("preserves fractional old grind times", () => {
    expect(parseGame(legacy({ skateBest: 2.73 }), START).railLongest).toBe(2730);
  });
  it("keeps new records authoritative after migration", () => {
    const s = parseGame(
      legacy({ bbBest5: 5, railLongest: 3900, railLevel: 3, railGrinds: 7 }),
      START,
    );
    expect(s.bbBest5).toBe(5);
    expect(s.railLongest).toBe(3900);
    expect(s.railLevel).toBe(3);
    expect(s.railGrinds).toBe(7);
  });
  it("retains all three daily reward caps across the upgrade", () => {
    const s = parseGame(legacy({ parkHoopDay: START.day, parkSkateDay: START.day }), START);
    expect(finishBasketball(s, "five", 3, 5, true).next.str).toBe(s.str);
    expect(finishRail(s, { level: 1, success: true, balancedMs: 4000 }).next.cha).toBe(s.cha);
    const darts = finishDarts(s, {
      mode: "three",
      throws: 3,
      hits: 3,
      score: 60,
      won: true,
      completed: true,
    });
    expect(darts.next.cha).toBe(s.cha);
    expect(darts.next.relGus).toBe(s.relGus);
  });
  it("practice leaves all saved accuracy and records unchanged", () => {
    const s = { ...START, bbMade: 2, bbShots: 5, dartThrows: 3, dartHits: 2 };
    expect(finishBasketball(s, "practice", 10, 10, true).next).toEqual(s);
    expect(
      finishDarts(s, { mode: "practice", throws: 10, hits: 10, completed: true, won: true }).next,
    ).toEqual(s);
  });
  it("an incomplete match cannot award a win, reward or payout", () => {
    const s = takeWager({ ...START, money: 100 }, 10);
    const result = finishDarts(s, {
      mode: "three",
      throws: 1,
      hits: 1,
      won: true,
      completed: false,
      wager: 10,
    });
    expect(result.next.money).toBe(90);
    expect(result.next.cha).toBe(s.cha);
    expect(result.next.dartWins).toBe(0);
    expect(result.next.dartLosses).toBe(1);
  });
});
