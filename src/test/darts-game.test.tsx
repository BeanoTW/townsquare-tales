import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DartsGame } from "@/components/minigames/DartsGame";
import { START } from "@/lib/game-data";
import type { GameState } from "@/lib/game-state";

const base: GameState = { ...START, energy: 80, hour: 10, money: 100, day: 3 };
type Log = { states: GameState[]; exits: number };
function Host({ log, initial = base, rng }: { log: Log; initial?: GameState; rng?: () => number }) {
  const [s, setS] = useState(initial);
  return (
    <DartsGame
      state={s}
      {...(rng ? { rng } : {})}
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
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const throwDart = (holdMs = 900) => {
  const hold = btn(/hold to steady/i);
  fireEvent.pointerDown(hold, { pointerId: 1 });
  tick(holdMs);
  fireEvent.pointerUp(hold, { pointerId: 1 });
  tick(400);
};

beforeEach(() => {
  window.localStorage.setItem("tst-minigame-help-darts", "1");
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

describe("darts screen", () => {
  it("starts a game, charges the session once and takes the wager up front", () => {
    const log = mk();
    render(<Host log={log} rng={seeded(1)} />);
    fireEvent.click(screen.getByRole("button", { name: "$10" }));
    fireEvent.click(btn(/^start/i));
    const s = last(log)!;
    expect(s.energy).toBe(base.energy - 3);
    expect(s.money).toBe(90);
    expect(screen.getByTestId("banter").textContent).toMatch(/Gus/);
  });

  it("offers only affordable stakes, capped, and none in practice", () => {
    render(<Host log={mk()} initial={{ ...base, money: 7 }} />);
    expect(screen.queryByRole("button", { name: "$10" })).toBeNull();
    expect(screen.getByRole("button", { name: "$5" })).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /practice/i }));
    expect((screen.getByRole("button", { name: "$5" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("hold then release throws a dart that sticks in the board and gets a comment", () => {
    render(<Host log={mk()} rng={seeded(2)} />);
    fireEvent.click(screen.getByRole("radio", { name: /practice/i }));
    fireEvent.click(btn(/^start/i));
    throwDart();
    expect(screen.getAllByTestId("stuck-dart").length).toBe(1);
    expect(screen.getByTestId("banter").textContent).toMatch(/Gus/);
  });

  it("Space works as hold-and-release", () => {
    render(<Host log={mk()} rng={seeded(2)} />);
    fireEvent.click(screen.getByRole("radio", { name: /practice/i }));
    fireEvent.click(btn(/^start/i));
    fireEvent.keyDown(window, { code: "Space" });
    tick(700);
    fireEvent.keyUp(window, { code: "Space" });
    tick(400);
    expect(screen.getAllByTestId("stuck-dart").length).toBe(1);
  });

  it("three-dart mode ends after three darts with a result against Gus", () => {
    const log = mk();
    render(<Host log={log} rng={seeded(3)} />);
    fireEvent.click(btn(/^start/i));
    throwDart();
    throwDart();
    throwDart();
    tick(4000);
    expect(screen.getByTestId("result")).toBeTruthy();
    expect(last(log)!.dartThrows).toBe(3);
  });

  it("pausing cancels a held throw instead of firing it", () => {
    render(<Host log={mk()} rng={seeded(4)} />);
    fireEvent.click(screen.getByRole("radio", { name: /practice/i }));
    fireEvent.click(btn(/^start/i));
    const hold = btn(/hold to steady/i);
    fireEvent.pointerDown(hold, { pointerId: 1 });
    tick(400);
    fireEvent.click(btn("Pause"));
    fireEvent.pointerUp(hold, { pointerId: 1 });
    expect(screen.getByRole("dialog", { name: "Paused" })).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: /resume/i })[0]!);
    tick(500);
    expect(screen.queryAllByTestId("stuck-dart").length).toBe(0);
  });

  it("walking out before throwing returns the stake and records nothing", () => {
    const log = mk();
    render(<Host log={log} rng={seeded(5)} />);
    fireEvent.click(screen.getByRole("button", { name: "$20" }));
    fireEvent.click(btn(/^start/i));
    expect(last(log)!.money).toBe(80);
    fireEvent.click(btn(/leave/i));
    expect(last(log)!.money).toBe(100);
    expect(last(log)!.dartLosses).toBe(0);
    expect(log.exits).toBe(1);
  });

  it("leaving while the first dart is in flight forfeits the stake", () => {
    const log = mk();
    render(<Host log={log} rng={seeded(6)} />);
    fireEvent.click(screen.getByRole("button", { name: "$10" }));
    fireEvent.click(btn(/^start/i));
    const hold = btn(/hold to steady/i);
    fireEvent.pointerDown(hold, { pointerId: 1 });
    tick(700);
    fireEvent.pointerUp(hold, { pointerId: 1 });
    fireEvent.click(btn(/leave/i));
    expect(last(log)!.money).toBe(90);
    expect(last(log)!.dartLosses).toBe(1);
  });

  it("forfeiting mid-match after throwing counts as a loss and the stake stays gone", () => {
    const log = mk();
    render(<Host log={log} rng={seeded(6)} />);
    fireEvent.click(screen.getByRole("button", { name: "$10" }));
    fireEvent.click(btn(/^start/i));
    throwDart();
    fireEvent.click(btn(/leave/i));
    expect(last(log)!.dartLosses).toBe(1);
    expect(last(log)!.money).toBe(90);
  });

  it("a hidden page pauses the game", () => {
    render(<Host log={mk()} />);
    fireEvent.click(btn(/^start/i));
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    expect(screen.getByRole("dialog", { name: "Paused" })).toBeTruthy();
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
  });

  it("refuses to start when too tired and charges nothing", () => {
    const log = mk();
    render(<Host log={log} initial={{ ...base, energy: 0 }} />);
    fireEvent.click(btn(/^start/i));
    expect(log.states.length).toBe(0);
    expect(screen.queryByRole("button", { name: /hold to steady/i })).toBeNull();
  });

  it("301 shows both scores and starts at 301", () => {
    render(<Host log={mk()} rng={seeded(8)} />);
    fireEvent.click(screen.getByRole("radio", { name: /301/i }));
    fireEvent.click(btn(/^start/i));
    expect(screen.getByTestId("hud-you").textContent).toBe("You 301");
    expect(screen.getByTestId("hud-gus").textContent).toBe("Gus 301");
    throwDart();
    expect(
      Number(screen.getByTestId("hud-you").textContent!.replace("You ", "")),
    ).toBeLessThanOrEqual(301);
  });
});
