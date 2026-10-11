import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BlackjackGame } from "@/components/casino/BlackjackGame";
import { SlotsGame } from "@/components/casino/SlotsGame";
import type { Card, Rank } from "@/lib/blackjack";
import { START } from "@/lib/game-data";
import type { GameState } from "@/lib/game-state";

let stacked: Card[] = [];
vi.mock("@/lib/blackjack", async (orig) => {
  const actual = await orig<typeof import("@/lib/blackjack")>();
  return {
    ...actual,
    dealRound: (bet: number, rng: () => number) => actual.dealRound(bet, rng, stacked),
  };
});

const SUIT: Record<string, Card["suit"]> = { S: "♠", H: "♥", D: "♦", C: "♣" };
const c = (s: string): Card => ({ rank: s.slice(0, -1) as Rank, suit: SUIT[s.slice(-1)]! });
const stack = (player: [string, string], dealer: [string, string], ...rest: string[]) =>
  [player[0], dealer[0], player[1], dealer[1], ...rest].map(c);

const rich: GameState = { ...START, money: 1000, hour: 10, energy: 80 };

type Log = { states: GameState[]; exits: number };
function Host({
  game,
  initial = rich,
  log,
  rng,
}: {
  game: "bj" | "slots";
  initial?: GameState;
  log: Log;
  rng?: () => number;
}) {
  const [s, setS] = useState(initial);
  const change = (n: GameState) => {
    log.states.push(n);
    setS(n);
  };
  const exit = () => {
    log.exits++;
  };
  const props = { state: s, onChange: change, onExit: exit, ...(rng ? { rng } : {}) };
  return game === "bj" ? <BlackjackGame {...props} /> : <SlotsGame {...props} />;
}
const lastMoney = (log: Log, fallback = rich.money) => log.states.at(-1)?.money ?? fallback;
const mkLog = (): Log => ({ states: [], exits: 0 });
const click = (name: RegExp | string) => fireEvent.click(screen.getByRole("button", { name }));

