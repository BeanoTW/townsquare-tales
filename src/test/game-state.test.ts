import { describe, expect, it } from "vitest";
import { parseGame, type GameState } from "@/lib/game-state";
const start: GameState = { day: 1, hour: 8, energy: 100, money: 20, str: 5, int: 5, cha: 5, karma: 0, house: 0, school: 0, job: 0, heat: 0 };
describe("save recovery", () => {
  it("loads a valid previous save", () => { expect(parseGame(JSON.stringify({...start, money: 400, day: 12}), start).money).toBe(400); });
  it("recovers malformed saves", () => { expect(parseGame("{bad", start)).toEqual(start); });
  it("rejects non-object saves", () => { expect(parseGame("null", start)).toEqual(start); });
  it("clamps invalid tiers and energy", () => {
    const s = parseGame(JSON.stringify({...start, house: 99, job: -5, energy: 500, money: "oops"}), start);
    expect(s).toMatchObject({house: 3, job: 0, energy: 100, money: 20});
  });
});
