import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BasketballGame } from "@/components/minigames/BasketballGame";
import { START } from "@/lib/game-data";
import type { GameState } from "@/lib/game-state";

const rich: GameState = { ...START, energy: 80, hour: 10, money: 100, day: 3 };
type Log = { states: GameState[]; exits: number };

function Host({ log, initial = rich }: { log: Log; initial?: GameState }) {
  const [s, setS] = useState(initial);
  return (
    <BasketballGame
      state={s}
      onChange={(n) => {
        log.states.push(n);
        setS(n);
      }}
      onExit={() => {
        log.exits++;
      }}
    />
  );
}
const mk = (): Log => ({ states: [], exits: 0 });
const last = (l: Log) => l.states.at(-1);
const btn = (n: RegExp | string) => screen.getByRole("button", { name: n });

beforeEach(() => {
  window.localStorage.setItem("tst-minigame-help-basketball", "1");
  vi.useFakeTimers({
    toFake: [
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "performance",
      "setTimeout",
      "clearTimeout",
    ],
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.localStorage.clear();
});

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
function shoot(holdMs: number) {
  const hold = btn(/hold to charge/i);
  fireEvent.pointerDown(hold, { pointerId: 1 });
  tick(holdMs);
  fireEvent.pointerUp(hold, { pointerId: 1 });
  tick(3500);
}

describe("basketball screen", () => {
  it("cancels a held shot when the pointer is interrupted or the window blurs", () => {
    render(<Host log={mk()} />);
    fireEvent.click(btn(/start/i));
    const hold = btn(/hold to charge/i);
    fireEvent.pointerDown(hold, { pointerId: 1 });
    tick(500);
    fireEvent.pointerCancel(hold, { pointerId: 1 });
    tick(1000);
    expect(screen.getByTestId("hud-score")).toHaveTextContent("0/0");
    fireEvent.pointerDown(hold, { pointerId: 2 });
    tick(500);
    fireEvent.blur(window);
    expect(screen.getByRole("dialog", { name: "Paused" })).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Paused" })).getByRole("button", {
        name: "Resume",
      }),
    );
    tick(1000);
    expect(screen.getByTestId("hud-score")).toHaveTextContent("0/0");
  });

  it("pauses the timed clock while reading help and cancels a held shot", () => {
    render(<Host log={mk()} />);
    fireEvent.click(screen.getByRole("radio", { name: /30 seconds/i }));
    fireEvent.click(btn(/start/i));
    fireEvent.pointerDown(btn(/hold to charge/i), { pointerId: 1 });
    tick(300);
    fireEvent.click(btn("How to play"));
    const time = screen.getByTestId("hud-time").textContent;
    tick(4000);
    expect(screen.getByTestId("hud-time").textContent).toBe(time);
    expect(screen.getByRole("button", { name: "Got it" })).toHaveFocus();
    fireEvent.click(btn("Got it"));
    tick(1500);
    expect(screen.getByTestId("hud-time").textContent).not.toBe(time);
    expect(screen.getByTestId("hud-score")).toHaveTextContent("0/0");
  });

  it("charges the session cost once, however many rounds are started", () => {
    const log = mk();
    render(<Host log={log} />);
    fireEvent.click(btn(/start/i));
    expect(last(log)!.energy).toBe(rich.energy - 8);
    expect(last(log)!.hour).toBeCloseTo(rich.hour + 0.5, 5);
    const after = log.states.length;
    fireEvent.click(btn(/leave/i));
    expect(log.exits).toBe(1);
    expect(log.states.length).toBe(after); // no shots, so nothing else recorded
  });

  it("a held pointer then release fires a shot; a five-shot round ends with a result", () => {
    const log = mk();
    render(<Host log={log} />);
    fireEvent.click(btn(/start/i));
    for (let i = 0; i < 5; i++) shoot(900);
    expect(screen.getByText("Round over")).toBeTruthy();
    expect(last(log)!.bbShots).toBe(5);
  });

  it("Space works as hold-and-release", () => {
    const log = mk();
    render(<Host log={log} />);
    fireEvent.click(btn(/start/i));
    fireEvent.keyDown(window, { code: "Space" });
    tick(800);
    fireEvent.keyUp(window, { code: "Space" });
    tick(3500);
    fireEvent.click(btn(/leave/i));
    expect(last(log)!.bbShots).toBe(1);
  });

  it("pausing cancels a held charge instead of firing it", () => {
    const log = mk();
    render(<Host log={log} />);
    fireEvent.click(btn(/start/i));
    const hold = btn(/hold to charge/i);
    fireEvent.pointerDown(hold, { pointerId: 1 });
    tick(500);
    fireEvent.click(btn("Pause"));
    fireEvent.pointerUp(hold, { pointerId: 1 });
    expect(screen.getByRole("dialog", { name: "Paused" })).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: /resume/i })[0]!);
    fireEvent.click(btn(/leave/i));
    expect(last(log)!.bbShots).toBe(0);
  });

  it("a hidden page pauses the game", () => {
    render(<Host log={mk()} />);
    fireEvent.click(btn(/start/i));
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    expect(screen.getByRole("dialog", { name: "Paused" })).toBeTruthy();
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
  });

  it("practice never records a best or pays a reward", () => {
    const log = mk();
    render(<Host log={log} />);
    fireEvent.click(screen.getByRole("radio", { name: /practice/i }));
    fireEvent.click(btn(/start/i));
    shoot(900);
    fireEvent.click(btn(/leave/i));
    expect(last(log)!.str).toBe(rich.str);
    expect(last(log)!.bbBest5).toBe(0);
  });

  it("refuses to start when too tired and charges nothing", () => {
    const log = mk();
    render(<Host log={log} initial={{ ...rich, energy: 0 }} />);
    fireEvent.click(btn(/start/i));
    expect(log.states.length).toBe(0);
    expect(screen.queryByRole("button", { name: /hold to charge/i })).toBeNull();
  });
});
