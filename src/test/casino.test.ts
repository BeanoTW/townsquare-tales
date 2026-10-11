import { describe, expect, it } from "vitest";
import {
  MAX_BET,
  canSit,
  chargeSession,
  clampBet,
  lifetime,
  maxBet,
  recordResult,
} from "@/lib/casino";
import { START } from "@/lib/game-data";
import { parseGame } from "@/lib/game-state";

describe("wagers", () => {
  it("never allows more than the player holds, in whole $10 steps", () => {
    expect(maxBet(0)).toBe(0);
    expect(maxBet(9)).toBe(0);
    expect(maxBet(35)).toBe(30);
    expect(maxBet(1e9)).toBe(MAX_BET);
  });
  it("snaps a requested bet to something legal", () => {
    expect(clampBet(1000, 75)).toBe(70);
    expect(clampBet(3, 500)).toBe(10);
    expect(clampBet(47, 500)).toBe(50);
    expect(clampBet(Number.NaN, 500)).toBe(10);
    expect(clampBet(100, 5)).toBe(0);
  });
});

describe("sitting down", () => {
  it("costs an hour and 5 energy", () => {
    const r = chargeSession({ ...START, hour: 10, energy: 50 });
    expect(r.ok && r.next).toMatchObject({ hour: 11, energy: 45 });
  });
  it("is refused when there is no time or energy left", () => {
    expect(canSit({ ...START, hour: 24 }).ok).toBe(false);
    expect(canSit({ ...START, energy: 4 }).ok).toBe(false);
  });
});

describe("lifetime stats", () => {
  it("records wins and losses per game and derives net", () => {
    let s = recordResult(START, "blackjack", 150);
    s = recordResult(s, "blackjack", -40);
    s = recordResult(s, "slots", -10);
    s = recordResult(s, "slots", 0);
    expect(lifetime(s, "blackjack")).toEqual({ won: 150, lost: 40, net: 110 });
    expect(lifetime(s, "slots")).toEqual({ won: 0, lost: 10, net: -10 });
    expect(s.money).toBe(START.money);
  });
  it("loads saves from before the casino stats existed", () => {
    const old: Record<string, unknown> = { ...START, money: 777 };
    for (const k of ["bjWon", "bjLost", "slotWon", "slotLost"]) delete old[k];
    expect(parseGame(JSON.stringify(old), START)).toMatchObject({
      money: 777,
      bjWon: 0,
      slotLost: 0,
    });
  });
  it("clamps tampered stats", () => {
    expect(parseGame(JSON.stringify({ ...START, bjWon: -50, slotLost: "x" }), START)).toMatchObject(
      {
        bjWon: 0,
        slotLost: 0,
      },
    );
  });
});
