import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { START } from "@/lib/game-data";
import type { GameState } from "@/lib/game-state";
import { CUTSCENE_MODE_KEY, milestoneFor, readCutsceneMode } from "@/lib/milestones";
import { cardStage, milestoneStage } from "@/lib/scene-stage";
import { VIGNETTE_TITLES, type VignetteKind } from "@/components/ActionVignette";
import { actFor } from "@/components/home3d/scenes/acts";
import { Route } from "@/routes/index";

vi.mock("@/components/TownMap", () => ({
  TownMap: ({ onEnter }: { onEnter: (id: string) => void }) => <button onClick={() => onEnter("gym")}>Enter the gym</button>,
}));

const s: GameState = { ...START, money: 500, employed: 1, career: 0, job: 1, house: 1, school: 1, loanDebt: 0 };

describe("life milestones", () => {
  it("recognises each milestone from the state change", () => {
    expect(milestoneFor(s, { ...s, house: 2 })).toMatchObject({ kind: "new-home", detail: "Suburban House" });
    expect(milestoneFor(s, { ...s, school: 2 })).toMatchObject({ kind: "graduated", detail: "College" });
    expect(milestoneFor(s, { ...s, job: 2 })).toMatchObject({ kind: "promoted", detail: "Analyst" });
    expect(milestoneFor({ ...s, employed: 0 }, { ...s, employed: 1, job: 0 })).toMatchObject({ kind: "hired", detail: "Office Intern" });
    expect(milestoneFor({ ...s, loanDebt: 1400 }, { ...s, loanDebt: 0 })).toMatchObject({ kind: "debt-free" });
  });

  it("ignores ordinary actions, partial repayments and career switches", () => {
    expect(milestoneFor(s, { ...s, money: 900, str: 30 })).toBeNull();
    expect(milestoneFor({ ...s, loanDebt: 1400 }, { ...s, loanDebt: 900 })).toBeNull();
    // Moving to a new career's entry role is a hire, not a promotion.
    expect(milestoneFor(s, { ...s, career: 1, job: 2 })).toBeNull();
    // Old saves without the employed flag count as employed.
    const legacy = { ...s } as Partial<GameState>; delete legacy.employed;
    expect(milestoneFor(legacy as GameState, { ...(legacy as GameState), job: 2 })?.kind).toBe("promoted");
  });

  it("shows the biggest moment when one action reaches several", () => {
    expect(milestoneFor(s, { ...s, house: 2, job: 2 })?.kind).toBe("new-home");
  });

  it("stages every milestone on its own set, shorter when asked", () => {
    for (const [after, set] of [[{ house: 3 }, "house-3"], [{ school: 2 }, "graduation"], [{ job: 2 }, "podium"], [{ loanDebt: 0 }, "bank"]] as const) {
      const before = "loanDebt" in after ? { ...s, loanDebt: 500 } : s;
      const m = milestoneFor(before, { ...before, ...after })!;
      const full = milestoneStage(m, { day: 7, house: (after as { house?: number }).house ?? 1, changes: [], message: "", mode: "full" });
      const short = milestoneStage(m, { day: 7, house: 1, changes: [], message: "", mode: "short" });
      expect(full.set).toBe(set);
      expect(full.confetti).not.toBeNull();
      expect(short.duration).toBeLessThan(full.duration);
    }
    const grad = milestoneStage(milestoneFor(s, { ...s, school: 2 })!, { day: 7, house: 1, changes: [], message: "", mode: "full" });
    expect([grad.hat, grad.held, grad.banner]).toEqual(["mortar", "diploma", "CLASS OF DAY 7"]);
  });

  it("gives every old vignette kind a 3D card with a real act", () => {
    for (const kind of Object.keys(VIGNETTE_TITLES) as VignetteKind[]) {
      const card = cardStage(kind, { actionId: "", changes: ["Strength: +2"], message: "", before: s, after: s, title: VIGNETTE_TITLES[kind], mode: "full" });
      expect(card.mode).toBe("card");
      expect(() => actFor(card.act, false)).not.toThrow();
      expect(actFor(card.act, false).run).toBeTypeOf("function");
    }
    const win = cardStage("gamble", { actionId: "high-dice", changes: [], message: "", before: s, after: { ...s, money: 700 }, title: "", mode: "full" });
    const lose = cardStage("gamble", { actionId: "high-dice", changes: [], message: "", before: s, after: { ...s, money: 300 }, title: "", mode: "full" });
    expect([win.act, lose.act]).toEqual(["dice-win", "dice-lose"]);
  });
});

describe("cutscene setting", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("sticktown", JSON.stringify({ ...START, money: 1000, energy: 100, hour: 8 }));
  });
  afterEach(() => { cleanup(); localStorage.clear(); });

  const liftAtGym = () => {
    const Game = Route.options.component!;
    render(<Game />);
    fireEvent.click(screen.getByRole("button", { name: "Enter the gym" }));
    fireEvent.click(screen.getAllByRole("button", { name: /^Weights rack\./ })[0]!);
    fireEvent.click(screen.getByRole("button", { name: /Lift weights/ }));
  };

  it("defaults to full and remembers the player's choice", () => {
    expect(readCutsceneMode()).toBe("full");
    const Game = Route.options.component!;
    render(<Game />);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const group = screen.getByRole("group", { name: "Cutscenes" });
    fireEvent.click(group.querySelector("button:nth-child(2)")!);
    expect(localStorage.getItem(CUTSCENE_MODE_KEY)).toBe("short");
    expect(readCutsceneMode()).toBe("short");
  });

  it("still shows the card without WebGL, and nothing at all when cutscenes are off", () => {
    liftAtGym();
    expect(document.querySelector("[data-action-vignette]")).not.toBeNull();
    cleanup();
    localStorage.setItem(CUTSCENE_MODE_KEY, "off");
    liftAtGym();
    expect(document.querySelector("[data-action-vignette]")).toBeNull();
    expect(document.querySelector("[data-scene-stage]")).toBeNull();
  });
});
