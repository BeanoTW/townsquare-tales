import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import { giveParkSmoke, parkKidDialogue } from "@/lib/park-kid";
import { parseGame } from "@/lib/game-state";

describe("park kid and skateboard progression", () => {
  it("changes dialogue on first, second and repeated visits", () => {
    expect(parkKidDialogue(1)).toMatch(/Cheers/);
    expect(parkKidDialogue(2)).toMatch(/board/);
    expect(parkKidDialogue(15)).toMatch(/head home/);
  });
  it("has distinct natural dialogue at every encounter stage", () => {
    const lines = Array.from({length:16}, (_,i) => parkKidDialogue(i));
    expect(new Set(lines).size).toBe(16);
    expect(lines.join(" ")).not.toMatch(/unlocked|handed over|karma decreased/i);
  });
  it("unlocks a skateboard after two smokes and reduces karma every time", () => {
    const first = giveParkSmoke({ ...START, smokes: 5 });
    expect(typeof first).toBe("object");
    if (typeof first === "string") throw new Error(first);
    expect(first.patch).toMatchObject({ smokes: 4, parkSmokes: 1, karma: -1 });
    const second = giveParkSmoke({ ...START, smokes: 4, parkSmokes: 1, karma: -1 });
    if (typeof second === "string") throw new Error(second);
    expect(second.patch).toMatchObject({ smokes: 3, parkSmokes: 2, skateboard: 1, karma: -2 });
  });
  it("intensifies the harm at fifteen and disallows additional cigarettes", () => {
    const last = giveParkSmoke({ ...START, smokes: 1, parkSmokes: 14, karma: -25 });
    if (typeof last === "string") throw new Error(last);
    expect(last.patch.parkSmokes).toBe(15);
    expect(last.message).toMatch(/head home/);
    expect(giveParkSmoke({ ...START, smokes: 3, parkSmokes: 15 })).toMatch(/gone home/);
    expect(giveParkSmoke({ ...START, smokes: 3, parkKidGone: 1 })).toMatch(/gone home/);
  });
  it("keeps progression in legacy-compatible saves", () => {
    const old = parseGame(JSON.stringify({ day: 8, money: 80 }), START);
    expect(old.parkSmokes).toBe(0);
    expect(old.skateboard).toBe(0);
    const saved = parseGame(JSON.stringify({ ...old, parkSmokes: 15, parkKidGone: 1, skateboard: 1 }), START);
    expect(saved).toMatchObject({ parkSmokes: 15, parkKidGone: 1, skateboard: 1 });
  });
});
