import { describe, expect, it } from "vitest";
import {
  BUY_ROUND,
  CHAT_UP,
  EAT_SNACK,
  LIFT_WEIGHTS,
  PROMOTE,
  SLOTS,
  applyAction,
  furnitureAction,
  runAction,
  shiftAction,
  sleepAction,
} from "@/lib/actions";
import { START } from "@/lib/game-data";
import type { GameState } from "@/lib/game-state";
import { ownsFurniture } from "@/lib/furniture";

const base = (patch: Partial<GameState> = {}): GameState => ({ ...START, ...patch });
const fixed = (value: number) => () => value;

describe("runAction: shared rules", () => {
  it("refuses an action without enough energy and spends nothing", () => {
    const state = base({ energy: 10 });
    const result = runAction(state, LIFT_WEIGHTS, fixed(0));
    expect(result).toEqual({
      ok: false,
      message: "Not enough energy: need 20, have 10. Rest or eat first.",
    });
  });

  it("refuses an action that would run past midnight", () => {
    const state = base({ hour: 23 });
    const result = runAction(state, LIFT_WEIGHTS, fixed(0));
    expect(result).toEqual({
      ok: false,
      message: "Not enough time: 2h required, only 1h left today.",
    });
  });

  it("applies cost, gains, time and energy, and reports each change", () => {
    const result = runAction(
      base({ money: 20, str: 5, hour: 8, energy: 100 }),
      LIFT_WEIGHTS,
      fixed(0),
    );
    if (!result.ok) throw new Error("expected success");
    expect(result.next).toMatchObject({ money: 15, str: 8, hour: 10, energy: 80 });
    expect(result.hoursUsed).toBe(2);
    expect(result.changes).toEqual(["Cash: -5", "Strength: +3", "Energy: -20"]);
    expect(result.message).toBe("+3 strength. Swole.");
  });

  it("leaves the original state untouched on failure", () => {
    const state = base({ money: 2 });
    const snapshot = { ...state };
    runAction(state, LIFT_WEIGHTS, fixed(0));
    expect(state).toEqual(snapshot);
  });

  it("returns the failure message from the action when a requirement is missing", () => {
    expect(runAction(base({ money: 1 }), LIFT_WEIGHTS, fixed(0))).toEqual({
      ok: false,
      message: "Gym costs $5.",
    });
  });
});

describe("actions with chance", () => {
  it("uses the supplied random source so outcomes are repeatable", () => {
    const good = runAction(base({ cha: 40 }), CHAT_UP, fixed(0.1));
    const bad = runAction(base({ cha: 40 }), CHAT_UP, fixed(0.99));
    expect(good.ok && good.next.cha).toBe(42);
    expect(bad.ok && bad.next.cha).toBe(41);
  });

  it("slot machine wins on a low roll and loses on a high one", () => {
    const win = runAction(base({ money: 100 }), SLOTS, fixed(0.01));
    const lose = runAction(base({ money: 100 }), SLOTS, fixed(0.9));
    expect(win.ok && win.next.money).toBe(200);
    expect(lose.ok && lose.next.money).toBe(50);
  });
});

describe("sleep", () => {
  it("starts the next day, restores energy and keeps savings interest", () => {
    const state = base({ hour: 21, energy: 20, bank: 1000, day: 4, house: 0 });
    const result = runAction(state, sleepAction(state), fixed(0));
    if (!result.ok) throw new Error("expected success");
    expect(result.next.day).toBe(5);
    expect(result.next.energy).toBeGreaterThan(20);
    expect(result.next.bank).toBe(1001);
    expect(result.message).toMatch(/^Day 5\. You wake at \d\d:00/);
  });
});

describe("careers and promotion", () => {
  it("shifts pay the current role and grant work experience", () => {
    const state = base({ career: 0, job: 0, money: 0 });
    const result = runAction(state, shiftAction(state));
    if (!result.ok) throw new Error("expected success");
    expect(result.next).toMatchObject({ money: 36, xp: 4, hour: 12 });
  });

  it("blocks promotion until the experience and skills are met", () => {
    const state = base({ career: 0, job: 0, xp: 0 });
    const result = runAction(state, PROMOTE, fixed(0));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("Promotion requires");
    expect(result.message).toContain("work XP");
  });

  it("applying for a new career transfers a quarter of work experience", () => {
    const state = base({ career: 0, job: 2, xp: 40 });
    const result = runAction(state, applyAction(3), fixed(0));
    if (!result.ok) throw new Error("expected success");
    expect(result.next).toMatchObject({ career: 3, job: 0, xp: 10 });
    expect(result.message).toContain("Hired as Apprentice");
  });

  it("does not re-hire into the same career", () => {
    const state = base({ career: 1 });
    expect(runAction(state, applyAction(1), fixed(0))).toEqual({
      ok: false,
      message: "You're already employed in Hospitality.",
    });
  });
});

describe("purchases", () => {
  it("buys furniture into the ownership bitmask and refuses duplicates", () => {
    const first = runAction(
      base({ money: 500, furniture: 0 }),
      furnitureAction("bed", base()),
      fixed(0),
    );
    if (!first.ok) throw new Error("expected success");
    expect(ownsFurniture(first.next.furniture, "bed")).toBe(true);
    expect(first.next.money).toBe(320);

    const again = runAction(first.next, furnitureAction("bed", first.next), fixed(0));
    expect(again).toEqual({ ok: false, message: "You already own that. It is set up at home." });
  });

  it("refuses a drink the player cannot afford", () => {
    expect(runAction(base({ money: 10 }), BUY_ROUND, fixed(0))).toEqual({
      ok: false,
      message: "Can't afford it.",
    });
  });

  it("eating a snack spends it and restores energy up to the cap", () => {
    const result = runAction(base({ snacks: 2, energy: 90 }), EAT_SNACK, fixed(0));
    if (!result.ok) throw new Error("expected success");
    expect(result.next).toMatchObject({ snacks: 1, energy: 100 });
  });
});
