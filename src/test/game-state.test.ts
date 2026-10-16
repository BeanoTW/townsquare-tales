import { describe, expect, it } from "vitest";
import { parseGame, type GameState } from "@/lib/game-state";
const start: GameState = { bbBest5: 0, bbBestTimed: 0, bbMade: 0, bbShots: 0, railGrinds: 0, railFalls: 0, railLongest: 0, railLevel: 0, dartBest3: 0, dartThrows: 0, dartHits: 0, dartWins: 0, dartLosses: 0, bjWon: 0, bjLost: 0, slotWon: 0, slotLost: 0, day: 1, hour: 8, energy: 100, money: 20, str: 5, int: 5, cha: 5, karma: 0, house: 0, school: 0, job: 0, heat: 0, bank: 0, snacks: 0,
  smokes: 0,
  relMara: 0, relNox: 0, relGus: 0, relIvy: 0,
  lastMara: 0, lastNox: 0, lastGus: 0, lastIvy: 0, skateboard: 0, skateboardEquipped: 0, parkSmokes: 0, parkKidGone: 0, trainers: 0, alarm: 0, furniture: 0, career: 0, xp: 0, gangRep: 0, gangStage: 0 };
describe("save recovery", () => {
  it("loads a valid previous save", () => { expect(parseGame(JSON.stringify({...start, money: 400, day: 12}), start).money).toBe(400); });
  it("migrates previous saves without erasing progress", () => {
    const old = {...start, day:24, money:1200, job:3, school:2} as Partial<GameState>;
    delete old.career; delete old.xp;
    expect(parseGame(JSON.stringify(old),start)).toMatchObject({day:24,money:1200,job:3,school:2,career:0,xp:0});
  });
  it("clamps corrupted career fields", () => {
    expect(parseGame(JSON.stringify({...start,career:999,xp:-15}),start)).toMatchObject({career:3,xp:0});
  });
  it("recovers malformed saves", () => { expect(parseGame("{bad", start)).toEqual(start); });
  it("rejects non-object saves", () => { expect(parseGame("null", start)).toEqual(start); });
  it("clamps invalid tiers and energy", () => {
    const s = parseGame(JSON.stringify({...start, house: 99, job: -5, energy: 500, money: "oops"}), start);
    // The castle (tier 4) is the top home.
    expect(s).toMatchObject({house: 4, job: 0, energy: 100, money: 20});
  });
});
