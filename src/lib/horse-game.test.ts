import { describe, expect, it } from "vitest";
import { createHorseGame, horseAttempt, horseLetters, npcHorseChance } from "./horse-game";

describe("H-O-R-S-E", () => {
  it("requires a successful call before a copy", () => {
    const initial = createHorseGame();
    expect(horseAttempt(initial, "npc", true)).toBe(initial);
    const missed = horseAttempt(initial, "human", false);
    expect(missed.caller).toBe("npc");
    expect(missed.letters.human).toBe(0);
    const called = horseAttempt(initial, "human", true, "bank");
    expect(called.phase).toBe("copy");
    expect(called.shot).toBe("bank");
  });
  it("adds a letter to a failed copycat and ends at HORSE", () => {
    let game = createHorseGame();
    for (let i = 0; i < 5; i++) {
      game = horseAttempt(game, "human", true);
      game = horseAttempt(game, "npc", false);
      if (i < 4) {
        game = horseAttempt(game, "npc", false);
      }
    }
    expect(game.letters.npc).toBe(5);
    expect(horseLetters(game.letters.npc)).toBe("HORSE");
    expect(game.phase).toBe("finished");
    expect(game.winner).toBe("human");
    expect(horseAttempt(game, "human", true)).toBe(game);
  });
  it("does not penalise successful copies", () => {
    const game = horseAttempt(horseAttempt(createHorseGame(), "human", true), "npc", true);
    expect(game.letters.npc).toBe(0);
    expect(game.caller).toBe("npc");
  });
  it("keeps opponent chances bounded and distinguishes their strengths", () => {
    expect(npcHorseChance("nox", "trick")).toBeGreaterThan(npcHorseChance("gus", "trick"));
    expect(npcHorseChance("mara", "standard")).toBe(.75);
  });
});
