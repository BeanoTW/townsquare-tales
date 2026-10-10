import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActionVignette, vignetteForAction } from "@/components/ActionVignette";

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("action cutaways", () => {
  it.each([
    ["lift","strength"],["home-workout","strength"],["jog","run"],
    ["library","study"],["study-desk","study"],["enroll","study"],
    ["round","drink"],["sleep","sleep"],["cook","food"],
    ["hot-meal","food"],["eat-snack","food"],["shift","work"],
    ["slots","gamble"],["high-dice","gamble"],["sell-goods","shady"],
    ["recovery","recover"],["buy-smokes","shop"],["deposit-50","money"],["furniture-console","shop"],["furniture-bookshelf","shop"],
  ])("assigns %s its own themed scene", (id, expected) => {
    expect(vignetteForAction(id)).toBe(expected);
  });

  it("shows actual gains without asking the player to continue", () => {
    const onDone=vi.fn();
    render(<ActionVignette kind="strength" changes={["Strength: +2","Energy: -20"]} message="Getting stronger." onDone={onDone}/>);
    expect(screen.getByRole("status", {name:"FEEL THE BURN"})).toBeInTheDocument();
    expect(screen.getByText("Strength +2")).toBeInTheDocument();
    expect(screen.getByText("Getting stronger.")).toBeInTheDocument();
    expect(screen.queryByRole("button", {name:/Tap to continue/})).not.toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("does not invent a stat reward when nothing increased", () => {
    render(<ActionVignette kind="sleep" changes={[]} message="You slept." onDone={vi.fn()}/>);
    expect(screen.getByText("ACTION COMPLETE")).toBeInTheDocument();
  });
});
