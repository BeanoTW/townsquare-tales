import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SkillGame } from "@/components/minigames/SkillGame";
import { START } from "@/lib/game-data";
import type { GameState } from "@/lib/game-state";
import type { SkillGame as GameId } from "@/lib/minigames";
function Host({
  game,
  log,
  exit = vi.fn(),
}: {
  game: GameId;
  log: GameState[];
  exit?: () => void;
}) {
  const [state, setState] = useState({ ...START, skateboard: 1, skateboardEquipped: 1 });
  return (
    <SkillGame
      game={game}
      state={state}
      onChange={(next) => {
        log.push(next);
        setState(next);
      }}
      onExit={exit}
    />
  );
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) =>
    setTimeout(() => fn(performance.now()), 16),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const click = (name: RegExp | string) => fireEvent.click(screen.getByRole("button", { name }));

describe("skill game controls", () => {
  it.each(["basketball", "skateboard", "darts"] as const)(
    "shows %s rules and charges only when started",
    (game) => {
      const log: GameState[] = [];
      render(<Host game={game} log={log} />);
      click("Rules");
      expect(screen.getByRole("heading", { name: "How to play" })).toBeInTheDocument();
      click("Got it");
      expect(log).toHaveLength(0);
      click(/^Start game/);
      expect(log).toHaveLength(1);
      expect(log[0]!.energy).toBeLessThan(START.energy);
      expect(screen.queryByRole("button", { name: /^Start game/ })).toBeNull();
    },
  );
  it("lets Space charge and release a basketball shot", () => {
    render(<Host game="basketball" log={[]} />);
    click(/^Start game/);
    fireEvent.keyDown(window, { key: " " });
    act(() => vi.advanceTimersByTime(500));
    expect(
      Number(screen.getByRole("meter", { name: "Shot power" }).getAttribute("aria-valuenow")),
    ).toBeGreaterThan(40);
    fireEvent.keyUp(window, { key: " " });
    expect(screen.getByRole("button", { name: /Hold Shoot/ })).toBeDisabled();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("button", { name: /Hold Shoot/ })).toBeEnabled();
    expect(screen.getByText(/Shot 2\/5/)).toBeInTheDocument();
  });
  it("keeps keyboard focus inside the game and allows Space in the rules sheet", () => {
    render(<Host game="basketball" log={[]} />);
    const start = screen.getByRole("button", { name: /^Start game/ });
    expect(start).toHaveFocus();
    click(/^Start game/);
    click("Rules");
    const gotIt = screen.getByRole("button", { name: "Got it" });
    expect(gotIt).toHaveFocus();
    const event = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    gotIt.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    fireEvent.keyDown(gotIt, { key: "Tab" });
    expect(gotIt).toHaveFocus();
  });

  it("pauses basketball while rules are open and cancels a held shot on blur", () => {
    render(<Host game="basketball" log={[]} />);
    click(/^Start game/);
    fireEvent.keyDown(window, { key: " " });
    act(() => vi.advanceTimersByTime(200));
    fireEvent.blur(window);
    expect(screen.getByRole("meter").getAttribute("aria-valuenow")).toBe("0");
    click("Rules");
    act(() => vi.advanceTimersByTime(3000));
    click("Got it");
    expect(screen.getByText(/Shot 1\/5/)).toBeInTheDocument();
  });
  it("charges retries and does not reward a failed jump", () => {
    const log: GameState[] = [];
    render(<Host game="skateboard" log={log} />);
    click(/^Start game/);
    click(/Jump onto rail/);
    expect(screen.getByRole("button", { name: /^Play again/ })).toBeInTheDocument();
    expect(log.at(-1)!.cha).toBe(START.cha);
    click(/^Play again/);
    expect(log.at(-1)!.hour).toBe(START.hour + 0.5);
    expect(log.at(-1)!.energy).toBe(START.energy - 12);
  });
  it("settles nine darts once and lets Escape close only the rules first", () => {
    const log: GameState[] = [],
      exit = vi.fn();
    render(<Host game="darts" log={log} exit={exit} />);
    click(/^Start game/);
    for (let i = 0; i < 9; i++) click(/Throw dart/);
    expect(log).toHaveLength(2);
    expect(log.at(-1)!.dartsBest).toBeGreaterThan(0);
    click("Rules");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(exit).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(exit).toHaveBeenCalledTimes(1);
  });
});
