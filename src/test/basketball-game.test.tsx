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
  return <BasketballGame state={s} sound={false} onChange={(next) => { log.states.push(next); setS(next); }} onExit={() => log.exits++}/>;
}
const mk = (): Log => ({ states: [], exits: 0 });
const btn = (name: string | RegExp) => screen.getByRole("button", { name });
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
function shot() {
  fireEvent.keyDown(window, { code: "Space" }); tick(300);
  fireEvent.keyUp(window, { code: "Space" }); tick(2400);
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "setTimeout", "clearTimeout"] });
});
afterEach(() => { cleanup(); vi.useRealTimers(); window.localStorage.clear(); });
describe("basketball arcade", () => {
  it("charges 30 minutes and 8 energy once per visit, including replay", () => {
    const log = mk(); render(<Host log={log}/>); fireEvent.click(btn(/start/i));
    expect(log.states.at(-1)?.energy).toBe(72); expect(log.states.at(-1)?.hour).toBe(10.5);
    tick(31000); expect(screen.getByTestId("result")).toBeInTheDocument();
    fireEvent.click(btn("Play again")); expect(log.states.at(-1)?.energy).toBe(72); expect(log.states.at(-1)?.hour).toBe(10.5);
  });
  it("finishes a 30-second shootout and records physically scored shots", () => {
    const log = mk(); render(<Host log={log}/>); fireEvent.click(btn(/start/i)); shot();
    expect(screen.getByTestId("hud-score")).toHaveTextContent("Score 1 · Shots 1");
    expect(screen.getByTestId("hud-streak")).toHaveTextContent("Streak 1");
    tick(28000); expect(screen.getByTestId("result")).toBeInTheDocument();
    expect(log.states.at(-1)?.bbBestTimed).toBe(1); expect(log.states.at(-1)?.bbShots).toBe(1);
    expect(log.states.at(-1)?.str).toBe(rich.str + 1);
  });
  it("practice has unlimited time and no records or stat rewards", () => {
    const log = mk(); render(<Host log={log}/>);
    fireEvent.click(screen.getByRole("radio", { name: "Practice" })); fireEvent.click(btn(/start/i)); shot(); tick(31000);
    expect(screen.queryByTestId("result")).not.toBeInTheDocument();
    fireEvent.click(btn("Finish practice"));
    expect(log.states.at(-1)?.bbBestTimed).toBe(0); expect(log.states.at(-1)?.bbShots).toBe(0);
    expect(log.states.at(-1)?.str).toBe(rich.str);
  });
  it("help and pause freeze the timer and cancel shots being prepared", () => {
    render(<Host log={mk()}/>); fireEvent.click(btn(/start/i));
    fireEvent.keyDown(window, { code: "Space" }); tick(300); fireEvent.click(btn("How to play"));
    const time = screen.getByTestId("hud-time").textContent; tick(4000);
    expect(screen.getByTestId("hud-time").textContent).toBe(time);
    fireEvent.click(btn("Got it")); fireEvent.keyUp(window, { code: "Space" });
    expect(screen.getByTestId("hud-score")).toHaveTextContent("Shots 0");
    fireEvent.click(btn("Pause")); tick(4000);
    expect(screen.getByTestId("hud-time").textContent).toBe(time);
    fireEvent.click(within(screen.getByRole("dialog", { name: "Paused" })).getByRole("button", {name: "Resume"}));
    tick(1500); expect(screen.getByTestId("hud-time").textContent).not.toBe(time);
  });
  it("blur pauses without firing; too little energy refuses play", () => {
    const log = mk(); render(<Host log={log} initial={{...rich, energy: 0}}/>);
    fireEvent.click(btn(/start/i)); expect(log.states).toHaveLength(0);
    expect(screen.queryByTestId("hud-score")).not.toBeInTheDocument(); cleanup();
    render(<Host log={mk()}/>); fireEvent.click(btn(/start/i));
    fireEvent.keyDown(window, { code: "Space" }); tick(300); fireEvent.blur(window);
    expect(screen.getByRole("dialog", { name: "Paused" })).toBeInTheDocument();
    expect(screen.getByTestId("hud-score")).toHaveTextContent("Shots 0");
  });
  it("allows an in-flight shot at the buzzer, but no unreleased shot", () => {
    const log = mk(); render(<Host log={log}/>); fireEvent.click(btn(/start/i)); tick(29200);
    fireEvent.keyDown(window, { code: "Space" }); tick(300); fireEvent.keyUp(window, { code: "Space" }); tick(600);
    expect(screen.queryByTestId("result")).not.toBeInTheDocument();
    tick(2300); expect(log.states.at(-1)?.bbMade).toBe(1);
    fireEvent.click(btn("Play again")); tick(29500); fireEvent.keyDown(window, {code: "Space"}); tick(1000);
    fireEvent.keyUp(window, {code: "Space"}); expect(log.states.at(-1)?.bbShots).toBe(1);
  });
});