beforeEach(() => {
  window.localStorage.setItem("tst-blackjack-rules-seen", "1");
  window.localStorage.setItem("tst-slots-rules-seen", "1");
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("Blackjack table", () => {
  it("shows the rules to a new player and again on request", () => {
    window.localStorage.clear();
    render(<Host game="bj" log={mkLog()} />);
    expect(screen.getByRole("dialog", { name: "How to play Blackjack" })).toBeInTheDocument();
    click("Got it");
    expect(screen.queryByRole("dialog")).toBeNull();
    click("Rules");
    expect(screen.getByRole("dialog", { name: "How to play Blackjack" })).toBeInTheDocument();
  });

  it("will not let the player bet more than they have", () => {
    render(<Host game="bj" initial={{ ...rich, money: 35 }} log={mkLog()} />);
    expect(screen.getByRole("button", { name: "Add $50 chip" })).toBeDisabled();
    click("Max");
    expect(screen.getByTestId("bet")).toHaveTextContent("$30");
    click("Add $10 chip");
    expect(screen.getByTestId("bet")).toHaveTextContent("$30");
  });

  it("deals two cards each, hides the dealer's hole card and takes the bet and the hour once", () => {
    stacked = stack(["9S", "7H"], ["10D", "8C"], "2S");
    const log = mkLog();
    render(<Host game="bj" log={log} />);
    click(/^Deal/);
    expect(log.states).toHaveLength(1);
    expect(log.states[0]).toMatchObject({ money: 990, hour: 11, energy: 75 });
    expect(screen.getAllByRole("img", { name: "Face-down card" })).toHaveLength(1);
    expect(screen.getByRole("img", { name: "10 of diamonds" })).toBeInTheDocument();
    expect(screen.getByTestId("total-0")).toHaveTextContent("16");
    expect(screen.getByTestId("dealer-total")).toHaveTextContent("Showing 10");
  });

  it("pays a natural blackjack 3:2 exactly once", () => {
    stacked = stack(["AS", "KH"], ["9D", "7C"]);
    const log = mkLog();
    render(<Host game="bj" log={log} />);
    click("Add $50 chip");
    click(/^Deal/);
    // bet 60? the initial $10 plus the $50 chip: 60 wagered, natural returns 150.
    expect(lastMoney(log)).toBe(1000 - 60 + 150);
    expect(screen.getByTestId("result")).toHaveTextContent("+$90");
    expect(screen.getByTestId("record")).toHaveTextContent("won $90");
    const count = log.states.length;
    fireEvent.click(screen.getByTestId("result"));
    expect(log.states).toHaveLength(count);
    expect(screen.getByRole("img", { name: "9 of diamonds" })).toBeInTheDocument();
  });

  it("settles a win after Stand and reveals the hole card", () => {
    stacked = stack(["10S", "9H"], ["10D", "7C"]);
    const log = mkLog();
    render(<Host game="bj" log={log} />);
    click(/^Deal/);
    click("Stand");
    expect(screen.queryAllByRole("img", { name: "Face-down card" })).toHaveLength(0);
    expect(lastMoney(log)).toBe(1010);
    expect(screen.getByTestId("result")).toHaveTextContent("You win");
  });

  it("loses the stake to a higher dealer hand, with a sarcastic remark", () => {
    stacked = stack(["10S", "7H"], ["10D", "9C"]);
    const log = mkLog();
    render(<Host game="bj" log={log} />);
    click(/^Deal/);
    click("Stand");
    expect(lastMoney(log)).toBe(990);
    expect(screen.getByTestId("result")).toHaveTextContent("House wins");
    expect(screen.getByTestId("dealer-line").textContent?.length).toBeGreaterThan(5);
    expect(screen.getByTestId("record")).toHaveTextContent("lost $10");
  });

  it("busting on a hit ends the round without the dealer drawing", () => {
    stacked = stack(["10S", "6H"], ["10D", "6C"], "KS", "5D");
    const log = mkLog();
    render(<Host game="bj" log={log} />);
    click(/^Deal/);
    click("Hit");
    expect(screen.getByTestId("total-0")).toHaveTextContent("Bust 26");
    expect(lastMoney(log)).toBe(990);
    expect(screen.getByTestId("dealer-total")).toHaveTextContent("16");
  });

  it("double down takes the extra stake and one card", () => {
    stacked = stack(["5S", "6H"], ["10D", "7C"], "10S");
    const log = mkLog();
    render(<Host game="bj" log={log} />);
    click(/^Deal/);
    click(/^Double down/);
    // stake 10 doubled to 20, hand 21 beats 17: returns 40
    expect(lastMoney(log)).toBe(1000 - 20 + 40);
  });

  it("disables Double and Split the player cannot afford", () => {
    stacked = stack(["8S", "8H"], ["10D", "7C"], "3S", "2D");
    const log = mkLog();
    render(<Host game="bj" initial={{ ...rich, money: 10 }} log={log} />);
    click(/^Deal/);
    expect(screen.getByRole("button", { name: /^Double down/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Split/ })).toBeDisabled();
  });

  it("splits a pair into two hands and settles each", () => {
    // hand 1: 8 + 3, hand 2: 8 + 2; hit both to 21 / 20; dealer stands on 17.
    stacked = stack(["8S", "8H"], ["10D", "7C"], "3S", "2D", "10C", "10H");
    const log = mkLog();
    render(<Host game="bj" log={log} />);
    click(/^Deal/);
    click(/^Split/);
    expect(log.states.at(-1)?.money).toBe(980);
    click("Hit"); // hand 1 reaches 21 and finishes
    click("Hit"); // hand 2 reaches 20
    click("Stand");
    expect(lastMoney(log)).toBe(1020);
    expect(screen.getByText("Hand 1")).toBeInTheDocument();
    expect(screen.getByText("Hand 2")).toBeInTheDocument();
  });

  it("leaving mid-hand asks first, and forfeiting loses the bet exactly once", () => {
    stacked = stack(["10S", "7H"], ["10D", "9C"]);
    const log = mkLog();
    render(<Host game="bj" log={log} />);
    click(/^Deal/);
    click("Leave table");
    const dlg = screen.getByRole("alertdialog", { name: "Leave table" });
    fireEvent.click(within(dlg).getByRole("button", { name: "Keep playing" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(log.exits).toBe(0);
    click("Leave table");
    fireEvent.click(screen.getByRole("button", { name: "Forfeit and leave" }));
    expect(log.exits).toBe(1);
    expect(lastMoney(log)).toBe(990);
    expect(log.states.at(-1)).toMatchObject({ bjLost: 10 });
  });

  it("leaving between hands is free and changes nothing", () => {
    const log = mkLog();
    render(<Host game="bj" log={log} />);
    click("Leave table");
    expect(log.exits).toBe(1);
    expect(log.states).toHaveLength(0);
  });

  it("Escape leaves like the Leave button", () => {
    const log = mkLog();
    render(<Host game="bj" log={log} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(log.exits).toBe(1);
  });

  it("refuses to sit down with no time left", () => {
    const log = mkLog();
    render(<Host game="bj" initial={{ ...rich, hour: 24 }} log={log} />);
    click(/^Deal/);
    expect(log.states).toHaveLength(0);
    expect(screen.getByText(/Not enough time/)).toBeInTheDocument();
  });

  it("charges the hour only once per sitting", () => {
    stacked = stack(["10S", "9H"], ["10D", "7C"]);
    const log = mkLog();
    render(<Host game="bj" log={log} />);
    click(/^Deal/);
    click("Stand");
    stacked = stack(["10S", "9H"], ["10D", "7C"]);
    click(/^Deal again/);
    expect(log.states.at(-1)).toMatchObject({ hour: 11, energy: 75 });
  });
});

describe("Slot machine", () => {
  const queue: number[] = [];
  const rng = () => queue.shift() ?? 0.5;
  const stops = (...n: number[]) => queue.push(...n.map((i) => (i + 0.5) / 20));

  it("takes the bet and pays the prize the moment the reels start, not when they stop", () => {
    const log = mkLog();
    render(<Host game="slots" log={log} rng={rng} />);
    stops(14, 14, 14); // 7-7-7
    click("Pull lever");
    expect(log.states).toHaveLength(1);
    expect(lastMoney(log)).toBe(1000 - 10 + 3000);
    expect(log.states[0]).toMatchObject({ hour: 11, energy: 75, slotWon: 2990 });
    expect(screen.getByRole("button", { name: "Skip" })).toBeInTheDocument();
  });

  it("repeated taps never re-roll or settle again", () => {
    const log = mkLog();
    render(<Host game="slots" log={log} rng={rng} />);
    stops(0, 3, 4); // lemon lemon bar: loses
    click("Pull lever");
    for (let i = 0; i < 6; i++) fireEvent.click(screen.getByRole("button", { name: "Pull lever" }));
    expect(log.states).toHaveLength(1);
    expect(lastMoney(log)).toBe(990);
    expect(screen.getByTestId("slot-result")).toHaveTextContent("No win");
  });

  it("states a win honestly, with the net figure", () => {
    const log = mkLog();
    render(<Host game="slots" log={log} rng={rng} />);
    stops(1, 5, 4); // cherry cherry bar: exactly two cherries, x3
    click("Pull lever");
    click("Skip");
    expect(screen.getByTestId("slot-result")).toHaveTextContent(
      "Exactly two cherries: pays ×3. Net +$20.",
    );
    expect(lastMoney(log)).toBe(1020);
  });

  it("reveals the reels over time rather than instantly", () => {
    vi.useFakeTimers();
    try {
      const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        return window.setTimeout(() => cb(performance.now()), 16) as unknown as number;
      });
      const log = mkLog();
      render(<Host game="slots" log={log} rng={rng} />);
      stops(0, 3, 4);
      click("Pull lever");
      expect(screen.getByTestId("slot-result")).toHaveTextContent("");
      act(() => void vi.advanceTimersByTime(1000));
      expect(screen.getByTestId("slot-result")).toHaveTextContent("");
      act(() => void vi.advanceTimersByTime(2500));
      expect(screen.getByTestId("slot-result")).toHaveTextContent("No win");
      expect(raf).toHaveBeenCalled();
      expect(log.states).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("leaving mid-spin keeps the single settlement and does not duplicate it", () => {
    const log = mkLog();
    render(<Host game="slots" log={log} rng={rng} />);
    stops(0, 3, 4);
    click("Pull lever");
    click("Leave table");
    expect(log.exits).toBe(1);
    expect(log.states).toHaveLength(1);
    expect(lastMoney(log)).toBe(990);
  });

  it("only offers bets the player can afford", () => {
    render(<Host game="slots" initial={{ ...rich, money: 25 }} log={mkLog()} />);
    click("Raise bet");
    expect(screen.getByTestId("slot-bet")).toHaveTextContent("$20");
    expect(screen.getByRole("button", { name: "Raise bet" })).toBeDisabled();
  });

  it("shows the paytable and the documented odds", () => {
    render(<Host game="slots" log={mkLog()} />);
    const table = screen.getByRole("region", { name: "Paytable" });
    expect(within(table).getByText("×300")).toBeInTheDocument();
    click("Odds");
    expect(screen.getByRole("dialog")).toHaveTextContent("92.75%");
  });

  it("shows first-visit Slots rules even with reduced motion", () => {
    window.localStorage.removeItem("tst-slots-rules-seen");
    vi.spyOn(window, "matchMedia").mockImplementation(
      (q: string) =>
        ({
          matches: q.includes("reduce"),
          media: q,
          onchange: null,
          addListener() {},
          removeListener() {},
          addEventListener() {},
          removeEventListener() {},
          dispatchEvent: () => false,
        }) as MediaQueryList,
    );
    render(<Host game="slots" log={mkLog()} />);
    expect(screen.getByRole("dialog")).toHaveTextContent("92.75%");
    click("Got it");
    expect(window.localStorage.getItem("tst-slots-rules-seen")).toBe("1");
  });

  it("with reduced motion the result appears at once but is still settled once", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (q: string) =>
        ({
          matches: q.includes("reduce"),
          media: q,
          addEventListener() {},
          removeEventListener() {},
          addListener() {},
          removeListener() {},
          onchange: null,
          dispatchEvent: () => false,
        }) as MediaQueryList,
    );
    const log = mkLog();
    render(<Host game="slots" log={log} rng={rng} />);
    stops(0, 3, 4);
    click("Pull lever");
    expect(screen.getByTestId("slot-result")).toHaveTextContent("No win");
    expect(log.states).toHaveLength(1);
  });
});
