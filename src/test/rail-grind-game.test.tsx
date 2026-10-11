import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RailGrindGame } from "@/components/minigames/RailGrindGame";
import { START } from "@/lib/game-data";
import type { GameState } from "@/lib/game-state";

const rider: GameState = { ...START, energy: 80, hour: 10, day: 3, skateboard: 1, skateboardEquipped: 1 };
type Log = { states: GameState[]; exits: number };
function Host({ log, initial = rider }: { log: Log; initial?: GameState }) {
  const [s, setS] = useState(initial);
  return (
    <RailGrindGame
      state={s}
      rng={() => 0.5}
      onChange={(n) => {
        log.states.push(n);
        setS(n);
      }}
      onExit={() => void log.exits++}
    />
  );
}
const mk = (): Log => ({ states: [], exits: 0 });
const last = (l: Log) => l.states.at(-1);
const btn = (n: RegExp | string) => screen.getByRole("button", { name: n });
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

beforeEach(() => {
  window.localStorage.setItem("tst-minigame-help-rail", "1");
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "setTimeout", "clearTimeout"] });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.localStorage.clear();
});

describe("rail grind screen", () => {
  it("shows a requirement and charges nothing without an equipped skateboard", () => {
    for (const s of [{ ...rider, skateboard: 0, skateboardEquipped: 0 }, { ...rider, skateboardEquipped: 0 }]) {
      const log = mk();
      render(<Host log={log} initial={s} />);
      expect(screen.getByTestId("board-required")).toBeTruthy();
      expect(screen.queryByRole("button", { name: /start/i })).toBeNull();
      fireEvent.click(btn("OK"));
      expect(log.exits).toBe(1);
      expect(log.states.length).toBe(0);
      cleanup();
    }
  });

  it("starts, charges the session once, and a no-input run ends in a fall that records a miss", () => {
    const log = mk();
    render(<Host log={log} />);
    fireEvent.click(btn(/start/i));
    expect(last(log)!.energy).toBe(rider.energy - 6);
    // jump when the window is open
    tick(1300);
    fireEvent.pointerDown(btn("Jump"));
    expect(screen.getByTestId("callout").textContent).toMatch(/jump/i);
    tick(9000); // no leaning at all
    expect(screen.getByText(/wiped out/i)).toBeTruthy();
    expect(last(log)!.railFalls).toBe(1);
    expect(last(log)!.railGrinds).toBe(0);
    expect(last(log)!.cha).toBe(rider.cha);
  });

  it("never jumping is a missed jump", () => {
    const log = mk();
    render(<Host log={log} />);
    fireEvent.click(btn(/start/i));
    tick(5000);
    expect(screen.getAllByText(/never jumped/i).length).toBeGreaterThan(0);
  });

  it("a too-early jump is ignored with a hint", () => {
    render(<Host log={mk()} />);
    fireEvent.click(btn(/start/i));
    tick(200);
    fireEvent.pointerDown(btn("Jump"));
    expect(screen.getByText(/too early/i)).toBeTruthy();
  });

  it("lean buttons and A/D keys register and release cleanly", () => {
    render(<Host log={mk()} />);
    fireEvent.click(btn(/start/i));
    const l = btn("Lean left");
    fireEvent.pointerDown(l, { pointerId: 1 });
    expect(l.className).toContain("is-down");
    fireEvent.pointerUp(l, { pointerId: 1 });
    expect(l.className).not.toContain("is-down");
    fireEvent.keyDown(window, { code: "KeyD" });
    expect(btn("Lean right").className).toContain("is-down");
    fireEvent.keyUp(window, { code: "KeyD" });
    expect(btn("Lean right").className).not.toContain("is-down");
  });

  it("pausing freezes the run and releases held leans", () => {
    render(<Host log={mk()} />);
    fireEvent.click(btn(/start/i));
    fireEvent.keyDown(window, { code: "ArrowLeft" });
    fireEvent.click(btn("Pause"));
    expect(screen.getByRole("dialog", { name: "Paused" })).toBeTruthy();
    expect(btn("Lean left").className).not.toContain("is-down");
    const before = screen.getByTestId("skater").getAttribute("transform");
    tick(2000);
    expect(screen.getByTestId("skater").getAttribute("transform")).toBe(before);
  });

  it("locked rails cannot be chosen", () => {
    render(<Host log={mk()} />);
    const radios = screen.getAllByRole("radio");
    expect((radios[1] as HTMLButtonElement).disabled).toBe(true);
    expect((radios[0] as HTMLButtonElement).disabled).toBe(false);
  });

  it("the rider is drawn without walking legs, in one rotating group with the board", () => {
    render(<Host log={mk()} />);
    fireEvent.click(btn(/start/i));
    const skater = screen.getByTestId("skater");
    expect(skater.querySelector('[data-skateboard="deck"]')).toBeTruthy();
    expect(skater.querySelector("[data-overhead-person] circle")).toBeTruthy();
    expect(skater.querySelector("[data-resting-legs]")).toBeNull();
  });
});
